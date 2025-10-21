// Document Matching and Notification System
class DocumentMatcher {
    constructor() {
        this.supabase = supabase;
        this.setupEventListeners();
        this.initializeRealtimeSubscription();
    }

    // Initialize real-time subscription for document changes
    initializeRealtimeSubscription() {
        if (!this.supabase) {
            console.error('Supabase client not available');
            return;
        }

        // Subscribe to document inserts
        this.subscription = this.supabase
            .channel('document-inserts')
            .on('postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'documents' 
                }, 
                this.handleNewDocument.bind(this)
            )
            .subscribe();
    }

    // Handle new document insertions
    async handleNewDocument(payload) {
        try {
            const newDoc = payload.new;
            console.log('New document created:', newDoc);
            
            // Skip if it's not a found/lost document
            if (!['found', 'lost'].includes(newDoc.status)) {
                return;
            }

            // Find matching documents
            const matches = await this.findMatchingDocuments(newDoc);
            
            // Create notifications for each match
            for (const match of matches) {
                await this.createNotification(match.user_id, newDoc);
            }
        } catch (error) {
            console.error('Error handling new document:', error);
        }
    }

    // Calculate similarity score between two strings (0-1)
    calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        // Convert to uppercase and remove non-alphanumeric characters
        const cleanStr1 = String(str1).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const cleanStr2 = String(str2).toUpperCase().replace(/[^A-Z0-9]/g, '');
        
        // If either string is empty after cleaning, return 0
        if (!cleanStr1 || !cleanStr2) return 0;
        
        // If strings are equal, return 1
        if (cleanStr1 === cleanStr2) return 1;
        
        // Calculate Levenshtein distance
        const track = Array(cleanStr2.length + 1).fill(null).map(() => 
            Array(cleanStr1.length + 1).fill(null)
        );
        
        for (let i = 0; i <= cleanStr1.length; i++) track[0][i] = i;
        for (let j = 0; j <= cleanStr2.length; j++) track[j][0] = j;
        
        for (let j = 1; j <= cleanStr2.length; j++) {
            for (let i = 1; i <= cleanStr1.length; i++) {
                const indicator = cleanStr1[i - 1] === cleanStr2[j - 1] ? 0 : 1;
                track[j][i] = Math.min(
                    track[j][i - 1] + 1, // deletion
                    track[j - 1][i] + 1, // insertion
                    track[j - 1][i - 1] + indicator // substitution
                );
            }
        }
        
        const distance = track[cleanStr2.length][cleanStr1.length];
        return 1 - (distance / Math.max(cleanStr1.length, cleanStr2.length));
    }
    
    // Calculate distance between two coordinates in kilometers
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    toRad(degrees) {
        return degrees * Math.PI / 180;
    }
    
    // Get type-specific matching rules
    getTypeSpecificRules(docType) {
        const rules = {
            'id': {
                requiredFields: ['document_number', 'issue_date'],
                similarityThreshold: 0.9,
                maxDistanceKm: 50
            },
            'passport': {
                requiredFields: ['document_number', 'expiry_date'],
                similarityThreshold: 0.95,
                maxDistanceKm: 100
            },
            'driver_license': {
                requiredFields: ['document_number', 'issue_date'],
                similarityThreshold: 0.85,
                maxDistanceKm: 30
            },
            'default': {
                requiredFields: ['document_number'],
                similarityThreshold: 0.8,
                maxDistanceKm: 100
            }
        };
        
        return rules[docType] || rules['default'];
    }
    
    // Find documents that match the criteria with enhanced matching
    async findMatchingDocuments(newDoc) {
        try {
            // Get all potential matches (same type, opposite status, different user)
            const { data: potentialMatches, error } = await this.supabase
                .from('documents')
                .select('*')
                .eq('type', newDoc.type)
                .eq('status', newDoc.status === 'found' ? 'lost' : 'found')
                .neq('user_id', newDoc.user_id);
                
            if (error) throw error;
            if (!potentialMatches || potentialMatches.length === 0) return [];
            
            // Get type-specific matching rules
            const rules = this.getTypeSpecificRules(newDoc.type);
            
            // Calculate match scores for each potential match
            const matchesWithScores = await Promise.all(
                potentialMatches.map(async (doc) => {
                    let score = 0;
                    const matchDetails = [];
                    
                    // Document number similarity (most important)
                    const docNumSimilarity = this.calculateSimilarity(
                        newDoc.document_number, 
                        doc.document_number
                    );
                    
                    // Apply type-specific threshold
                    if (docNumSimilarity < rules.similarityThreshold) {
                        return null; // Skip if document number doesn't match well enough
                    }
                    
                    // Add to score (weighted heavily)
                    score += docNumSimilarity * 0.6;
                    matchDetails.push({
                        field: 'document_number',
                        similarity: docNumSimilarity,
                        weight: 0.6
                    });
                    
                    // Check required fields
                    for (const field of rules.requiredFields) {
                        if (field === 'document_number') continue; // Already checked
                        
                        if (newDoc[field] && doc[field]) {
                            const fieldSimilarity = this.calculateSimilarity(
                                String(newDoc[field]), 
                                String(doc[field])
                            );
                            
                            // Add to score with field-specific weight
                            const fieldWeight = 0.4 / rules.requiredFields.length;
                            score += fieldSimilarity * fieldWeight;
                            matchDetails.push({
                                field,
                                similarity: fieldSimilarity,
                                weight: fieldWeight
                            });
                        }
                    }
                    
                    // Location-based matching (if coordinates are available)
                    if (newDoc.latitude && newDoc.longitude && doc.latitude && doc.longitude) {
                        const distance = this.calculateDistance(
                            newDoc.latitude, newDoc.longitude,
                            doc.latitude, doc.longitude
                        );
                        
                        // Normalize distance to 0-1 score (closer is better)
                        const distanceScore = Math.max(0, 1 - (distance / rules.maxDistanceKm));
                        const distanceWeight = 0.2;
                        
                        score += distanceScore * distanceWeight;
                        matchDetails.push({
                            field: 'location',
                            distance_km: distance,
                            score: distanceScore,
                            weight: distanceWeight
                        });
                    }
                    
                    // Cap score at 1
                    score = Math.min(1, score);
                    
                    return {
                        ...doc,
                        match_score: score,
                        match_details: matchDetails,
                        match_timestamp: new Date().toISOString()
                    };
                })
            );
            
            // Filter out nulls and sort by score (highest first)
            return matchesWithScores
                .filter(match => match !== null && match.match_score >= 0.7) // Minimum threshold
                .sort((a, b) => b.match_score - a.match_score);
                
        } catch (error) {
            console.error('Error finding matching documents:', error);
            return [];
        }
    }

    // Create a notification for a match
    async createNotification(userId, matchedDoc) {
        try {
            const notification = {
                user_id: userId,
                type: 'document_match',
                title: 'Document Match Found!',
                message: `A ${matchedDoc.status} document matches your ${matchedDoc.status === 'found' ? 'lost' : 'found'} document.`,
                action_url: `/document/${matchedDoc.id}`,
                metadata: {
                    document_id: matchedDoc.id,
                    match_type: matchedDoc.status,
                    document_number: matchedDoc.document_number,
                    document_type: matchedDoc.type
                }
            };

            const { data, error } = await this.supabase
                .from('notifications')
                .insert([notification])
                .select();

            if (error) throw error;

            // Show a toast notification
            if (window.showToast) {
                window.showToast(notification.message, 'success');
            }

            return data;
        } catch (error) {
            console.error('Error creating notification:', error);
            return null;
        }
    }

    // Setup event listeners for document form submission
    setupEventListeners() {
        // Listen for document form submission
        document.addEventListener('submit', async (e) => {
            if (e.target.matches('#document-form, [data-document-form]')) {
                e.preventDefault();
                
                const form = e.target;
                const formData = new FormData(form);
                const documentData = {
                    type: formData.get('type'),
                    document_number: formData.get('document_number'),
                    status: formData.get('status'),
                    title: formData.get('title') || `${formData.get('type')} ${formData.get('document_number')}`,
                    description: formData.get('description') || '',
                    // Add other form fields as needed
                };

                try {
                    // Save the document
                    const { data: savedDoc, error } = await this.supabase
                        .from('documents')
                        .insert([documentData])
                        .select()
                        .single();

                    if (error) throw error;

                    // Show success message
                    if (window.showToast) {
                        window.showToast('Document saved successfully!', 'success');
                    }

                    // Close modal if exists
                    const modal = document.getElementById('document-modal');
                    if (modal) {
                        modal.style.display = 'none';
                    }

                    // Reload documents if the function exists
                    if (window.loadDocuments) {
                        window.loadDocuments();
                    }

                    // The real-time subscription will handle the matching
                    
                } catch (error) {
                    console.error('Error saving document:', error);
                    if (window.showToast) {
                        window.showToast('Failed to save document: ' + (error.message || 'Unknown error'), 'error');
                    }
                }
            }
        });
    }
}

// Initialize the document matcher when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof supabase !== 'undefined') {
        window.documentMatcher = new DocumentMatcher();
    } else {
        console.error('Supabase client not available for document matching');
    }
});
