// scan-ui.js - Interface do usuário para escaneamento
import DocumentScanner from './camera-processing.js';
import DocumentOCR from './document-ocr.js';
import { showToast } from './ui/toasts.js';
import { showModal } from './ui/modals.js';

class ScanUI {
    constructor() {
        this.scanner = new DocumentScanner();
        this.ocr = new DocumentOCR();
        this.stream = null;
        this.isProcessing = false;
    }

    async initialize(videoElement, canvasElement, previewElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.preview = previewElement;
        
        try {
            await this.scanner.init();
            await this.ocr.init();
            await this.startCamera();
            this.setupUI();
        } catch (error) {
            showToast('Erro ao inicializar câmera', 'error');
            console.error('Erro na inicialização:', error);
        }
    }

    async startCamera() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            this.video.srcObject = this.stream;
            await this.video.play();
        } catch (error) {
            throw new Error('Falha ao acessar câmera');
        }
    }

    setupUI() {
        // Overlay para visualização das bordas detectadas
        this.overlay = document.createElement('canvas');
        this.overlay.className = 'absolute inset-0 pointer-events-none';
        this.video.parentElement.appendChild(this.overlay);
        
        // Atualiza overlay em tempo real
        requestAnimationFrame(() => this.updateOverlay());
    }

    async updateOverlay() {
        if (this.isProcessing) return;
        
        const ctx = this.overlay.getContext('2d');
        const videoRect = this.video.getBoundingClientRect();
        
        this.overlay.width = videoRect.width;
        this.overlay.height = videoRect.height;
        
        ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        
        try {
            // Captura frame atual
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            const context = this.canvas.getContext('2d');
            context.drawImage(this.video, 0, 0);
            
            // Detecta bordas
            const imageData = context.getImageData(0, 0, this.canvas.width, this.canvas.height);
            const corners = await this.scanner.detectDocumentBorders(imageData);
            
            if (corners) {
                // Desenha contorno
                ctx.strokeStyle = '#00ff00';
                ctx.lineWidth = 3;
                ctx.beginPath();
                
                const scale = {
                    x: this.overlay.width / this.video.videoWidth,
                    y: this.overlay.height / this.video.videoHeight
                };
                
                for (let i = 0; i < corners.rows; i++) {
                    const point = corners.data32F.slice(i * 2, i * 2 + 2);
                    const x = point[0] * scale.x;
                    const y = point[1] * scale.y;
                    
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                
                ctx.closePath();
                ctx.stroke();
            }
        } catch (error) {
            console.error('Erro ao atualizar overlay:', error);
        }
        
        requestAnimationFrame(() => this.updateOverlay());
    }

    async capture() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        showToast('Processando imagem...', 'info');
        
        try {
            // Captura frame
            const context = this.canvas.getContext('2d');
            context.drawImage(this.video, 0, 0);
            const imageData = context.getImageData(0, 0, this.canvas.width, this.canvas.height);
            
            // Detecta e corrige perspectiva
            const corners = await this.scanner.detectDocumentBorders(imageData);
            if (!corners) throw new Error('Documento não detectado');
            
            const correctedImage = await this.scanner.correctPerspective(imageData, corners);
            
            // Otimiza para OCR
            const optimizedImage = await this.scanner.optimizeForOCR(correctedImage);
            
            // Extrai texto
            const ocrResult = await this.ocr.extractText(optimizedImage);
            
            // Mostra preview
            this.preview.src = correctedImage;
            this.preview.style.display = 'block';
            this.video.style.display = 'none';
            
            // Confirma dados extraídos
            const confirmed = await this.showConfirmation(ocrResult, correctedImage);
            
            if (confirmed) {
                showToast('Documento processado com sucesso!', 'success');
                return {
                    image: correctedImage,
                    optimizedImage,
                    ...ocrResult
                };
            } else {
                this.resetUI();
            }
        } catch (error) {
            showToast('Erro ao processar documento', 'error');
            console.error('Erro no processamento:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    async showConfirmation(ocrResult, image) {
        const { fields } = ocrResult;
        
        return showModal(`
            <div class="space-y-4">
                <h3 class="text-lg font-bold mb-4">Confirme os dados extraídos</h3>
                
                <div class="mb-4">
                    <img src="${image}" class="w-full rounded shadow" alt="Documento escaneado">
                </div>
                
                <div class="space-y-2">
                    ${fields.documentNumber ? `
                        <div>
                            <label class="block text-sm font-medium">Número do Documento</label>
                            <input type="text" value="${fields.documentNumber}" 
                                class="mt-1 block w-full rounded border p-2">
                        </div>
                    ` : ''}
                    
                    ${fields.name ? `
                        <div>
                            <label class="block text-sm font-medium">Nome</label>
                            <input type="text" value="${fields.name}" 
                                class="mt-1 block w-full rounded border p-2">
                        </div>
                    ` : ''}
                    
                    ${fields.date ? `
                        <div>
                            <label class="block text-sm font-medium">Data</label>
                            <input type="text" value="${fields.date}" 
                                class="mt-1 block w-full rounded border p-2">
                        </div>
                    ` : ''}
                </div>
            </div>
        `, {
            showCancel: true,
            confirmText: 'Confirmar Dados'
        });
    }

    resetUI() {
        this.preview.style.display = 'none';
        this.video.style.display = 'block';
    }

    async cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        await this.ocr.cleanup();
    }
}

export default ScanUI;