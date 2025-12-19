import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePassword,
  validatePhone,
  validateRequired,
  validateFileSize,
  validateBI
} from '@/utils/validators'

describe('validators', () => {
  describe('validateEmail', () => {
    it('validates correct emails', () => {
      expect(validateEmail('test@example.com').valid).toBe(true)
      expect(validateEmail('user.name@domain.co.mz').valid).toBe(true)
    })

    it('rejects invalid emails', () => {
      expect(validateEmail('').valid).toBe(false)
      expect(validateEmail('invalid').valid).toBe(false)
      expect(validateEmail('test@').valid).toBe(false)
      expect(validateEmail('@example.com').valid).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('validates correct passwords', () => {
      expect(validatePassword('password123').valid).toBe(true)
      expect(validatePassword('verylongpassword').valid).toBe(true)
    })

    it('rejects invalid passwords', () => {
      expect(validatePassword('').valid).toBe(false)
      expect(validatePassword('short').valid).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('validates Mozambique phone numbers', () => {
      expect(validatePhone('841234567').valid).toBe(true)
      expect(validatePhone('258841234567').valid).toBe(true)
      expect(validatePhone('').valid).toBe(true) // Optional
    })

    it('rejects invalid phone numbers', () => {
      expect(validatePhone('12345').valid).toBe(false)
      expect(validatePhone('123456789012345').valid).toBe(false)
    })
  })

  describe('validateRequired', () => {
    it('validates non-empty values', () => {
      expect(validateRequired('value').valid).toBe(true)
    })

    it('rejects empty values', () => {
      expect(validateRequired('').valid).toBe(false)
      expect(validateRequired('   ').valid).toBe(false)
    })
  })

  describe('validateFileSize', () => {
    it('validates file size', () => {
      const smallFile = new File(['x'], 'test.txt', { type: 'text/plain' })
      expect(validateFileSize(smallFile, 10).valid).toBe(true)
      
      // Create a large file (mock)
      const largeFile = Object.create(File.prototype)
      Object.defineProperty(largeFile, 'size', { value: 20 * 1024 * 1024 }) // 20MB
      expect(validateFileSize(largeFile, 10).valid).toBe(false)
    })
  })

  describe('validateBI', () => {
    it('validates Mozambique BI format', () => {
      expect(validateBI('110100123456A').valid).toBe(true)
      expect(validateBI('').valid).toBe(true) // Optional
    })

    it('rejects invalid BI format', () => {
      expect(validateBI('12345').valid).toBe(false)
      expect(validateBI('110100123456').valid).toBe(false) // Missing letter
      expect(validateBI('ABCD00123456A').valid).toBe(false) // Wrong format
    })
  })
})

