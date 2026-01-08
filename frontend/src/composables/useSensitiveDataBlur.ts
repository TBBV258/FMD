import { ref } from 'vue'
import { createWorker } from 'tesseract.js'

/**
 * Padrões de dados sensíveis para detecção
 */
const SENSITIVE_PATTERNS = [
  // Números de BI (Bilhete de Identidade) - formato moçambicano
  /\b\d{13}[A-Z]?\b/g, // 13 dígitos + letra opcional
  /\b\d{11,14}\b/g, // Números longos (possíveis números de documento)
  
  // NUIT (Número Único de Identificação Tributária)
  /\b\d{9}\b/g, // 9 dígitos
  
  // Datas (DD/MM/YYYY, DD-MM-YYYY)
  /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g,
  
  // Números de telefone
  /\b\+?258\s?\d{2}\s?\d{3}\s?\d{4}\b/g,
  /\b\d{9}\b/g, // 9 dígitos (telefone sem código)
  
  // Emails
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Palavras-chave sensíveis
  /\b(BI|BILHETE|IDENTIDADE|NUIT|PASSAPORTE|PASSPORT|NÚMERO|NUMBER)\s*:?\s*\d+/gi,
]

/**
 * Composables para detectar e aplicar blur em dados sensíveis em imagens
 */
export function useSensitiveDataBlur() {
  const isProcessing = ref(false)
  const progress = ref(0)

  /**
   * Detecta texto sensível em uma imagem usando OCR
   */
  const detectSensitiveText = async (imageFile: File): Promise<Array<{ x: number; y: number; width: number; height: number }>> => {
    isProcessing.value = true
    progress.value = 0

    try {
      const worker = await createWorker('por+eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            progress.value = Math.round(m.progress * 100)
          }
        }
      })

      const { data } = await worker.recognize(imageFile)
      await worker.terminate()

      const sensitiveRegions: Array<{ x: number; y: number; width: number; height: number }> = []

      // Processar cada palavra detectada
      data.words.forEach((word: any) => {
        const text = word.text.trim()
        
        // Verificar se o texto corresponde a algum padrão sensível
        for (const pattern of SENSITIVE_PATTERNS) {
          if (pattern.test(text)) {
            sensitiveRegions.push({
              x: word.bbox.x0,
              y: word.bbox.y0,
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0
            })
            break
          }
        }
      })

      return sensitiveRegions
    } catch (error) {
      console.error('Erro ao detectar texto sensível:', error)
      return []
    } finally {
      isProcessing.value = false
      progress.value = 0
    }
  }

  /**
   * Aplica blur nas regiões sensíveis detectadas
   */
  const applyBlurToRegions = async (
    imageFile: File,
    regions: Array<{ x: number; y: number; width: number; height: number }>
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Não foi possível criar contexto do canvas'))
        return
      }

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height

        // Desenhar imagem original
        ctx.drawImage(img, 0, 0)

        // Aplicar blur nas regiões sensíveis
        regions.forEach(region => {
          // Criar uma região temporária para aplicar blur
          const tempCanvas = document.createElement('canvas')
          const tempCtx = tempCanvas.getContext('2d')
          
          if (!tempCtx) return

          tempCanvas.width = region.width
          tempCanvas.height = region.height

          // Copiar região da imagem original
          tempCtx.drawImage(
            canvas,
            region.x, region.y, region.width, region.height,
            0, 0, region.width, region.height
          )

          // Aplicar blur usando filter
          ctx.save()
          ctx.filter = 'blur(15px)'
          ctx.drawImage(tempCanvas, region.x, region.y)
          ctx.restore()

          // Adicionar retângulo semi-transparente para garantir privacidade
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
          ctx.fillRect(region.x, region.y, region.width, region.height)
        })

        // Converter canvas para blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const blurredFile = new File([blob], imageFile.name, {
                type: imageFile.type,
                lastModified: Date.now()
              })
              resolve(blurredFile)
            } else {
              reject(new Error('Erro ao criar arquivo com blur'))
            }
          },
          imageFile.type,
          0.9
        )
      }

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'))
      }

      img.src = URL.createObjectURL(imageFile)
    })
  }

  /**
   * Processa imagem completa: detecta e aplica blur
   */
  const processImageForSensitiveData = async (imageFile: File): Promise<File> => {
    try {
      // Detectar regiões sensíveis
      const regions = await detectSensitiveText(imageFile)
      
      if (regions.length === 0) {
        // Se não detectou nada sensível, retorna arquivo original
        // Mas ainda aplica um aviso ao usuário
        return imageFile
      }

      // Aplicar blur nas regiões detectadas
      return await applyBlurToRegions(imageFile, regions)
    } catch (error) {
      console.error('Erro ao processar imagem:', error)
      // Em caso de erro, retorna arquivo original
      return imageFile
    }
  }

  /**
   * Versão simplificada: aplica blur em áreas comuns de documentos
   * (mais rápido, não requer OCR)
   */
  const applyCommonDocumentBlur = async (imageFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Não foi possível criar contexto do canvas'))
        return
      }

      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Áreas comuns onde dados sensíveis aparecem em documentos
        // Centro da imagem (onde geralmente está o número do documento)
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const blurWidth = canvas.width * 0.4
        const blurHeight = canvas.height * 0.15

        // Aplicar blur na região central
        ctx.save()
        ctx.filter = 'blur(20px)'
        ctx.drawImage(
          canvas,
          centerX - blurWidth / 2,
          centerY - blurHeight / 2,
          blurWidth,
          blurHeight,
          centerX - blurWidth / 2,
          centerY - blurHeight / 2,
          blurWidth,
          blurHeight
        )
        ctx.restore()

        // Adicionar overlay semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.fillRect(
          centerX - blurWidth / 2,
          centerY - blurHeight / 2,
          blurWidth,
          blurHeight
        )

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const blurredFile = new File([blob], imageFile.name, {
                type: imageFile.type,
                lastModified: Date.now()
              })
              resolve(blurredFile)
            } else {
              reject(new Error('Erro ao criar arquivo com blur'))
            }
          },
          imageFile.type,
          0.9
        )
      }

      img.onerror = () => {
        reject(new Error('Erro ao carregar imagem'))
      }

      img.src = URL.createObjectURL(imageFile)
    })
  }

  return {
    isProcessing,
    progress,
    detectSensitiveText,
    applyBlurToRegions,
    processImageForSensitiveData,
    applyCommonDocumentBlur
  }
}

