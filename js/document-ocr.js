// document-ocr.js - Módulo de OCR e extração de dados
import { showToast } from './ui/toasts.js';

// Carregar Tesseract dinamicamente
async function loadTesseract() {
  if (window.Tesseract) {
    return window.Tesseract;
  }
  
  // Carregar via CDN
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/tesseract.js@4.1.1/dist/tesseract.min.js';
    script.onload = () => resolve(window.Tesseract);
    script.onerror = () => reject(new Error('Failed to load Tesseract.js'));
    document.head.appendChild(script);
  });
}

class DocumentOCR {
    constructor() {
        this.worker = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            const Tesseract = await loadTesseract();
            this.worker = await Tesseract.createWorker({
                logger: progress => this.updateProgress(progress)
            });
            await this.worker.loadLanguage('por');
            await this.worker.initialize('por');
            this.initialized = true;
        } catch (error) {
            console.error('Erro ao inicializar OCR:', error);
            throw new Error('Falha ao inicializar OCR');
        }
    }

    updateProgress(progress) {
        if (progress.status === 'recognizing text') {
            const percentage = Math.round(progress.progress * 100);
            showToast(`Processando OCR: ${percentage}%`, 'info');
        }
    }

    async extractText(imageUrl) {
        if (!this.initialized) await this.init();

        try {
            const result = await this.worker.recognize(imageUrl);
            return this.parseResult(result);
        } catch (error) {
            console.error('Erro no OCR:', error);
            throw new Error('Falha ao extrair texto');
        }
    }

    parseResult(result) {
        const text = result.data.text;
        return {
            raw: text,
            fields: this.extractFields(text)
        };
    }

    extractFields(text) {
        const fields = {
            documentNumber: null,
            name: null,
            date: null
        };

        // Extrai número do documento (padrões comuns)
        const numberPatterns = [
            /\b\d{2,3}(?:\.\d{3}){2,3}\b/, // CPF/CNPJ
            /\b[A-Z]{2}\d{7,9}\b/,         // RG
            /\b\d{9,12}\b/                  // Outros documentos
        ];

        for (const pattern of numberPatterns) {
            const match = text.match(pattern);
            if (match) {
                fields.documentNumber = match[0];
                break;
            }
        }

        // Extrai nome (procura por padrões comuns em documentos)
        const namePatterns = [
            /NOME:?\s*([A-Z\s]{4,})/i,
            /PORTADOR:?\s*([A-Z\s]{4,})/i
        ];

        for (const pattern of namePatterns) {
            const match = text.match(pattern);
            if (match) {
                fields.name = match[1].trim();
                break;
            }
        }

        // Extrai data (diversos formatos)
        const datePatterns = [
            /\b\d{2}\/\d{2}\/\d{4}\b/,
            /\b\d{2}\.\d{2}\.\d{4}\b/,
            /\b\d{2}-\d{2}-\d{4}\b/
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                fields.date = match[0];
                break;
            }
        }

        return fields;
    }

    async cleanup() {
        if (this.worker) {
            await this.worker.terminate();
            this.worker = null;
            this.initialized = false;
        }
    }
}

export default DocumentOCR;