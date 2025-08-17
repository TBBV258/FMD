import React, { useState } from 'react';
import { AlertTriangle, Upload, FileText, MapPin, User, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { databaseAPI } from '@/lib/api/database';
import { storageService } from '@/lib/services/StorageService';
import type { DocumentType } from '@/lib/types';

export const ReportLostPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    type: 'bi' as DocumentType,
    name: '',
    location: '',
    description: '',
    contact_info: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  console.log('🚨 ReportLostPage: Component rendered for user:', user?.email);

  const reportLostMutation = useMutation({
    mutationFn: async (data: typeof formData & { files: File[] }) => {
      if (!user) throw new Error('User not authenticated');

      console.log('🚨 ReportLostPage: Starting lost document report process');
      console.log('🚨 Form data:', data);

      // Create lost document report first
      const documentData = {
        user_id: user.id,
        type: data.type,
        name: data.name,
        description: data.description || undefined,
        location: data.location,
        contact_info: data.contact_info,
        status: 'lost' as const,
        files: [],
        created_at: new Date().toISOString(),
      };

      console.log('📄 ReportLostPage: Creating lost document with data:', documentData);
      const createdDocument = await databaseAPI.createDocument(documentData);
      console.log('✅ ReportLostPage: Lost document created:', createdDocument);

      // Upload files if any
      if (data.files.length > 0 && createdDocument.id) {
        console.log('📤 ReportLostPage: Uploading files for document ID:', createdDocument.id);
        const uploadedFiles = await storageService.uploadDocumentFiles(data.files, createdDocument.id);
        console.log('📤 ReportLostPage: Files uploaded successfully:', uploadedFiles);

        // Update document with file information
        console.log('🔄 ReportLostPage: Updating document with files');
        const updatedDocument = await databaseAPI.updateDocument(createdDocument.id, { 
          files: uploadedFiles 
        });
        console.log('✅ ReportLostPage: Document updated with files:', updatedDocument);
        return updatedDocument;
      }

      return createdDocument;
    },
    onSuccess: (document) => {
      console.log('✅ ReportLostPage: Lost document report successful:', document);
      
      // Invalidate and refetch documents and feed
      queryClient.invalidateQueries({ queryKey: ['user-documents'] });
      queryClient.invalidateQueries({ queryKey: ['lost-documents'] });
      
      // Reset form
      resetForm();
      
      // Show success message
      console.log('🎉 Lost document reported successfully!');
      alert(t('lost.report_success') || 'Documento perdido reportado com sucesso!');
    },
    onError: (error) => {
      console.error('❌ ReportLostPage: Lost document report error:', error);
      alert(error instanceof Error ? error.message : 'Erro ao reportar documento perdido');
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'bi',
      name: '',
      location: '',
      description: '',
      contact_info: '',
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
      
      console.log('📁 ReportLostPage: Files selected:', newFiles.map(f => f.name));
    } catch (error) {
      console.error('❌ ReportLostPage: File validation error:', error);
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
    
    console.log('🚨 ReportLostPage: Form submitted');
    
    // Validate required fields
    if (!formData.type || !formData.name || !formData.location || !formData.contact_info) {
      console.log('❌ ReportLostPage: Missing required fields');
      alert(t('lost.missing_required_fields') || 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    reportLostMutation.mutate({ ...formData, files });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-responsive-md">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-responsive-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('lost.title')}
        </h1>
        <p className="text-responsive-base text-gray-600 dark:text-gray-400">
          {t('lost.subtitle') || 'Reporte um documento perdido para ajudar na busca'}
        </p>
      </div>

      {/* Report Form */}
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('lost.document_type')} *
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
              label={`${t('lost.document_name')} *`}
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t('lost.document_name_placeholder') || 'Nome do documento perdido'}
              required
              fullWidth
            />

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('lost.where_lost')} *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder={t('lost.location_placeholder') || 'Local onde foi perdido'}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('lost.additional_details')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={t('lost.description_placeholder') || 'Detalhes adicionais sobre o documento'}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>

            {/* Contact Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('lost.contact_info')} *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.contact_info}
                  onChange={(e) => handleInputChange('contact_info', e.target.value)}
                  placeholder={t('lost.contact_placeholder') || 'Seu telefone ou email para contato'}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('lost.evidence_files') || 'Arquivos de Evidência'} ({t('common.optional')})
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
                  {t('lost.drag_drop_or') || 'Arraste e solte arquivos aqui ou'}{' '}
                  <button
                    type="button"
                    onClick={() => document.getElementById('lost-file-input')?.click()}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {t('lost.browse_files') || 'procurar arquivos'}
                  </button>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG, PDF • {t('lost.max_5_files') || 'Máximo 5 arquivos'} • {t('lost.max_5mb_each') || 'Máximo 5MB cada'}
                </p>
                
                <input
                  id="lost-file-input"
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
                    {t('lost.selected_files') || 'Arquivos selecionados'} ({files.length}/5)
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

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              isLoading={reportLostMutation.isPending}
              disabled={reportLostMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {reportLostMutation.isPending ? (
                t('lost.reporting') || 'Reportando...'
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {t('lost.report_button_submit')}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Help Information */}
      <Card className="max-w-2xl mx-auto mt-6">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
            {t('lost.help_title') || 'Como funciona?'}
          </h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <p>• {t('lost.help_step1') || 'Reporte seu documento perdido com detalhes'}</p>
            <p>• {t('lost.help_step2') || 'Outros usuários podem ver no feed de perdidos'}</p>
            <p>• {t('lost.help_step3') || 'Se alguém encontrar, poderá entrar em contato'}</p>
            <p>• {t('lost.help_step4') || 'Você receberá notificações de possíveis matches'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
