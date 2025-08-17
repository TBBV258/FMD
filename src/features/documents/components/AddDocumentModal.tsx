import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/lib/hooks/useAuth';
import { useEntitlements } from '@/lib/hooks/useEntitlements';
import { useTranslation } from '@/i18n';
import { databaseAPI } from '@/lib/api/database';
import { storageService } from '@/lib/services/StorageService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { DocumentType } from '@/lib/types';

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDocumentModal: React.FC<AddDocumentModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const entitlements = useEntitlements();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    type: 'bi' as DocumentType,
    name: '',
    number: '',
    description: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  console.log('📄 AddDocumentModal: Component rendered, isOpen:', isOpen);

  const createDocumentMutation = useMutation({
    mutationFn: async (data: typeof formData & { files: File[] }) => {
      if (!user) throw new Error('User not authenticated');

      console.log('📄 AddDocumentModal: Starting document creation process');
      console.log('📄 Form data:', data);

      // Check premium limits first
      if (!entitlements.canAddDocuments) {
        console.log('❌ AddDocumentModal: Premium upgrade required');
        throw new Error('Free plan limit reached. Upgrade to Premium for unlimited documents.');
      }

      // Create document first
      const documentData = {
        user_id: user.id,
        type: data.type,
        name: data.name,
        number: data.number || null,
        description: data.description || null,
        status: 'normal' as const,
        created_at: new Date().toISOString(),
      };

      console.log('📄 AddDocumentModal: Creating document with data:', documentData);
      const createdDocument = await databaseAPI.createDocument(documentData);
      console.log('✅ AddDocumentModal: Document created:', createdDocument);

      // Upload files if any
      if (data.files.length > 0) {
        console.log('📤 AddDocumentModal: Uploading files for document ID:', createdDocument.id);
        const uploadedFiles = await storageService.uploadDocumentFiles(data.files, createdDocument.id);
        console.log('📤 AddDocumentModal: Files uploaded successfully:', uploadedFiles);

        // Update document with file information
        console.log('🔄 AddDocumentModal: Updating document with files');
        const updatedDocument = await databaseAPI.updateDocument(createdDocument.id, { 
          files: uploadedFiles 
        });
        console.log('✅ AddDocumentModal: Document updated with files:', updatedDocument);
        return updatedDocument;
      }

      return createdDocument;
    },
    onSuccess: (document) => {
      console.log('✅ AddDocumentModal: Document creation successful:', document);
      
      // Invalidate and refetch documents
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      
      // Reset form and close modal
      resetForm();
      onClose();
      
      // Show success message (you can add a toast system here)
      console.log('🎉 Document added successfully!');
    },
    onError: (error) => {
      console.error('❌ AddDocumentModal: Document creation error:', error);
      // Handle error (you can add error toast here)
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'bi',
      name: '',
      number: '',
      description: '',
    });
    setFiles([]);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    try {
      const fileArray = Array.from(selectedFiles);
      
      // Validate files before setting
      storageService.validateFiles(fileArray);
      
      // Limit to 5 files total
      const newFiles = [...files, ...fileArray].slice(0, 5);
      setFiles(newFiles);
      
      console.log('📁 AddDocumentModal: Files selected:', newFiles.map(f => f.name));
    } catch (error) {
      console.error('❌ AddDocumentModal: File validation error:', error);
      alert(error instanceof Error ? error.message : 'Invalid files selected');
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📄 AddDocumentModal: Form submitted');
    
    // Validate required fields
    if (!formData.type || !formData.name || !formData.number) {
      console.log('❌ AddDocumentModal: Missing required fields');
      alert(t('documents.missing_required_fields') || 'Please fill in all required fields.');
      return;
    }

    createDocumentMutation.mutate({ ...formData, files });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {t('documents.add')}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('documents.type')} *
            </label>
            <select
              value={formData.type}
              onChange={(e) => handleInputChange('type', e.target.value as DocumentType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="bi">{t('type.bi')}</option>
              <option value="passaporte">{t('type.passaporte')}</option>
              <option value="carta">{t('type.carta')}</option>
              <option value="outros">{t('type.outros')}</option>
            </select>
          </div>

          {/* Document Name */}
          <Input
            label={`${t('documents.name')} *`}
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={t('documents.name_placeholder')}
            required
            fullWidth
          />

          {/* Document Number */}
          <Input
            label={`${t('documents.number')} *`}
            value={formData.number}
            onChange={(e) => handleInputChange('number', e.target.value)}
            placeholder={t('documents.number_placeholder')}
            required
            fullWidth
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('documents.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('documents.description_placeholder')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('documents.files')} ({t('documents.optional')})
            </label>
            
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t('documents.drag_drop_or')}{' '}
                <button
                  type="button"
                  onClick={() => document.getElementById('file-input')?.click()}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {t('documents.browse_files')}
                </button>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                JPG, PNG, PDF • {t('documents.max_5_files')} • {t('documents.max_5mb_each')}
              </p>
              
              <input
                id="file-input"
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('documents.selected_files')} ({files.length}/5)
                </p>
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                  >
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Premium Limit Warning */}
          {!entitlements.canAddDocuments && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      {t('documents.free_limit_reached')}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      {t('documents.upgrade_for_unlimited')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={createDocumentMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={createDocumentMutation.isPending}
              disabled={!entitlements.canAddDocuments || createDocumentMutation.isPending}
            >
              {createDocumentMutation.isPending ? (
                t('documents.adding')
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {t('documents.add')}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
