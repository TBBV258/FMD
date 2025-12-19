// Advanced Search and Filtering System for FindMyDocs
class SearchManager {
    constructor() {
        this.searchIndex = new Map();
        this.filters = {
            type: '',
            status: '',
            location: '',
            dateRange: null,
            distance: null,
            user: '',
            verified: null
        };
        
        this.searchHistory = [];
        this.savedSearches = new Map();
        this.searchCache = new Map();
        
        this.initializeSearch();
    }

    /**
     * Perform advanced search
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters
     * @param {Object} options - Search options
     */
    async search(query, filters = {}, options = {}) {
        const searchId = this.generateSearchId(query, filters);
        
        // Check cache first
        const cachedResult = this.searchCache.get(searchId);
        if (cachedResult && !options.forceRefresh) {
            return cachedResult;
        }

        const startTime = performance.now();
        
        try {
            // Combine filters
            const combinedFilters = { ...this.filters, ...filters };
            
            // Get base results
            let results = await this.getBaseResults(combinedFilters);
            
            // Apply text search if query provided
            if (query && query.trim()) {
                results = this.applyTextSearch(results, query.trim());
            }
            
            // Apply fuzzy matching
            if (options.fuzzy) {
                results = this.applyFuzzyMatching(results, query);
            }
            
            // Sort results by relevance
            results = this.sortByRelevance(results, query);
            
            // Apply pagination
            const paginatedResults = this.applyPagination(results, options);
            
            const endTime = performance.now();
            
            const searchResult = {
                results: paginatedResults.results,
                total: paginatedResults.total,
                query,
                filters: combinedFilters,
                searchTime: endTime - startTime,
                timestamp: new Date().toISOString()
            };
            
            // Cache result
            this.searchCache.set(searchId, searchResult);
            
            // Add to search history
            this.addToSearchHistory(query, combinedFilters);
            
            return searchResult;
            
        } catch (error) {
            if (window.ErrorHandler) {
                window.ErrorHandler.handle(error, 'search_error', { query, filters });
            }
            throw error;
        }
    }

    /**
     * Get base results from database
     */
    async getBaseResults(filters) {
        try {
            let query = window.supabase.from('documents').select('*');
            
            // Apply filters
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            
            if (filters.verified !== null) {
                query = query.eq('is_verified', filters.verified);
            }
            
            if (filters.dateRange) {
                if (filters.dateRange.start) {
                    query = query.gte('created_at', filters.dateRange.start);
                }
                if (filters.dateRange.end) {
                    query = query.lte('created_at', filters.dateRange.end);
                }
            }
            
            // Apply location filter
            if (filters.location) {
                query = query.ilike('location->address', `%${filters.location}%`);
            }
            
            // Apply distance filter
            if (filters.distance && filters.userLocation) {
                // This would require a more complex query with geographic calculations
                // For now, we'll filter client-side
            }
            
            const { data, error } = await query.order('created_at', { ascending: false });
            
            if (error) throw error;
            
            return data || [];
            
        } catch (error) {
            console.error('Error fetching base results:', error);
            return [];
        }
    }

    /**
     * Apply text search to results
     */
    applyTextSearch(results, query) {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
        
        return results.filter(doc => {
            const searchableText = [
                doc.title,
                doc.type,
                doc.description,
                doc.document_number,
                doc.location?.address || ''
            ].join(' ').toLowerCase();
            
            return searchTerms.every(term => searchableText.includes(term));
        });
    }

    /**
     * Apply fuzzy matching
     */
    applyFuzzyMatching(results, query) {
        const threshold = 0.6; // Similarity threshold
        
        return results.map(doc => {
            const similarity = this.calculateSimilarity(query, doc.title);
            return { ...doc, similarity };
        }).filter(doc => doc.similarity >= threshold)
          .sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Calculate string similarity using Levenshtein distance
     */
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    /**
     * Sort results by relevance
     */
    sortByRelevance(results, query) {
        return results.sort((a, b) => {
            // Exact matches first
            const aExact = a.title.toLowerCase().includes(query.toLowerCase());
            const bExact = b.title.toLowerCase().includes(query.toLowerCase());
            
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            // Then by similarity score if available
            if (a.similarity && b.similarity) {
                return b.similarity - a.similarity;
            }
            
            // Finally by creation date
            return new Date(b.created_at) - new Date(a.created_at);
        });
    }

    /**
     * Apply pagination to results
     */
    applyPagination(results, options) {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const offset = (page - 1) * limit;
        
        return {
            results: results.slice(offset, offset + limit),
            total: results.length,
            page,
            limit,
            totalPages: Math.ceil(results.length / limit)
        };
    }

    /**
     * Filter by geographic distance
     */
    filterByDistance(results, userLocation, maxDistance) {
        return results.filter(doc => {
            if (!doc.location?.lat || !doc.location?.lng) return false;
            
            const distance = this.calculateDistance(
                userLocation.lat,
                userLocation.lng,
                doc.location.lat,
                doc.location.lng
            );
            
            return distance <= maxDistance;
        });
    }

    /**
     * Calculate distance between two points (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     */
    deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    /**
     * Save search for later use
     */
    saveSearch(name, query, filters) {
        const searchId = this.generateSearchId(query, filters);
        this.savedSearches.set(name, {
            query,
            filters,
            id: searchId,
            createdAt: new Date().toISOString()
        });
        
        // Persist to localStorage
        this.persistSavedSearches();
    }

    /**
     * Load saved search
     */
    loadSavedSearch(name) {
        return this.savedSearches.get(name);
    }

    /**
     * Get all saved searches
     */
    getSavedSearches() {
        return Array.from(this.savedSearches.entries()).map(([name, search]) => ({
            name,
            ...search
        }));
    }

    /**
     * Delete saved search
     */
    deleteSavedSearch(name) {
        this.savedSearches.delete(name);
        this.persistSavedSearches();
    }

    /**
     * Add to search history
     */
    addToSearchHistory(query, filters) {
        const historyItem = {
            query,
            filters,
            timestamp: new Date().toISOString()
        };
        
        this.searchHistory.unshift(historyItem);
        
        // Keep only last 50 searches
        if (this.searchHistory.length > 50) {
            this.searchHistory = this.searchHistory.slice(0, 50);
        }
        
        this.persistSearchHistory();
    }

    /**
     * Get search suggestions based on history
     */
    getSearchSuggestions(query, limit = 5) {
        if (!query || query.length < 2) return [];
        
        const suggestions = new Set();
        
        // Add from search history
        this.searchHistory.forEach(item => {
            if (item.query.toLowerCase().includes(query.toLowerCase())) {
                suggestions.add(item.query);
            }
        });
        
        // Add from saved searches
        this.savedSearches.forEach(search => {
            if (search.query.toLowerCase().includes(query.toLowerCase())) {
                suggestions.add(search.query);
            }
        });
        
        return Array.from(suggestions).slice(0, limit);
    }

    /**
     * Generate unique search ID
     */
    generateSearchId(query, filters) {
        const filterString = JSON.stringify(filters);
        return btoa(query + filterString).replace(/[^a-zA-Z0-9]/g, '');
    }

    /**
     * Clear search cache
     */
    clearCache() {
        this.searchCache.clear();
    }

    /**
     * Initialize search functionality
     */
    initializeSearch() {
        this.loadSearchHistory();
        this.loadSavedSearches();
        
        // Clear cache every hour
        setInterval(() => {
            this.clearCache();
        }, 3600000);
    }

    /**
     * Persist search history to localStorage
     */
    persistSearchHistory() {
        try {
            localStorage.setItem('findmydocs_search_history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('Failed to persist search history:', error);
        }
    }

    /**
     * Load search history from localStorage
     */
    loadSearchHistory() {
        try {
            const saved = localStorage.getItem('findmydocs_search_history');
            if (saved) {
                this.searchHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load search history:', error);
        }
    }

    /**
     * Persist saved searches to localStorage
     */
    persistSavedSearches() {
        try {
            localStorage.setItem('findmydocs_saved_searches', JSON.stringify(Array.from(this.savedSearches.entries())));
        } catch (error) {
            console.warn('Failed to persist saved searches:', error);
        }
    }

    /**
     * Load saved searches from localStorage
     */
    loadSavedSearches() {
        try {
            const saved = localStorage.getItem('findmydocs_saved_searches');
            if (saved) {
                const entries = JSON.parse(saved);
                this.savedSearches = new Map(entries);
            }
        } catch (error) {
            console.warn('Failed to load saved searches:', error);
        }
    }

    /**
     * Get search statistics
     */
    getSearchStats() {
        return {
            totalSearches: this.searchHistory.length,
            savedSearches: this.savedSearches.size,
            cacheSize: this.searchCache.size,
            averageSearchTime: this.calculateAverageSearchTime()
        };
    }

    /**
     * Calculate average search time
     */
    calculateAverageSearchTime() {
        const recentSearches = this.searchHistory.slice(0, 10);
        if (recentSearches.length === 0) return 0;
        
        // This would need to be tracked during search execution
        return 0; // Placeholder
    }
}

// Initialize global search manager
window.searchManager = new SearchManager();

// Make SearchManager available globally
window.SearchManager = SearchManager;

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchManager;
}

export default SearchManager;
