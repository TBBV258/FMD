import type { StorageService, DocumentFile } from '@/lib/types';
import { authService, STORAGE_BUCKETS } from './AuthService';

class StorageServiceImpl implements StorageService {
  async uploadDocumentFiles(files: File[], documentId: string): Promise<DocumentFile[]> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    console.log('📤 Storage: Starting file upload for document:', documentId, 'Files count:', files.length);
    
    // Validate files
    this.validateFiles(files);

    const uploadPromises = files.map(async (file, index) => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const fileName = `${documentId}/${Date.now()}_${index}.${fileExtension}`;
      console.log('📤 Storage: Uploading file:', file.name, 'as:', fileName);
      
      const { data: uploadData, error: uploadError } = await client.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('📤 Storage: Upload error for', file.name, ':', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = client.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .getPublicUrl(fileName);

      const fileData = {
        id: `file_${Date.now()}_${index}`,
        filename: fileName,
        originalName: file.name,
        size: file.size,
        mimetype: file.type,
        url: publicUrl,
      };
      
      console.log('📤 Storage: File uploaded successfully:', fileData);
      return fileData;
    });

    const results = await Promise.all(uploadPromises);
    console.log('📤 Storage: All files uploaded successfully:', results);
    return results;
  }

  async uploadAvatar(file: File, userId: string): Promise<string> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    // Validate avatar file
    this.validateAvatarFile(file);

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/avatar.${fileExtension}`;
    
    const { error: uploadError } = await client.storage
      .from(STORAGE_BUCKETS.AVATARS)
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true, // Allow overwriting existing avatar
      });

    if (uploadError) throw uploadError;

    return this.getPublicUrl(STORAGE_BUCKETS.AVATARS, fileName);
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { error } = await client.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  }

  getPublicUrl(bucket: string, path: string): string {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data } = client.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async downloadFile(bucket: string, path: string): Promise<Blob> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const { data, error } = await client.storage
      .from(bucket)
      .download(path);

    if (error) throw error;
    return data;
  }

  async deleteDocumentFiles(files: DocumentFile[]): Promise<void> {
    const client = authService.getClient();
    if (!client) throw new Error('Supabase client not initialized');

    const filePaths = files.map(file => file.filename);
    
    if (filePaths.length > 0) {
      console.log('🗑️ Storage: Deleting files:', filePaths);
      const { error } = await client.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .remove(filePaths);

      if (error) {
        console.error('🗑️ Storage: Error deleting files:', error);
        throw error;
      }
      
      console.log('🗑️ Storage: Files deleted successfully');
    }
  }

  // Helper method to validate file upload constraints
  validateFiles(files: File[], maxFiles = 5, maxSizePerFile = 5 * 1024 * 1024): void {
    if (files.length > maxFiles) {
      throw new Error(`Maximum ${maxFiles} files allowed.`);
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    
    for (const file of files) {
      if (file.size > maxSizePerFile) {
        throw new Error(`File ${file.name} is too large. Maximum size is ${Math.round(maxSizePerFile / 1024 / 1024)}MB.`);
      }
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File ${file.name} has an unsupported format. Only JPG, PNG, and PDF files are allowed.`);
      }
    }
  }

  // Helper method to validate avatar files specifically
  validateAvatarFile(file: File): void {
    const maxSize = 2 * 1024 * 1024; // 2MB limit for avatars
    if (file.size > maxSize) {
      throw new Error('Avatar file is too large. Maximum size is 2MB.');
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Avatar must be a JPG or PNG image.');
    }
  }
}

export const storageService = new StorageServiceImpl();
