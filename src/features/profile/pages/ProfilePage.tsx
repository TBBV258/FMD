import React, { useState } from 'react';
import { User, Settings, Bell, Shield, Download, Edit, Camera, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { databaseAPI } from '@/lib/api/database';
import { storageService } from '@/lib/services/StorageService';

export const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState({
    first_name: user?.user_metadata?.first_name || '',
    last_name: user?.user_metadata?.last_name || '',
    phone: user?.user_metadata?.phone || '',
    location: user?.user_metadata?.location || '',
  });

  console.log('👤 ProfilePage: Component rendered for user:', user?.email);

  // Fetch user profile data
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: () => databaseAPI.getUserProfile(user?.id || ''),
    enabled: !!user?.id,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('🔄 ProfilePage: Updating profile data:', data);
      
      // Update profile in database
      const updatedProfile = await databaseAPI.updateUserProfile(user.id, data);
      console.log('✅ ProfilePage: Profile updated successfully:', updatedProfile);
      
      return updatedProfile;
    },
    onSuccess: () => {
      console.log('🎉 Profile updated successfully!');
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      alert(t('profile.update_success') || 'Perfil atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('❌ ProfilePage: Profile update error:', error);
      alert(error instanceof Error ? error.message : 'Erro ao atualizar perfil');
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error('User not authenticated');
      
      console.log('📤 ProfilePage: Uploading avatar for user:', user.id);
      const avatarUrl = await storageService.uploadAvatar(file, user.id);
      console.log('✅ ProfilePage: Avatar uploaded successfully:', avatarUrl);
      
      // Update user metadata with new avatar URL
      await databaseAPI.updateUserProfile(user.id, { avatar_url: avatarUrl });
      
      return avatarUrl;
    },
    onSuccess: () => {
      console.log('🎉 Avatar updated successfully!');
      setAvatarFile(null);
      queryClient.invalidateQueries({ queryKey: ['user-profile', user?.id] });
      alert(t('profile.avatar_success') || 'Avatar atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('❌ ProfilePage: Avatar upload error:', error);
      alert(error instanceof Error ? error.message : 'Erro ao atualizar avatar');
    },
  });

  const handleInputChange = (field: keyof typeof profileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        storageService.validateAvatarFile(file);
        setAvatarFile(file);
        console.log('📁 ProfilePage: Avatar file selected:', file.name);
      } catch (error) {
        console.error('❌ ProfilePage: Avatar validation error:', error);
        alert(error instanceof Error ? error.message : 'Arquivo de avatar inválido');
      }
    }
  };

  const handleSaveProfile = () => {
    console.log('💾 ProfilePage: Saving profile data');
    updateProfileMutation.mutate(profileData);
  };

  const handleUploadAvatar = () => {
    if (avatarFile) {
      console.log('📤 ProfilePage: Starting avatar upload');
      uploadAvatarMutation.mutate(avatarFile);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileData({
      first_name: user?.user_metadata?.first_name || '',
      last_name: user?.user_metadata?.last_name || '',
      phone: user?.user_metadata?.phone || '',
      location: user?.user_metadata?.location || '',
    });
  };

  const handleSignOut = () => {
    console.log('🚪 ProfilePage: User signing out');
    signOut();
  };

  const getAvatarUrl = () => {
    return userProfile?.avatar_url || user?.user_metadata?.avatar_url || '';
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-responsive-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-responsive-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('profile.title') || 'Perfil do Usuário'}
        </h1>
        <p className="text-responsive-base text-gray-600 dark:text-gray-400">
          {t('profile.subtitle') || 'Gerencie suas informações pessoais e configurações'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  {t('profile.personal_info') || 'Informações Pessoais'}
                </CardTitle>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {t('common.edit') || 'Editar'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {getAvatarUrl() ? (
                      <img
                        src={getAvatarUrl()}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-primary-500 text-white p-1 rounded-full cursor-pointer hover:bg-primary-600">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                
                {isEditing && avatarFile && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {avatarFile.name}
                    </span>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleUploadAvatar}
                      isLoading={uploadAvatarMutation.isPending}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {t('profile.upload_avatar') || 'Enviar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAvatarFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('profile.first_name') || 'Nome'}
                  value={profileData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  disabled={!isEditing}
                  fullWidth
                />
                
                <Input
                  label={t('profile.last_name') || 'Sobrenome'}
                  value={profileData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  disabled={!isEditing}
                  fullWidth
                />
                
                <Input
                  label={t('profile.phone') || 'Telefone'}
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={t('placeholder.phone') || 'Ex: 84 123 4567'}
                  disabled={!isEditing}
                  fullWidth
                />
                
                <Input
                  label={t('profile.location') || 'Localização'}
                  value={profileData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={!isEditing}
                  fullWidth
                />
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="flex space-x-2 pt-4">
                  <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                    isLoading={updateProfileMutation.isPending}
                    disabled={updateProfileMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t('common.save') || 'Salvar'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={updateProfileMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('common.cancel') || 'Cancelar'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('profile.stats.title') || 'Estatísticas'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('profile.stats.documents') || 'Documentos'}
                </span>
                <span className="font-semibold">{userProfile?.document_count || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('profile.stats.points') || 'Pontos'}
                </span>
                <span className="font-semibold">{userProfile?.points || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">
                  {t('profile.stats.helped') || 'Ajudou'}
                </span>
                <span className="font-semibold">{userProfile?.helped_count || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('profile.actions.title') || 'Ações'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => alert(t('profile.actions.backup.description') || 'Funcionalidade de backup em desenvolvimento')}
              >
                <Download className="w-4 h-4 mr-2" />
                {t('profile.actions.backup.title') || 'Backup de Dados'}
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => alert(t('profile.actions.notifications.description') || 'Configurações de notificações em desenvolvimento')}
              >
                <Bell className="w-4 h-4 mr-2" />
                {t('profile.actions.notifications.title') || 'Notificações'}
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => alert(t('profile.actions.security.description') || 'Configurações de segurança em desenvolvimento')}
              >
                <Shield className="w-4 h-4 mr-2" />
                {t('profile.actions.security.title') || 'Segurança'}
              </Button>
            </CardContent>
          </Card>

          {/* Sign Out */}
          <Card>
            <CardContent className="pt-6">
              <Button
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleSignOut}
              >
                {t('nav.logout') || 'Sair'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
