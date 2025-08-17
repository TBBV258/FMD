import React, { useState } from 'react';
import { Search, Filter, MapPin, Calendar, FileText, Eye, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { useQuery } from '@tanstack/react-query';
import { databaseAPI } from '@/lib/api/database';
import type { Document, DocumentType } from '@/lib/types';

type FeedFilter = 'all' | 'lost' | 'found';

export const FeedPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FeedFilter>('all');
  const [selectedType, setSelectedType] = useState<DocumentType | 'all'>('all');

  console.log('📰 FeedPage: Component rendered for user:', user?.email);

  // Fetch lost documents
  const { data: lostDocuments, isLoading: isLoadingLost } = useQuery({
    queryKey: ['lost-documents'],
    queryFn: () => databaseAPI.getLostDocuments(),
    enabled: selectedFilter === 'all' || selectedFilter === 'lost',
  });

  // Fetch found documents
  const { data: foundDocuments, isLoading: isLoadingFound } = useQuery({
    queryKey: ['found-documents'],
    queryFn: () => databaseAPI.getFoundDocuments(),
    enabled: selectedFilter === 'all' || selectedFilter === 'found',
  });

  // Combine and filter documents
  const allDocuments = [
    ...(lostDocuments || []),
    ...(foundDocuments || []),
  ];

  const filteredDocuments = allDocuments.filter(doc => {
    // Filter by status
    if (selectedFilter === 'lost' && doc.status !== 'lost') return false;
    if (selectedFilter === 'found' && doc.status !== 'found') return false;
    
    // Filter by type
    if (selectedType !== 'all' && doc.type !== selectedType) return false;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.name.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.location?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const isLoading = isLoadingLost || isLoadingFound;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'lost' ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100';
  };

  const getStatusIcon = (status: string) => {
    return status === 'lost' ? '🚨' : '💚';
  };

  const handleContact = (document: Document) => {
    console.log('📞 FeedPage: Contacting document owner:', document.id);
    // TODO: Implement contact functionality (chat or contact form)
    alert(`Contatar ${document.status === 'lost' ? 'proprietário' : 'encontrador'} de ${document.name}`);
  };

  const handleViewDetails = (document: Document) => {
    console.log('👁️ FeedPage: Viewing document details:', document.id);
    // TODO: Implement document detail view
    alert(`Ver detalhes de ${document.name}`);
  };

  return (
    <div className="space-responsive-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-responsive-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('feed.title') || 'Feed de Documentos'}
        </h1>
        <p className="text-responsive-base text-gray-600 dark:text-gray-400">
          {t('feed.subtitle') || 'Veja documentos perdidos e encontrados na sua área'}
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('feed.search_placeholder') || 'Pesquisar documentos...'}
                className="pl-10"
                fullWidth
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('feed.status') || 'Status'}:
                </span>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value as FeedFilter)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="all">{t('feed.all_status') || 'Todos'}</option>
                  <option value="lost">{t('feed.lost_only') || 'Apenas Perdidos'}</option>
                  <option value="found">{t('feed.found_only') || 'Apenas Encontrados'}</option>
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('feed.type') || 'Tipo'}:
                </span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as DocumentType | 'all')}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="all">{t('feed.all_types') || 'Todos os Tipos'}</option>
                  <option value="bi">{t('type.bi')}</option>
                  <option value="passaporte">{t('type.passaporte')}</option>
                  <option value="carta">{t('type.carta')}</option>
                  <option value="outros">{t('type.outros')}</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {isLoading ? (
            t('feed.loading') || 'Carregando...'
          ) : (
            `${filteredDocuments.length} ${t('feed.documents_found') || 'documentos encontrados'}`
          )}
        </p>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              {t('feed.no_documents') || 'Nenhum documento encontrado'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery || selectedFilter !== 'all' || selectedType !== 'all'
                ? t('feed.no_results_filter') || 'Tente ajustar os filtros ou a pesquisa'
                : t('feed.no_documents_desc') || 'Não há documentos perdidos ou encontrados no momento'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl">{getStatusIcon(document.status)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                        {document.status === 'lost' ? t('status.lost') : t('status.found')}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {document.name}
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Document Type */}
                <div className="flex items-center space-x-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t(`type.${document.type}`)}
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center space-x-2 mb-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {document.location}
                  </span>
                </div>

                {/* Description */}
                {document.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {document.description}
                  </p>
                )}

                {/* Date */}
                <div className="flex items-center space-x-2 mb-4">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('common.created_at')}: {document.created_at ? formatDate(document.created_at) : 'N/A'}
                  </span>
                </div>

                {/* Files Count */}
                {document.files && document.files.length > 0 && (
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {document.files.length} {t('feed.file') || 'arquivo'}{document.files.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(document)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {t('feed.view_details') || 'Ver Detalhes'}
                  </Button>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleContact(document)}
                    className="flex-1"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {t('feed.contact') || 'Contatar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Help Information */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
            {t('feed.help_title') || 'Como funciona o Feed?'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t('feed.lost_documents') || 'Documentos Perdidos'}
              </h4>
              <p>{t('feed.lost_explanation') || 'Veja documentos que outras pessoas perderam e ajude-as a encontrá-los.'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t('feed.found_documents') || 'Documentos Encontrados'}
              </h4>
              <p>{t('feed.found_explanation') || 'Veja documentos que outras pessoas encontraram e entre em contato se for seu.'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
