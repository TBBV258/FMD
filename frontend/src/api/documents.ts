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
  }
}

