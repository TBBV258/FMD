import { describe, it, expect } from 'vitest'
import {
  formatRelativeTime,
  formatFileSize,
  formatPhoneNumber,
  truncate,
  capitalize,
  slugify
} from '@/utils/formatters'

describe('formatters', () => {
  describe('formatRelativeTime', () => {
    it('formats recent times correctly', () => {
      const now = new Date()
      expect(formatRelativeTime(now)).toBe('Agora')
      
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m')
      
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h')
      
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(threeDaysAgo)).toBe('3d')
    })
  })

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB')
    })
  })

  describe('formatPhoneNumber', () => {
    it('formats Mozambique phone numbers', () => {
      expect(formatPhoneNumber('258841234567')).toBe('+258 84 123 4567')
      expect(formatPhoneNumber('841234567')).toBe('84 123 4567')
    })
  })

  describe('truncate', () => {
    it('truncates long text', () => {
      const text = 'This is a very long text that needs to be truncated'
      expect(truncate(text, 20)).toBe('This is a very long ...')
      expect(truncate('Short', 20)).toBe('Short')
    })
  })

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('HELLO')).toBe('Hello')
    })
  })

  describe('slugify', () => {
    it('creates URL-friendly slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('São Paulo')).toBe('sao-paulo')
      expect(slugify('Test  Multiple   Spaces')).toBe('test-multiple-spaces')
    })
  })
})

