-- Habilita RLS na tabela de documentos
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Leitura pública: somente documentos perdidos ou encontrados
CREATE POLICY "Public documents are viewable by everyone"
ON public.documents
FOR SELECT
USING (status IN ('lost', 'found'));

-- Leitura privada: o dono pode ver todos os seus documentos (inclui 'normal' e 'returned')
CREATE POLICY "Users can see all their own documents"
ON public.documents
FOR SELECT
USING (auth.uid() = user_id);
