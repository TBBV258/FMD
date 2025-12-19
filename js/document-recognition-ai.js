// AI-Powered Document Recognition System for FindMyDocs
class DocumentRecognitionAI {
    constructor() {
        this.ocrEngine = null;
        this.documentPatterns = this.initializeDocumentPatterns();
        this.recognitionCache = new Map();
        this.isInitialized = false;
        
        this.initializeOCR();
    }

    /**
     * Initialize OCR engine
     */
    async initializeOCR() {
        try {
            // Load Tesseract.js for OCR
            if (typeof Tesseract !== 'undefined') {
                this.ocrEngine = await Tesseract.createWorker('eng+por', 1, {
                    logger: m => console.log('OCR Progress:', m)
                });
                await this.ocrEngine.initialize('eng+por');
                this.isInitialized = true;
                console.log('OCR Engine initialized successfully');
            } else {
                console.warn('Tesseract.js not available, using fallback recognition');
                this.isInitialized = true;
            }
        } catch (error) {
            console.error('Failed to initialize OCR:', error);
            this.isInitialized = true; // Continue with fallback
        }
    }

    /**
     * Initialize document recognition patterns
     */
    initializeDocumentPatterns() {
        return {
            'ID card': {
                patterns: [
                    /BI\s*(\d{6,12})/i,
                    /Bilhete\s+de\s+Identidade\s*(\d{6,12})/i,
                    /Identity\s+Card\s*(\d{6,12})/i,
                    /(\d{6,12})\s*BI/i
                ],
                fields: {
                    documentNumber: /(\d{6,12})/,
                    fullName: /Nome:\s*([A-Za-z\s]+)/i,
                    birthDate: /Data\s+de\s+Nascimento:\s*(\d{2}\/\d{2}\/\d{4})/i,
                    issueDate: /Data\s+de\s+Emissão:\s*(\d{2}\/\d{2}\/\d{4})/i,
                    expiryDate: /Data\s+de\s+Validade:\s*(\d{2}\/\d{2}\/\d{4})/i,
                    issuePlace: /Local\s+de\s+Emissão:\s*([A-Za-z\s,]+)/i
                }
            },
            'Passport': {
                patterns: [
                    /Passport\s+No[:\s]*([A-Z0-9]{6,12})/i,
                    /Passaporte\s+N[ºo][:\s]*([A-Z0-9]{6,12})/i,
                    /([A-Z]{2}\d{7})/,
                    /P[:\s]*([A-Z0-9]{6,12})/i
                ],
                fields: {
                    documentNumber: /([A-Z0-9]{6,12})/,
                    fullName: /Surname\/Apelido:\s*([A-Za-z\s]+)/i,
                    givenNames: /Given\s+Names\/Nomes:\s*([A-Za-z\s]+)/i,
                    nationality: /Nationality\/Nacionalidade:\s*([A-Za-z\s]+)/i,
                    birthDate: /Date\s+of\s+Birth\/Data\s+de\s+Nascimento:\s*(\d{2}\/\d{2}\/\d{4})/i,
                    issueDate: /Date\s+of\s+Issue\/Data\s+de\s+Emissão:\s*(\d{2}\/\d{2}\/\d{4})/i,
                    expiryDate: /Date\s+of\s+Expiry\/Data\s+de\s+Validade:\s*(\d{2}\/\d{2}\/\d{4})/i
                }
            },
            'DIRE': {
                patterns: [
                    /DIRE\s*(\d{8,12})/i,
                    /Direcção\s+de\s+Identificação\s*(\d{8,12})/i,
                    /(\d{8,12})\s*DIRE/i
                ],
                fields: {
                    documentNumber: /(\d{8,12})/,
                    fullName: /Nome\s+Completo:\s*([A-Za-z\s]+)/i,
                    birthDate: /Data\s+de\s+Nascimento:\s*(\d{2}\/\d{2}\/\d{4})/i,
                    issueDate: /Data\s+de\s+Emissão:\s*(\d{2}\/\d{2}\/\d{4})/i,
                    expiryDate: /Data\s+de\s+Validade:\s*(\d{2}\/\d{2}\/\d{4})/i
                }
            },
            'Bank Card': {
                patterns: [
                    /Card\s+Number[:\s]*(\d{4}\s?\d{4}\s?\d{4}\s?\d{4})/i,
                    /Número\s+do\s+Cartão[:\s]*(\d{4}\s?\d{4}\s?\d{4}\s?\d{4})/i,
                    /(\d{4}\s?\d{4}\s?\d{4}\s?\d{4})/
                ],
                fields: {
                    cardNumber: /(\d{4}\s?\d{4}\s?\d{4}\s?\d{4})/,
                    cardholderName: /Cardholder\s+Name[:\s]*([A-Za-z\s]+)/i,
                    expiryDate: /Expiry\s+Date[:\s]*(\d{2}\/\d{2})/i,
                    bankName: /Bank[:\s]*([A-Za-z\s]+)/i
                }
            }
        };
    }

    /**
     * Recognize document from image
     * @param {File|Blob} imageFile - Image file to analyze
     * @param {string} expectedType - Expected document type
     * @returns {Promise<Object>} Recognition results
     */
    async recognizeDocument(imageFile, expectedType = null) {
        try {
            // Check cache first
            const cacheKey = await this.generateCacheKey(imageFile);
            if (this.recognitionCache.has(cacheKey)) {
                return this.recognitionCache.get(cacheKey);
            }

            // Show loading state
            if (window.loadingManager) {
                window.loadingManager.showLoading('document-recognition', 'spinner', {
                    message: 'Analisando documento...'
                });
            }

            const results = {
                success: false,
                documentType: null,
                extractedData: {},
                confidence: 0,
                suggestions: [],
                errors: []
            };

            // Perform OCR if available
            let ocrText = '';
            if (this.ocrEngine && this.isInitialized) {
                try {
                    const { data: { text } } = await this.ocrEngine.recognize(imageFile);
                    ocrText = text;
                } catch (ocrError) {
                    console.warn('OCR failed, using fallback:', ocrError);
                    results.errors.push('OCR processing failed');
                }
            }

            // If OCR failed, try image analysis
            if (!ocrText) {
                ocrText = await this.analyzeImageFallback(imageFile);
            }

            // Extract document information
            const extractionResults = this.extractDocumentInfo(ocrText, expectedType);
            Object.assign(results, extractionResults);

            // Generate suggestions
            results.suggestions = this.generateSuggestions(results);

            // Cache results
            this.recognitionCache.set(cacheKey, results);

            // Hide loading state
            if (window.loadingManager) {
                window.loadingManager.hideLoading('document-recognition');
            }

            return results;

        } catch (error) {
            console.error('Document recognition failed:', error);
            
            if (window.loadingManager) {
                window.loadingManager.hideLoading('document-recognition');
            }

            if (window.ErrorHandler) {
                window.ErrorHandler.handle(error, 'document_recognition');
            }

            return {
                success: false,
                documentType: null,
                extractedData: {},
                confidence: 0,
                suggestions: [],
                errors: ['Falha na análise do documento']
            };
        }
    }

    /**
     * Extract document information from OCR text
     */
    extractDocumentInfo(text, expectedType = null) {
        const results = {
            success: false,
            documentType: null,
            extractedData: {},
            confidence: 0
        };

        if (!text || text.trim().length < 10) {
            return results;
        }

        // Try to identify document type
        let bestMatch = null;
        let bestConfidence = 0;

        for (const [docType, config] of Object.entries(this.documentPatterns)) {
            let confidence = 0;
            let matches = 0;

            // Check patterns
            for (const pattern of config.patterns) {
                if (pattern.test(text)) {
                    confidence += 30;
                    matches++;
                }
            }

            // Check field extraction
            for (const [fieldName, fieldPattern] of Object.entries(config.fields)) {
                const match = text.match(fieldPattern);
                if (match) {
                    confidence += 10;
                    matches++;
                }
            }

            // Bonus for expected type
            if (expectedType && docType.toLowerCase().includes(expectedType.toLowerCase())) {
                confidence += 20;
            }

            if (confidence > bestConfidence) {
                bestConfidence = confidence;
                bestMatch = { type: docType, config };
            }
        }

        if (bestMatch && bestConfidence > 20) {
            results.success = true;
            results.documentType = bestMatch.type;
            results.confidence = Math.min(100, bestConfidence);

            // Extract specific fields
            const extractedData = {};
            for (const [fieldName, fieldPattern] of Object.entries(bestMatch.config.fields)) {
                const match = text.match(fieldPattern);
                if (match) {
                    extractedData[fieldName] = match[1].trim();
                }
            }

            results.extractedData = extractedData;
        }

        return results;
    }

    /**
     * Fallback image analysis when OCR is not available
     */
    async analyzeImageFallback(imageFile) {
        // This would implement basic image analysis
        // For now, return empty string
        return '';
    }

    /**
     * Generate suggestions based on recognition results
     */
    generateSuggestions(results) {
        const suggestions = [];

        if (!results.success) {
            suggestions.push({
                type: 'error',
                message: 'Não foi possível identificar o tipo de documento',
                action: 'manual_entry'
            });
            return suggestions;
        }

        // Suggest missing fields
        const requiredFields = this.getRequiredFields(results.documentType);
        for (const field of requiredFields) {
            if (!results.extractedData[field.name]) {
                suggestions.push({
                    type: 'missing_field',
                    field: field.name,
                    message: `Campo ${field.label} não encontrado`,
                    action: 'fill_manually'
                });
            }
        }

        // Suggest improvements
        if (results.confidence < 70) {
            suggestions.push({
                type: 'low_confidence',
                message: 'Confiança baixa na extração. Verifique os dados.',
                action: 'review_data'
            });
        }

        // Suggest document type if different from expected
        if (results.documentType) {
            suggestions.push({
                type: 'document_type',
                message: `Documento identificado como: ${results.documentType}`,
                action: 'confirm_type'
            });
        }

        return suggestions;
    }

    /**
     * Get required fields for document type
     */
    getRequiredFields(documentType) {
        const fieldMappings = {
            'ID card': [
                { name: 'documentNumber', label: 'Número do Documento', required: true },
                { name: 'fullName', label: 'Nome Completo', required: true },
                { name: 'birthDate', label: 'Data de Nascimento', required: false },
                { name: 'issueDate', label: 'Data de Emissão', required: false },
                { name: 'expiryDate', label: 'Data de Validade', required: false }
            ],
            'Passport': [
                { name: 'documentNumber', label: 'Número do Passaporte', required: true },
                { name: 'fullName', label: 'Nome Completo', required: true },
                { name: 'nationality', label: 'Nacionalidade', required: false },
                { name: 'birthDate', label: 'Data de Nascimento', required: false },
                { name: 'expiryDate', label: 'Data de Validade', required: true }
            ],
            'DIRE': [
                { name: 'documentNumber', label: 'Número do DIRE', required: true },
                { name: 'fullName', label: 'Nome Completo', required: true },
                { name: 'birthDate', label: 'Data de Nascimento', required: false },
                { name: 'issueDate', label: 'Data de Emissão', required: false }
            ],
            'Bank Card': [
                { name: 'cardNumber', label: 'Número do Cartão', required: true },
                { name: 'cardholderName', label: 'Nome do Portador', required: true },
                { name: 'expiryDate', label: 'Data de Validade', required: true },
                { name: 'bankName', label: 'Nome do Banco', required: false }
            ]
        };

        return fieldMappings[documentType] || [];
    }

    /**
     * Generate cache key for image file
     */
    async generateCacheKey(imageFile) {
        // Create a simple hash based on file properties
        const fileInfo = `${imageFile.name}_${imageFile.size}_${imageFile.lastModified}`;
        return btoa(fileInfo).replace(/[^a-zA-Z0-9]/g, '');
    }

    /**
     * Validate extracted data
     */
    validateExtractedData(data, documentType) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        const requiredFields = this.getRequiredFields(documentType);
        
        for (const field of requiredFields) {
            if (field.required && !data[field.name]) {
                validation.isValid = false;
                validation.errors.push(`${field.label} é obrigatório`);
            }
        }

        // Validate specific field formats
        if (data.documentNumber) {
            const docNumberPattern = /^[A-Za-z0-9]{6,12}$/;
            if (!docNumberPattern.test(data.documentNumber)) {
                validation.warnings.push('Formato do número do documento pode estar incorreto');
            }
        }

        if (data.birthDate || data.issueDate || data.expiryDate) {
            const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
            ['birthDate', 'issueDate', 'expiryDate'].forEach(dateField => {
                if (data[dateField] && !datePattern.test(data[dateField])) {
                    validation.warnings.push(`Formato da data ${dateField} pode estar incorreto`);
                }
            });
        }

        return validation;
    }

    /**
     * Get recognition statistics
     */
    getRecognitionStats() {
        return {
            cacheSize: this.recognitionCache.size,
            isOCRInitialized: this.isInitialized,
            supportedDocumentTypes: Object.keys(this.documentPatterns),
            totalRecognitions: this.recognitionCache.size
        };
    }

    /**
     * Clear recognition cache
     */
    clearCache() {
        this.recognitionCache.clear();
    }

    /**
     * Cleanup OCR engine
     */
    async cleanup() {
        if (this.ocrEngine) {
            await this.ocrEngine.terminate();
            this.ocrEngine = null;
        }
    }
}

// Initialize global document recognition AI
window.documentRecognitionAI = new DocumentRecognitionAI();

// Make DocumentRecognitionAI available globally
window.DocumentRecognitionAI = DocumentRecognitionAI;

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocumentRecognitionAI;
}

export default DocumentRecognitionAI;

