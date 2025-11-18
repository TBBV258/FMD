// document-matching.js
// Lógica de crowd-matching e sugestões

export async function suggestMatch(documentData) {
  // Busca documentos similares usando o cliente Supabase global
  if (!window.supabase) {
    console.error('Supabase client not initialized');
    return [];
  }
  
  const { data, error } = await window.supabase
    .from('documents')
    .select('*')
    .ilike('number', `%${documentData.number}%`)
    .eq('type', documentData.type);
    
  if (error) {
    console.error('Error matching documents:', error);
    return [];
  }
  
  // ... lógica de correspondência
  return data || [];
}
