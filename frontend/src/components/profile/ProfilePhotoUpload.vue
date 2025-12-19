<template>
  <div class="relative inline-block">
    <!-- Avatar Display -->
    <div 
      class="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer group"
      @click="handleClick"
    >
      <img
        v-if="avatarUrl"
        :src="avatarUrl"
        :alt="userName"
        class="w-full h-full object-cover"
      />
      <span
        v-else
        class="text-3xl font-bold text-gray-600 dark:text-gray-400"
      >
        {{ initials }}
      </span>
      
      <!-- Hover Overlay -->
      <div class="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <i class="fas fa-camera text-white text-2xl"></i>
      </div>
    </div>
    
    <!-- Camera Icon Badge -->
    <button
      class="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors"
      @click.stop="handleClick"
      aria-label="Alterar foto"
    >
      <i class="fas fa-camera text-sm"></i>
    </button>
    
    <!-- Loading Overlay -->
    <div
      v-if="isUploading"
      class="absolute inset-0 bg-white/90 dark:bg-dark-bg/90 rounded-full flex items-center justify-center"
    >
      <div class="spinner"></div>
    </div>
    
    <!-- Options Menu -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showOptions"
          class="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4"
          @click="showOptions = false"
        >
          <div
            class="bg-white dark:bg-dark-card rounded-t-xl md:rounded-xl w-full max-w-sm p-4 space-y-2"
            @click.stop
          >
            <h3 class="font-bold text-lg mb-4 text-center">Alterar Foto de Perfil</h3>
            
            <BaseButton
              variant="outline"
              full-width
              @click="handleCameraClick"
              :disabled="isUploading"
            >
              <i class="fas fa-camera mr-2"></i>
              Tirar Foto
            </BaseButton>
            
            <BaseButton
              variant="outline"
              full-width
              @click="handleGalleryClick"
              :disabled="isUploading"
            >
              <i class="fas fa-images mr-2"></i>
              Escolher da Galeria
            </BaseButton>
            
            <BaseButton
              v-if="avatarUrl"
              variant="outline"
              full-width
              @click="handleRemoveClick"
              :disabled="isUploading"
              class="text-danger"
            >
              <i class="fas fa-trash mr-2"></i>
              Remover Foto
            </BaseButton>
            
            <BaseButton
              variant="secondary"
              full-width
              @click="showOptions = false"
            >
              Cancelar
            </BaseButton>
          </div>
        </div>
      </Transition>
    </Teleport>
    
    <!-- Permission Modal -->
    <PermissionModal
      v-model="showPermissionModal"
      type="camera"
      :denied="cameraPermission.denied"
      :helpText="cameraHelpText"
      @allow="requestCameraPermission"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCamera } from '@/composables/useCamera'
import { useToast } from '@/composables/useToast'
import { supabase } from '@/utils/supabase'
import { compressImage } from '@/utils/imageCompression'
import BaseButton from '@/components/common/BaseButton.vue'
import PermissionModal from '@/components/common/PermissionModal.vue'

const authStore = useAuthStore()
const { capturePhoto, selectFromGallery, permissionState: cameraPermission, showPermissionHelp, checkPermission } = useCamera()
const { success, error: showError } = useToast()

const showOptions = ref(false)
const showPermissionModal = ref(false)
const isUploading = ref(false)

const avatarUrl = computed(() => authStore.profile?.avatar_url)
const userName = computed(() => authStore.profile?.full_name || 'User')
const initials = computed(() => {
  return userName.value
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

const cameraHelpText = computed(() => showPermissionHelp())

const handleClick = () => {
  showOptions.value = true
}

const handleCameraClick = async () => {
  showOptions.value = false
  
  // Check permission first
  await checkPermission()
  
  if (cameraPermission.value.denied) {
    showPermissionModal.value = true
    return
  }
  
  if (cameraPermission.value.prompt) {
    showPermissionModal.value = true
    return
  }
  
  await captureAndUpload(true)
}

const handleGalleryClick = async () => {
  showOptions.value = false
  await captureAndUpload(false)
}

const requestCameraPermission = async () => {
  await captureAndUpload(true)
}

const captureAndUpload = async (useCamera: boolean) => {
  try {
    isUploading.value = true
    
    // Capture photo
    const file = useCamera ? await capturePhoto() : await selectFromGallery()
    
    if (!file) {
      isUploading.value = false
      return
    }
    
    // Compress image
    const compressedFile = await compressImage(file, {
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.8
    })
    
    // Upload to Supabase
    const fileName = `avatar_${authStore.user?.id}_${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, compressedFile, {
        upsert: true
      })
    
    if (uploadError) throw uploadError
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)
    
    // Update profile
    const result = await authStore.updateProfile({
      avatar_url: urlData.publicUrl
    })
    
    if (result.success) {
      success('Foto de perfil atualizada!')
    } else {
      throw new Error(result.error)
    }
  } catch (err: any) {
    console.error('Upload error:', err)
    showError(err.message || 'Erro ao fazer upload da foto')
  } finally {
    isUploading.value = false
  }
}

const handleRemoveClick = async () => {
  showOptions.value = false
  
  try {
    isUploading.value = true
    
    const result = await authStore.updateProfile({
      avatar_url: ''
    })
    
    if (result.success) {
      success('Foto de perfil removida!')
    } else {
      throw new Error(result.error)
    }
  } catch (err: any) {
    showError(err.message || 'Erro ao remover foto')
  } finally {
    isUploading.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

