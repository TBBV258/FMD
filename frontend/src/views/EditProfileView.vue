<template>
  <MainLayout>
    <div class="px-4 py-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-dark-text">Editar Perfil</h1>
        <button class="btn-icon" @click="router.back()">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Photo Upload -->
        <div class="card">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Foto de Perfil
          </label>
          <ProfilePhotoUpload />
        </div>

        <!-- Full Name -->
        <div class="card">
          <label for="fullName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome Completo *
          </label>
          <input
            id="fullName"
            v-model="form.full_name"
            type="text"
            required
            class="input"
            placeholder="Seu nome completo"
          />
        </div>

        <!-- Phone Number -->
        <div class="card">
          <label for="phoneNumber" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Número de Telemóvel/WhatsApp
          </label>
          <input
            id="phoneNumber"
            v-model="form.phone_number"
            type="tel"
            class="input"
            placeholder="+258 84 123 4567"
          />
          <p class="text-xs text-gray-500 mt-1">
            Este número será usado para contacto quando alguém encontrar o seu documento
          </p>
        </div>

        <!-- Delivery Address -->
        <div class="card">
          <label for="deliveryAddress" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Endereço de Entrega
          </label>
          <textarea
            id="deliveryAddress"
            v-model="form.delivery_address"
            rows="3"
            class="input"
            placeholder="Ex: Av. Julius Nyerere, nº 123, Maputo"
          />
          <p class="text-xs text-gray-500 mt-1">
            Este endereço será exibido para quem for entregar o documento ao utilizador
          </p>
        </div>

        <!-- Base Location -->
        <div class="card">
          <label for="baseLocation" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Localização Base (Cidade/Província)
          </label>
          <input
            id="baseLocation"
            v-model="form.base_location"
            type="text"
            class="input"
            placeholder="Ex: Maputo, Beira, Nampula"
          />
          <p class="text-xs text-gray-500 mt-1">
            Defina a sua cidade ou província para filtrar notificações relevantes
          </p>
        </div>

        <!-- ID Document (Optional) -->
        <div class="card">
          <label for="idDocument" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Documento de Identificação (Opcional)
          </label>
          <p class="text-xs text-gray-500 mb-2">
            Envie uma foto do seu documento de identificação para verificação. Isso aumenta a segurança da plataforma.
          </p>
          <div v-if="form.id_document_url" class="mb-2">
            <img
              :src="form.id_document_url"
              alt="ID Document"
              class="w-32 h-20 object-cover rounded border"
            />
            <button
              type="button"
              class="text-xs text-danger mt-1"
              @click="form.id_document_url = undefined"
            >
              Remover
            </button>
          </div>
          <input
            id="idDocument"
            type="file"
            accept="image/*"
            @change="handleIdDocumentUpload"
            class="input"
          />
        </div>

        <!-- Country -->
        <div class="card">
          <label for="country" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            País
          </label>
          <input
            id="country"
            v-model="form.country"
            type="text"
            class="input"
            placeholder="Moçambique"
          />
        </div>

        <!-- Actions -->
        <div class="flex space-x-3">
          <BaseButton
            type="button"
            variant="outline"
            size="lg"
            full-width
            @click="router.back()"
          >
            Cancelar
          </BaseButton>
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            full-width
            :loading="isSaving"
          >
            Guardar Alterações
          </BaseButton>
        </div>
      </form>

      <ToastContainer />
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { profilesApi } from '@/api/profiles'
import { useToast } from '@/composables/useToast'
import type { UserProfile } from '@/types'
import MainLayout from '@/components/layout/MainLayout.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ProfilePhotoUpload from '@/components/profile/ProfilePhotoUpload.vue'
import ToastContainer from '@/components/common/ToastContainer.vue'
import { supabase } from '@/api/supabase'

const router = useRouter()
const authStore = useAuthStore()
const { success, error: showError } = useToast()

const isSaving = ref(false)
const form = ref<Partial<UserProfile>>({
  full_name: '',
  phone_number: '',
  delivery_address: '',
  base_location: '',
  country: '',
  id_document_url: undefined
})

const loadProfile = async () => {
  if (!authStore.userId) {
    showError('Usuário não autenticado')
    router.push('/login')
    return
  }

  try {
    const profile = await profilesApi.get(authStore.userId)
    form.value = {
      full_name: profile.full_name || '',
      phone_number: profile.phone_number || '',
      delivery_address: profile.delivery_address || '',
      base_location: profile.base_location || '',
      country: profile.country || '',
      id_document_url: profile.id_document_url
    }
  } catch (err: any) {
    showError(err.message || 'Erro ao carregar perfil')
  }
}

const handleIdDocumentUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  try {
    // Upload to Supabase storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${authStore.userId}/id_document_${Date.now()}.${fileExt}`
    const filePath = `id_documents/${fileName}`

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path)

    form.value.id_document_url = publicUrl
    success('Documento carregado com sucesso!')
  } catch (err: any) {
    showError(err.message || 'Erro ao carregar documento')
  }
}

const handleSubmit = async () => {
  if (!authStore.userId) {
    showError('Usuário não autenticado')
    return
  }

  if (!form.value.full_name?.trim()) {
    showError('Nome completo é obrigatório')
    return
  }

  isSaving.value = true

  try {
    await profilesApi.update(authStore.userId, {
      full_name: form.value.full_name.trim(),
      phone_number: form.value.phone_number?.trim() || null,
      delivery_address: form.value.delivery_address?.trim() || null,
      base_location: form.value.base_location?.trim() || null,
      country: form.value.country?.trim() || null,
      id_document_url: form.value.id_document_url || null
    })

    // Reload profile in store
    await authStore.loadProfile()

    success('Perfil atualizado com sucesso!')
    router.back()
  } catch (err: any) {
    showError(err.message || 'Erro ao atualizar perfil')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

