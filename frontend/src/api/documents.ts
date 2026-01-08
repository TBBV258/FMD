import { supabase } from './supabase'
import type { Document } from '@/types'

export const documentsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .in('status', ['lost', 'found'])
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Document[]
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data as Document
  },

  async getByUser(userId: string) {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Document[]
  },

  async create(document: Partial<Document>) {
    const { data, error } = await supabase
      .from('documents')
      .insert([document])
      .select()
      .single()

    if (error) throw error
    return data as Document
  },

  async update(id: string, updates: Partial<Document>) {
    const { data, error } = await supabase
      .from('documents')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Document
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  },

  async uploadFile(file: File, path: string) {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error
    
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path)

    return publicUrl
  },

  async markAsLost(id: string, addTag: boolean = false) {
    const updates: Partial<Document> = {
      status: 'lost',
      updated_at: new Date().toISOString()
    }

    if (addTag) {
      // Get current document to preserve existing tags
      const currentDoc = await this.getById(id)
      const currentTags = currentDoc.tags || []
      if (!currentTags.includes('Submetido por Utilizador')) {
        updates.tags = [...currentTags, 'Submetido por Utilizador']
      }
    }

    return this.update(id, updates)
  },

  async toggleVisibility(id: string, isPublic: boolean) {
    return this.update(id, {
      is_public: isPublic,
      updated_at: new Date().toISOString()
    })
  },

  async updateTags(id: string, tags: string[]) {
    return this.update(id, {
      tags,
      updated_at: new Date().toISOString()
    })
  }
}

