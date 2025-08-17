import React, { useState } from 'react';
import { Plus, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { databaseAPI } from '@/lib/api/database';
import { AddDocumentModal } from '../components/AddDocumentModal';

export const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  console.log('🔍 DocumentsPage: Component rendered for user:', user?.email);

  // Query user documents
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['user-documents', user?.id],
    queryFn: () => user ? databaseAPI.getUserDocuments(user.id) : [],
    enabled: !!user,
  });

  console.log('📄 DocumentsPage: Documents loaded:', documents.length);

  // Filter documents based on search
  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const normalDocuments = filteredDocuments.filter(doc => doc.status === 'normal');
  const lostDocuments = filteredDocuments.filter(doc => doc.status === 'lost');

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'bi': return t('type.bi');
      case 'passaporte': return t('type.passaporte');
      case 'carta': return t('type.carta');
      case 'outros': return t('type.outros');
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'normal': return t('status.normal');
      case 'lost': return t('status.lost');
      case 'found': return t('status.found');
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-responsive-md">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-responsive-md">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent>
            <div className="text-center py-8">
              <p className="text-red-600 dark:text-red-400 mb-4">
                {t('error.load_documents')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-responsive-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-responsive-xl font-bold text-gray-900 dark:text-gray-100">
            {t('documents.title')}
          </h1>
          <p className="text-responsive-base text-gray-600 dark:text-gray-400">
            {t('documents.subtitle')}
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto"
        >
          {t('documents.add')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {documents.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('documents.total')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {normalDocuments.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('status.normal')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {lostDocuments.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('status.lost')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              0
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('status.found')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          leftIcon={<Search className="h-4 w-4" />}
          placeholder={t('documents.search_placeholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {searchQuery ? t('documents.no_results') : t('documents.empty_title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery ? t('documents.no_results_desc') : t('documents.empty_description')}
            </p>
            {!searchQuery && (
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsAddModalOpen(true)}
              >
                {t('documents.add_first')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-responsive-sm">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-medium transition-shadow cursor-pointer">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {document.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getDocumentTypeLabel(document.type)}
                      {document.number && ` • ${document.number}`}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      document.status === 'normal'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                        : document.status === 'lost'
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                        : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                    }`}
                  >
                    {getStatusLabel(document.status)}
                  </span>
                </div>
                
                {document.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {document.description}
                  </p>
                )}
                
                {/* Files Section */}
                {document.files && document.files.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      📎 {document.files.length} {document.files.length === 1 ? 'arquivo' : 'arquivos'}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {document.files.slice(0, 3).map((file, index) => (
                        <button
                          key={index}
                          onClick={() => window.open(file.url, '_blank')}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          {file.originalName}
                        </button>
                      ))}
                      {document.files.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{document.files.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {t('common.created_at')}: {document.created_at ? new Date(document.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                  {document.location && (
                    <span>
                      📍 {document.location}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Document Modal */}
      <AddDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
