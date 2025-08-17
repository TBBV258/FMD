import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import type { Language } from '@/lib/types';

// Get locale based on language
const getLocale = (language: Language) => {
  return language === 'pt' ? ptBR : enUS;
};

// Format date for display
export const formatDate = (date: string | Date, language: Language = 'pt'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocale(language);
  
  if (isToday(dateObj)) {
    return format(dateObj, 'HH:mm', { locale });
  }
  
  if (isYesterday(dateObj)) {
    return language === 'pt' ? 'Ontem' : 'Yesterday';
  }
  
  return format(dateObj, 'dd/MM/yyyy', { locale });
};

// Format time for chat messages
export const formatTime = (date: string | Date, language: Language = 'pt'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocale(language);
  
  return format(dateObj, 'HH:mm', { locale });
};

// Format relative time
export const formatRelativeTime = (date: string | Date, language: Language = 'pt'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocale(language);
  
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale,
  });
};

// Format file size
export const formatFileSize = (bytes: number, language: Language = 'pt'): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = language === 'pt' 
    ? ['B', 'KB', 'MB', 'GB'] 
    : ['B', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Format phone number for display
export const formatPhoneNumber = (phone: string, countryCode: string = '+244'): string => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  if (cleanPhone.startsWith('+')) {
    return cleanPhone;
  }
  
  // Format based on country patterns
  const patterns: Record<string, (phone: string) => string> = {
    '+244': (p) => `+244 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}`, // Angola
    '+258': (p) => `+258 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5)}`, // Mozambique
    '+351': (p) => `+351 ${p.slice(0, 3)} ${p.slice(3, 6)} ${p.slice(6)}`, // Portugal
    '+55': (p) => `+55 ${p.slice(0, 2)} ${p.slice(2, 7)} ${p.slice(7)}`, // Brazil
  };

  const formatter = patterns[countryCode];
  return formatter ? formatter(cleanPhone) : `${countryCode} ${cleanPhone}`;
};

// Format coordinates for display
export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

// Capitalize first letter
export const capitalize = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Format document number for display (mask sensitive info)
export const formatDocumentNumber = (number: string, showFull: boolean = false): string => {
  if (!number || showFull) return number;
  
  if (number.length <= 4) return number;
  
  const visiblePart = number.slice(-4);
  const maskedPart = '*'.repeat(number.length - 4);
  
  return maskedPart + visiblePart;
};

// Format points with localized thousands separator
export const formatPoints = (points: number, language: Language = 'pt'): string => {
  return new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US').format(points);
};
