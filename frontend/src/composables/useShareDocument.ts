import { ref } from 'vue'
import type { Document } from '@/types'

export function useShareDocument() {
  const isGenerating = ref(false)

  const generateShareImage = async (document: Document): Promise<string> => {
    isGenerating.value = true

    try {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        // Set canvas size (optimized for social media)
        canvas.width = 1200
        canvas.height = 630

        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        gradient.addColorStop(0, '#667eea')
        gradient.addColorStop(1, '#764ba2')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Load document image
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
          // Draw image (thumbnail or full image)
          const imgSize = 300
          const imgX = (canvas.width - imgSize) / 2
          const imgY = 100
          
          // Draw rounded rectangle for image
          ctx.save()
          ctx.beginPath()
          const radius = 20
          ctx.moveTo(imgX + radius, imgY)
          ctx.lineTo(imgX + imgSize - radius, imgY)
          ctx.quadraticCurveTo(imgX + imgSize, imgY, imgX + imgSize, imgY + radius)
          ctx.lineTo(imgX + imgSize, imgY + imgSize - radius)
          ctx.quadraticCurveTo(imgX + imgSize, imgY + imgSize, imgX + imgSize - radius, imgY + imgSize)
          ctx.lineTo(imgX + radius, imgY + imgSize)
          ctx.quadraticCurveTo(imgX, imgY + imgSize, imgX, imgY + imgSize - radius)
          ctx.lineTo(imgX, imgY + radius)
          ctx.quadraticCurveTo(imgX, imgY, imgX + radius, imgY)
          ctx.closePath()
          ctx.clip()
          ctx.drawImage(img, imgX, imgY, imgSize, imgSize)
          ctx.restore()

          // Draw title
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 48px Arial'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          const titleY = imgY + imgSize + 40
          ctx.fillText(document.title, canvas.width / 2, titleY)

          // Draw document type and status
          ctx.font = '32px Arial'
          ctx.fillStyle = '#e0e0e0'
          const typeStatus = `${document.type} - ${document.status === 'lost' ? 'Perdido' : 'Encontrado'}`
          ctx.fillText(typeStatus, canvas.width / 2, titleY + 60)

          // Draw location if available
          if (document.location_metadata) {
            const location = document.location_metadata as any
            ctx.font = '24px Arial'
            ctx.fillStyle = '#b0b0b0'
            const locationText = location.address || location.city || 'Localização não especificada'
            ctx.fillText(locationText, canvas.width / 2, titleY + 120)
          }

          // Draw date
          ctx.font = '20px Arial'
          ctx.fillStyle = '#909090'
          const date = new Date(document.created_at).toLocaleDateString('pt-BR')
          ctx.fillText(`Reportado em ${date}`, canvas.width / 2, titleY + 160)

          // Draw app name
          ctx.font = 'bold 28px Arial'
          ctx.fillStyle = '#ffffff'
          ctx.fillText('FindMyDocs', canvas.width / 2, canvas.height - 40)

          // Convert to blob URL
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              resolve(url)
            } else {
              reject(new Error('Failed to generate image'))
            }
            isGenerating.value = false
          }, 'image/png', 0.9)
        }

        img.onerror = () => {
          isGenerating.value = false
          reject(new Error('Failed to load document image'))
        }

        // Use thumbnail or file_url
        img.src = document.thumbnail_url || document.file_url || ''
      })
    } catch (error) {
      isGenerating.value = false
      throw error
    }
  }

  const shareToWhatsApp = async (document: Document, imageUrl?: string) => {
    const text = encodeURIComponent(
      `📄 Documento ${document.status === 'lost' ? 'Perdido' : 'Encontrado'}: ${document.title}\n\n` +
      `Tipo: ${document.type}\n` +
      (document.location_metadata ? `Local: ${(document.location_metadata as any).address || 'Ver no app'}\n` : '') +
      `\nVer mais: ${window.location.origin}/document/${document.id}`
    )

    const url = imageUrl 
      ? `https://wa.me/?text=${text}`
      : `https://wa.me/?text=${text}`

    window.open(url, '_blank')
  }

  const shareToFacebook = async (document: Document, imageUrl?: string) => {
    const url = encodeURIComponent(`${window.location.origin}/document/${document.id}`)
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`
    window.open(shareUrl, '_blank')
  }

  const downloadShareImage = async (imageUrl: string, filename: string = 'share-image.png') => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading image:', error)
      throw error
    }
  }

  return {
    isGenerating,
    generateShareImage,
    shareToWhatsApp,
    shareToFacebook,
    downloadShareImage
  }
}

