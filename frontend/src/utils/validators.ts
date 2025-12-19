/**
 * Form validation utilities
 */

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, error: 'Email é obrigatório' }
  }
  
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email)) {
    return { valid: false, error: 'Email inválido' }
  }
  
  return { valid: true }
}

/**
 * Validate password
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Senha é obrigatória' }
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Senha deve ter no mínimo 6 caracteres' }
  }
  
  if (password.length > 100) {
    return { valid: false, error: 'Senha muito longa' }
  }
  
  return { valid: true }
}

/**
 * Validate phone number (Mozambique)
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { valid: true } // Optional field
  }
  
  const cleaned = phone.replace(/\D/g, '')
  
  // Mozambique numbers: 9 digits or +258 + 9 digits
  if (cleaned.length === 9 || (cleaned.startsWith('258') && cleaned.length === 12)) {
    return { valid: true }
  }
  
  return { valid: false, error: 'Número de telefone inválido' }
}

/**
 * Validate required field
 */
export function validateRequired(value: string, fieldName = 'Campo'): ValidationResult {
  if (!value || !value.trim()) {
    return { valid: false, error: `${fieldName} é obrigatório` }
  }
  
  return { valid: true }
}

/**
 * Validate min length
 */
export function validateMinLength(
  value: string,
  minLength: number,
  fieldName = 'Campo'
): ValidationResult {
  if (value.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} deve ter no mínimo ${minLength} caracteres`
    }
  }
  
  return { valid: true }
}

/**
 * Validate max length
 */
export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName = 'Campo'
): ValidationResult {
  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} deve ter no máximo ${maxLength} caracteres`
    }
  }
  
  return { valid: true }
}

/**
 * Validate URL
 */
export function validateUrl(url: string): ValidationResult {
  if (!url) {
    return { valid: true } // Optional
  }
  
  try {
    new URL(url)
    return { valid: true }
  } catch {
    return { valid: false, error: 'URL inválida' }
  }
}

/**
 * Validate file size
 */
export function validateFileSize(
  file: File,
  maxSizeMB: number = 10
): ValidationResult {
  const maxBytes = maxSizeMB * 1024 * 1024
  
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB`
    }
  }
  
  return { valid: true }
}

/**
 * Validate file type
 */
export function validateFileType(
  file: File,
  allowedTypes: string[]
): ValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não suportado'
    }
  }
  
  return { valid: true }
}

/**
 * Validate document number (generic)
 */
export function validateDocumentNumber(number: string): ValidationResult {
  if (!number) {
    return { valid: true } // Optional
  }
  
  // Remove spaces and special characters
  const cleaned = number.replace(/[^a-zA-Z0-9]/g, '')
  
  if (cleaned.length < 5) {
    return { valid: false, error: 'Número de documento muito curto' }
  }
  
  if (cleaned.length > 30) {
    return { valid: false, error: 'Número de documento muito longo' }
  }
  
  return { valid: true }
}

/**
 * Validate BI (Bilhete de Identidade - Mozambique)
 */
export function validateBI(bi: string): ValidationResult {
  if (!bi) {
    return { valid: true } // Optional
  }
  
  // Format: 110100123456A (13 characters)
  const cleaned = bi.replace(/[^a-zA-Z0-9]/g, '')
  
  if (cleaned.length !== 13) {
    return {
      valid: false,
      error: 'BI deve ter 13 caracteres (ex: 110100123456A)'
    }
  }
  
  // Check format: 12 digits + 1 letter
  const pattern = /^\d{12}[A-Z]$/i
  if (!pattern.test(cleaned)) {
    return {
      valid: false,
      error: 'Formato de BI inválido (12 dígitos + 1 letra)'
    }
  }
  
  return { valid: true }
}

