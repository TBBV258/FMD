import { z } from 'zod';
import type { DocumentType } from '@/lib/types';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

// Document schemas
export const documentSchema = z.object({
  type: z.enum(['bi', 'passaporte', 'carta', 'outros'] as const, {
    required_error: 'Please select a document type',
  }),
  name: z.string().min(1, 'Document name is required'),
  number: z.string().optional(),
  description: z.string().optional(),
});

// Lost/Found report schemas
export const reportBaseSchema = z.object({
  document_type: z.enum(['bi', 'passaporte', 'carta', 'outros'] as const, {
    required_error: 'Please select a document type',
  }),
  document_name: z.string().min(1, 'Document name is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
  contact_info: z.string().min(1, 'Contact information is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const lostReportSchema = reportBaseSchema;
export const foundReportSchema = reportBaseSchema;

// Chat schema
export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000, 'Message is too long'),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  avatar_url: z.string().url().optional(),
});

// File upload validation
export const validateFile = (file: File, options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
} = {}) => {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] } = options;
  
  const errors: string[] = [];

  if (file.size > maxSize) {
    errors.push(`File size must be less than ${Math.round(maxSize / (1024 * 1024))}MB`);
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push('File type not supported. Please use JPG, PNG, WebP, or PDF');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Phone number validation
export const validatePhoneNumber = (phone: string, countryCode: string = '+244'): boolean => {
  // Remove spaces and format characters
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Basic validation - starts with country code or is a local number
  if (cleanPhone.startsWith('+')) {
    return /^\+\d{10,15}$/.test(cleanPhone);
  }
  
  // Local number validation (adjust patterns based on supported countries)
  const patterns: Record<string, RegExp> = {
    '+244': /^[89]\d{8}$/, // Angola
    '+258': /^[8-9]\d{8}$/, // Mozambique
    '+351': /^[9]\d{8}$/, // Portugal
    '+55': /^[1-9]\d{10}$/, // Brazil
  };

  const pattern = patterns[countryCode];
  return pattern ? pattern.test(cleanPhone) : /^\d{8,15}$/.test(cleanPhone);
};

// Location validation
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

// Type exports for form data
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type DocumentFormData = z.infer<typeof documentSchema>;
export type LostReportFormData = z.infer<typeof lostReportSchema>;
export type FoundReportFormData = z.infer<typeof foundReportSchema>;
export type ChatMessageFormData = z.infer<typeof chatMessageSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
