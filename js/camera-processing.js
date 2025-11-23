// camera-processing.js - Módulo de processamento avançado de imagem
import { showToast } from './ui/toasts.js';

class DocumentScanner {
    constructor() {
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        try {
            // Carrega OpenCV.js
            await this.loadOpenCV();
            this.initialized = true;
        } catch (error) {
            console.error('Erro ao inicializar scanner:', error);
            throw new Error('Falha ao inicializar o processamento de imagem');
        }
    }

    async loadOpenCV() {
        return new Promise((resolve, reject) => {
            if (window.cv) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://docs.opencv.org/master/opencv.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Falha ao carregar OpenCV'));
            document.body.appendChild(script);
        });
    }

    async detectDocumentBorders(imageData) {
        const cv = window.cv;
        if (!cv) throw new Error('OpenCV not loaded');
        const src = cv.matFromImageData(imageData);
        const dst = new cv.Mat();
        
        // Converte para escala de cinza
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        
        // Aplica blur Gaussiano para reduzir ruído
        cv.GaussianBlur(dst, dst, new cv.Size(5, 5), 0);
        
        // Detecção de bordas com Canny
        cv.Canny(dst, dst, 75, 200);
        
        // Encontra contornos
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(dst, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        
        // Encontra o maior contorno (provável documento)
        let maxArea = 0;
        let maxContourIndex = -1;
        
        for (let i = 0; i < contours.size(); i++) {
            const area = cv.contourArea(contours.get(i));
            if (area > maxArea) {
                maxArea = area;
                maxContourIndex = i;
            }
        }
        
        let corners = null;
        if (maxContourIndex >= 0) {
            const contour = contours.get(maxContourIndex);
            const peri = cv.arcLength(contour, true);
            corners = new cv.Mat();
            cv.approxPolyDP(contour, corners, 0.02 * peri, true);
        }
        
        // Limpa memória
        src.delete();
        dst.delete();
        contours.delete();
        hierarchy.delete();
        
        return corners;
    }

    async correctPerspective(imageData, corners) {
        const cv = window.cv;
        if (!cv) throw new Error('OpenCV not loaded');
        const src = cv.matFromImageData(imageData);
        const dst = new cv.Mat();
        
        // Dimensões do documento final (A4 em proporção)
        const width = 800;
        const height = Math.round(width * 1.414); // Proporção A4
        
        // Pontos de destino (retângulo)
        const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
            0, 0,
            width - 1, 0,
            width - 1, height - 1,
            0, height - 1
        ]);
        
        // Matriz de transformação
        const transform = cv.getPerspectiveTransform(corners, dstPoints);
        
        // Aplica a transformação
        cv.warpPerspective(src, dst, transform, new cv.Size(width, height));
        
        // Converte para ImageData
        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = width;
        resultCanvas.height = height;
        cv.imshow(resultCanvas, dst);
        
        // Limpa memória
        src.delete();
        dst.delete();
        transform.delete();
        dstPoints.delete();
        
        return resultCanvas.toDataURL('image/jpeg', 0.95);
    }

    async optimizeForOCR(imageUrl) {
        const cv = window.cv;
        if (!cv) throw new Error('OpenCV not loaded');
        const img = await this.loadImage(imageUrl);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const src = cv.imread(canvas);
        const dst = new cv.Mat();
        
        // Melhora o contraste
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
        cv.adaptiveThreshold(dst, dst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
        
        // Reduz ruído
        cv.medianBlur(dst, dst, 3);
        
        // Mostra resultado
        cv.imshow(canvas, dst);
        
        // Limpa memória
        src.delete();
        dst.delete();
        
        return canvas.toDataURL('image/jpeg', 0.95);
    }

    async loadImage(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = url;
        });
    }
}

export default DocumentScanner;