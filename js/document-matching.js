// document-matching.js
// Lógica de crowd-matching e sugestões

/**
 * Sugere documentos que podem corresponder ao documento fornecido
 * @param {Object} documentData - Dados do documento (number, type, status)
 * @returns {Promise<Array>} Array de documentos que correspondem
 */
export async function suggestMatch(documentData) {
    // Busca documentos similares usando o cliente Supabase global
    if (!window.supabase) {
        console.error('Supabase client not initialized');
        return [];
    }

    if (!documentData || !documentData.number || !documentData.type) {
        console.warn('Invalid document data for matching');
        return [];
    }

    try {
        // Buscar documentos com status oposto e mesmo tipo
        const oppositeStatus = documentData.status === 'found' ? 'lost' : 'found';
        
        const { data, error } = await window.supabase
            .from('documents')
            .select('id, user_id, title, type, document_number, status, location, created_at, description')
            .eq('document_number', documentData.number)
            .eq('type', documentData.type)
            .eq('status', oppositeStatus)
            .neq('user_id', documentData.userId || ''); // Não incluir documentos do próprio usuário

        if (error) {
            console.error('Error matching documents:', error);
            return [];
        }

        // Calcular score de correspondência para cada documento
        const matches = (data || []).map(doc => {
            let matchScore = 100; // Score base para correspondência exata

            // Reduzir score se não houver localização
            if (!doc.location || !documentData.location) {
                matchScore -= 10;
            } else {
                // Calcular distância se ambas têm localização
                const distance = calculateDistance(
                    documentData.location,
                    doc.location
                );
                if (distance > 50) {
                    matchScore -= 20; // Reduzir score se muito distante
                } else if (distance > 10) {
                    matchScore -= 10; // Reduzir um pouco se moderadamente distante
                }
            }

            return {
                ...doc,
                matchScore: Math.max(0, matchScore), // Garantir score não negativo
                distance: doc.location && documentData.location 
                    ? calculateDistance(documentData.location, doc.location)
                    : null
            };
        });

        // Ordenar por score de correspondência (maior primeiro)
        return matches.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
        console.error('Error in suggestMatch:', error);
        return [];
    }
}

/**
 * Calcula distância entre duas localizações usando fórmula de Haversine
 * @param {Object} loc1 - Localização 1 {lat, lng}
 * @param {Object} loc2 - Localização 2 {lat, lng}
 * @returns {number} Distância em quilômetros
 */
function calculateDistance(loc1, loc2) {
    if (!loc1 || !loc2 || !loc1.lat || !loc1.lng || !loc2.lat || !loc2.lng) {
        return null;
    }

    const R = 6371; // Raio da Terra em km
    const dLat = toRad(loc2.lat - loc1.lat);
    const dLon = toRad(loc2.lng - loc1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(loc1.lat)) * Math.cos(toRad(loc2.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Arredondar para 1 casa decimal
}

/**
 * Converte graus para radianos
 * @param {number} degrees - Graus
 * @returns {number} Radianos
 */
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Busca documentos similares (busca parcial por número)
 * @param {Object} documentData - Dados do documento
 * @param {number} minSimilarity - Similaridade mínima (0-100)
 * @returns {Promise<Array>} Array de documentos similares
 */
export async function findSimilarDocuments(documentData, minSimilarity = 70) {
    if (!window.supabase || !documentData || !documentData.number) {
        return [];
    }

    try {
        // Buscar documentos com número parcialmente similar
        const { data, error } = await window.supabase
            .from('documents')
            .select('id, user_id, title, type, document_number, status, location, created_at')
            .ilike('document_number', `%${documentData.number}%`)
            .eq('type', documentData.type);

        if (error) {
            console.error('Error finding similar documents:', error);
            return [];
        }

        // Calcular similaridade para cada documento
        const similar = (data || [])
            .filter(doc => doc.id !== documentData.id) // Excluir o próprio documento
            .map(doc => {
                const similarity = calculateSimilarity(
                    documentData.number,
                    doc.document_number
                );
                return {
                    ...doc,
                    similarity
                };
            })
            .filter(doc => doc.similarity >= minSimilarity)
            .sort((a, b) => b.similarity - a.similarity);

        return similar;
    } catch (error) {
        console.error('Error in findSimilarDocuments:', error);
        return [];
    }
}

/**
 * Calcula similaridade entre duas strings (usando algoritmo de Levenshtein)
 * @param {string} str1 - String 1
 * @param {string} str2 - String 2
 * @returns {number} Similaridade em percentual (0-100)
 */
function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 100;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 100;

    const distance = levenshteinDistance(longer, shorter);
    const similarity = ((longer.length - distance) / longer.length) * 100;

    return Math.round(similarity);
}

/**
 * Calcula distância de Levenshtein entre duas strings
 * @param {string} str1 - String 1
 * @param {string} str2 - String 2
 * @returns {number} Distância
 */
function levenshteinDistance(str1, str2) {
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
 * Verifica se um documento encontrado corresponde a algum documento perdido
 * @param {Object} foundDocument - Documento encontrado
 * @returns {Promise<Array>} Array de documentos perdidos que correspondem
 */
export async function checkFoundDocumentMatches(foundDocument) {
    if (!foundDocument || !foundDocument.document_number || !foundDocument.type) {
        return [];
    }

    return await suggestMatch({
        number: foundDocument.document_number,
        type: foundDocument.type,
        status: 'found',
        userId: foundDocument.user_id,
        location: foundDocument.location
    });
}

/**
 * Verifica se um documento perdido corresponde a algum documento encontrado
 * @param {Object} lostDocument - Documento perdido
 * @returns {Promise<Array>} Array de documentos encontrados que correspondem
 */
export async function checkLostDocumentMatches(lostDocument) {
    if (!lostDocument || !lostDocument.document_number || !lostDocument.type) {
        return [];
    }

    return await suggestMatch({
        number: lostDocument.document_number,
        type: lostDocument.type,
        status: 'lost',
        userId: lostDocument.user_id,
        location: lostDocument.location
    });
}
