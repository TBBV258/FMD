<template>
  <div class="space-y-4">
    <div v-if="isLoading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p class="mt-2 text-sm text-gray-500">Carregando faturas...</p>
    </div>

    <div v-else-if="invoices.length === 0" class="text-center py-8 text-gray-500">
      <i class="fas fa-file-invoice text-4xl mb-2"></i>
      <p>Nenhuma fatura encontrada</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="invoice in invoices"
        :key="invoice.id"
        class="border border-gray-200 dark:border-dark-border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div class="flex items-center justify-between mb-2">
          <div>
            <p class="font-semibold text-gray-900 dark:text-dark-text">
              {{ invoice.invoice_number }}
            </p>
            <p class="text-sm text-gray-500">
              {{ formatDate(invoice.created_at) }}
            </p>
          </div>
          <div class="text-right">
            <p class="font-bold text-gray-900 dark:text-dark-text">
              {{ formatCurrency(invoice.total_amount, invoice.currency) }}
            </p>
            <span :class="getStatusBadgeClass(invoice.status)">
              {{ getStatusLabel(invoice.status) }}
            </span>
          </div>
        </div>
        
        <div v-if="invoice.description" class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {{ invoice.description }}
        </div>

        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-dark-border">
          <button
            class="text-sm text-primary hover:underline"
            @click="downloadInvoice(invoice.id)"
          >
            <i class="fas fa-download mr-1"></i>
            Baixar PDF
          </button>
          <button
            v-if="invoice.status === 'pending'"
            class="text-sm text-primary hover:underline"
            @click="viewPayment(invoice.id)"
          >
            Pagar Agora
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { invoicesApi, type Invoice } from '@/api/invoices'
import { useToast } from '@/composables/useToast'

const authStore = useAuthStore()
const { error: showError } = useToast()

const invoices = ref<Invoice[]>([])
const isLoading = ref(false)

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const formatCurrency = (amount: number, currency: string = 'MZN') => {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

const getStatusBadgeClass = (status: string) => {
  const classes = {
    paid: 'badge badge-success',
    pending: 'badge badge-warning',
    failed: 'badge badge-danger',
    refunded: 'badge bg-blue-500/10 text-blue-600',
    cancelled: 'badge bg-gray-500/10 text-gray-600'
  }
  return classes[status as keyof typeof classes] || 'badge'
}

const getStatusLabel = (status: string) => {
  const labels = {
    paid: 'Pago',
    pending: 'Pendente',
    failed: 'Falhou',
    refunded: 'Reembolsado',
    cancelled: 'Cancelado'
  }
  return labels[status as keyof typeof labels] || status
}

const downloadInvoice = async (invoiceId: string) => {
  try {
    const blob = await invoicesApi.downloadInvoice(invoiceId)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `invoice-${invoiceId}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err: any) {
    showError(err.message || 'Erro ao baixar fatura')
  }
}

const viewPayment = (invoiceId: string) => {
  // TODO: Implement payment flow
  showError('Funcionalidade de pagamento em breve!')
}

const loadInvoices = async () => {
  if (!authStore.userId) return

  isLoading.value = true
  try {
    invoices.value = await invoicesApi.getUserInvoices(authStore.userId)
  } catch (err: any) {
    showError(err.message || 'Erro ao carregar faturas')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadInvoices()
})
</script>

