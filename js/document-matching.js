// document-matching.js
// Lógica de crowd-matching e sugestões
import { supabase } from './supabaseClient.js';

export async function suggestMatch(documentData) {
  // Busca documentos similares
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .ilike('number', `%${documentData.number}%`)
    .eq('type', documentData.type);
  // ... lógica de correspondência
  return data;
}
