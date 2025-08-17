import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Entitlements } from '@/lib/types';
import { databaseAPI } from '@/lib/api/database';
import { useAuth } from './useAuth';

export function useEntitlements(): Entitlements & { isLoading: boolean } {
  const { user, profile } = useAuth();

  const { data: limits, isLoading } = useQuery({
    queryKey: ['document-limits', user?.id],
    queryFn: () => user ? databaseAPI.checkDocumentLimits(user.id) : null,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const entitlements = useMemo((): Entitlements => {
    const isPremium = profile?.is_premium ?? false;

    return {
      canAddDocuments: limits?.canAdd ?? false,
      maxDocuments: isPremium ? -1 : 1, // -1 for unlimited
      canAccessAllDocumentTypes: isPremium,
      hasPriorityChat: isPremium,
      hasPushNotifications: isPremium,
    };
  }, [profile?.is_premium, limits?.canAdd]);

  return {
    ...entitlements,
    isLoading,
  };
}
