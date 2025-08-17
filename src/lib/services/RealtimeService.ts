import { authService } from './AuthService';
import type { Chat, ChatMessage, Document, Notification } from '@/lib/types';

export class RealtimeService {
  private subscriptions: Map<string, () => void> = new Map();

  // Subscribe to chat updates
  subscribeToChats(documentId: string, callback: (payload: any) => void): () => void {
    const client = authService.getClient();
    if (!client) {
      console.warn('⚠️ RealtimeService: Supabase client not initialized');
      return () => {};
    }

    console.log('🔔 RealtimeService: Subscribing to chat updates for document:', documentId);

    const subscription = client
      .channel(`chat:${documentId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `document_id=eq.${documentId}`,
        },
        (payload) => {
          console.log('🔔 RealtimeService: Chat update received:', payload);
          callback(payload);
        }
      )
      .subscribe();

    const unsubscribe = () => {
      console.log('🔔 RealtimeService: Unsubscribing from chat updates for document:', documentId);
      subscription.unsubscribe();
      this.subscriptions.delete(`chat:${documentId}`);
    };

    this.subscriptions.set(`chat:${documentId}`, unsubscribe);
    return unsubscribe;
  }

  // Subscribe to notifications
  subscribeToNotifications(userId: string, callback: (payload: any) => void): () => void {
    const client = authService.getClient();
    if (!client) {
      console.warn('⚠️ RealtimeService: Supabase client not initialized');
      return () => {};
    }

    console.log('🔔 RealtimeService: Subscribing to notifications for user:', userId);

    const subscription = client
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 RealtimeService: Notification update received:', payload);
          callback(payload);
        }
      )
      .subscribe();

    const unsubscribe = () => {
      console.log('🔔 RealtimeService: Unsubscribing from notifications for user:', userId);
      subscription.unsubscribe();
      this.subscriptions.delete(`notifications:${userId}`);
    };

    this.subscriptions.set(`notifications:${userId}`, unsubscribe);
    return unsubscribe;
  }

  // Subscribe to document updates
  subscribeToDocumentUpdates(callback: (payload: any) => void): () => void {
    const client = authService.getClient();
    if (!client) {
      console.warn('⚠️ RealtimeService: Supabase client not initialized');
      return () => {};
    }

    console.log('🔔 RealtimeService: Subscribing to document updates');

    const subscription = client
      .channel('documents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
        },
        (payload) => {
          console.log('🔔 RealtimeService: Document update received:', payload);
          callback(payload);
        }
      )
      .subscribe();

    const unsubscribe = () => {
      console.log('🔔 RealtimeService: Unsubscribing from document updates');
      subscription.unsubscribe();
      this.subscriptions.delete('documents');
    };

    this.subscriptions.set('documents', unsubscribe);
    return unsubscribe;
  }

  // Subscribe to user profile updates
  subscribeToUserProfile(userId: string, callback: (payload: any) => void): () => void {
    const client = authService.getClient();
    if (!client) {
      console.warn('⚠️ RealtimeService: Supabase client not initialized');
      return () => {};
    }

    console.log('🔔 RealtimeService: Subscribing to user profile updates for user:', userId);

    const subscription = client
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('🔔 RealtimeService: User profile update received:', payload);
          callback(payload);
        }
      )
      .subscribe();

    const unsubscribe = () => {
      console.log('🔔 RealtimeService: Unsubscribing from user profile updates for user:', userId);
      subscription.unsubscribe();
      this.subscriptions.delete(`profile:${userId}`);
    };

    this.subscriptions.set(`profile:${userId}`, unsubscribe);
    return unsubscribe;
  }

  // Subscribe to location-based updates (for map)
  subscribeToLocationUpdates(
    bounds: { north: number; south: number; east: number; west: number },
    callback: (payload: any) => void
  ): () => void {
    const client = authService.getClient();
    if (!client) {
      console.warn('⚠️ RealtimeService: Supabase client not initialized');
      return () => {};
    }

    console.log('🔔 RealtimeService: Subscribing to location updates for bounds:', bounds);

    const subscription = client
      .channel('location_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `latitude.gte.${bounds.south},latitude.lte.${bounds.north},longitude.gte.${bounds.west},longitude.lte.${bounds.east}`,
        },
        (payload) => {
          console.log('🔔 RealtimeService: Location update received:', payload);
          callback(payload);
        }
      )
      .subscribe();

    const unsubscribe = () => {
      console.log('🔔 RealtimeService: Unsubscribing from location updates');
      subscription.unsubscribe();
      this.subscriptions.delete('location_updates');
    };

    this.subscriptions.set('location_updates', unsubscribe);
    return unsubscribe;
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll(): void {
    console.log('🔔 RealtimeService: Unsubscribing from all subscriptions');
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
  }

  // Get subscription count
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  // Check if service is connected
  isConnected(): boolean {
    const client = authService.getClient();
    return client !== null;
  }
}

export const realtimeService = new RealtimeService();
