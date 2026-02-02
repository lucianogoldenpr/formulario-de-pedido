-- =========================================
-- 🗑️ SOFT DELETE IMPLEMENTATION
-- Formulário de Pedidos Golden
-- =========================================
-- Descrição: Implementa soft delete (não deleta, apenas marca como deletado)
-- Executar em: Supabase SQL Editor
-- Data: 2026-02-02

-- =========================================
-- 📊 ADICIONAR CAMPOS DE SOFT DELETE - ORDERS
-- =========================================

-- Adicionar campo de data de deleção
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campo de quem deletou
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- =========================================
-- 📦 ADICIONAR SOFT DELETE - ORDER_ITEMS
-- =========================================

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- =========================================
-- 👥 ADICIONAR SOFT DELETE - ORDER_CONTACTS
-- =========================================

ALTER TABLE public.order_contacts 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.order_contacts 
ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- =========================================
-- 📄 ADICIONAR SOFT DELETE - ACCEPTANCE_PDFS
-- =========================================

ALTER TABLE public.acceptance_pdfs 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.acceptance_pdfs 
ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- =========================================
-- 👤 ADICIONAR SOFT DELETE - APP_USERS
-- =========================================

ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS deleted_by TEXT;

-- =========================================
-- 🔐 ATUALIZAR POLÍTICAS RLS - ORDERS
-- =========================================

-- Remover política antiga
DROP POLICY IF EXISTS "Enable all for orders" ON public.orders;

-- Criar nova política que IGNORA registros deletados
CREATE POLICY "Enable all for orders (exclude deleted)" 
ON public.orders 
FOR ALL 
USING (deleted_at IS NULL) 
WITH CHECK (deleted_at IS NULL);

-- =========================================
-- 🔐 ATUALIZAR POLÍTICAS RLS - ORDER_ITEMS
-- =========================================

DROP POLICY IF EXISTS "Enable all for items" ON public.order_items;

CREATE POLICY "Enable all for items (exclude deleted)" 
ON public.order_items 
FOR ALL 
USING (deleted_at IS NULL) 
WITH CHECK (deleted_at IS NULL);

-- =========================================
-- 🔐 ATUALIZAR POLÍTICAS RLS - ORDER_CONTACTS
-- =========================================

DROP POLICY IF EXISTS "Enable all for contacts" ON public.order_contacts;

CREATE POLICY "Enable all for contacts (exclude deleted)" 
ON public.order_contacts 
FOR ALL 
USING (deleted_at IS NULL) 
WITH CHECK (deleted_at IS NULL);

-- =========================================
-- 🔐 ATUALIZAR POLÍTICAS RLS - ACCEPTANCE_PDFS
-- =========================================

DROP POLICY IF EXISTS "Enable all for acceptance_pdfs" ON public.acceptance_pdfs;

CREATE POLICY "Enable all for acceptance_pdfs (exclude deleted)" 
ON public.acceptance_pdfs 
FOR ALL 
USING (deleted_at IS NULL) 
WITH CHECK (deleted_at IS NULL);

-- =========================================
-- 🔐 ATUALIZAR POLÍTICAS RLS - APP_USERS
-- =========================================

DROP POLICY IF EXISTS "Enable all for app_users" ON public.app_users;

CREATE POLICY "Enable all for app_users (exclude deleted)" 
ON public.app_users 
FOR ALL 
USING (deleted_at IS NULL) 
WITH CHECK (deleted_at IS NULL);

-- =========================================
-- 🔍 CRIAR VIEWS PARA DADOS DELETADOS
-- =========================================

-- View para ver apenas pedidos deletados
CREATE OR REPLACE VIEW public.orders_deleted AS
SELECT 
    id,
    customer_name,
    created_at,
    created_by,
    deleted_at,
    deleted_by,
    EXTRACT(EPOCH FROM (deleted_at - created_at)) / 86400 as dias_ate_delecao
FROM public.orders
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC;

-- View para ver todos os pedidos (incluindo deletados)
CREATE OR REPLACE VIEW public.orders_all AS
SELECT 
    id,
    customer_name,
    created_at,
    created_by,
    deleted_at,
    deleted_by,
    CASE 
        WHEN deleted_at IS NULL THEN 'Ativo'
        ELSE 'Deletado'
    END as status
FROM public.orders
ORDER BY created_at DESC;

-- =========================================
-- 🔧 FUNÇÃO PARA SOFT DELETE
-- =========================================

-- Função helper para soft delete
CREATE OR REPLACE FUNCTION soft_delete_order(
    order_id TEXT,
    deleted_by_email TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Marcar pedido como deletado
    UPDATE public.orders
    SET 
        deleted_at = NOW(),
        deleted_by = deleted_by_email
    WHERE id = order_id;
    
    -- Marcar itens como deletados
    UPDATE public.order_items
    SET 
        deleted_at = NOW(),
        deleted_by = deleted_by_email
    WHERE order_id = order_id;
    
    -- Marcar contatos como deletados
    UPDATE public.order_contacts
    SET 
        deleted_at = NOW(),
        deleted_by = deleted_by_email
    WHERE order_id = order_id;
    
    -- Marcar PDFs como deletados
    UPDATE public.acceptance_pdfs
    SET 
        deleted_at = NOW(),
        deleted_by = deleted_by_email
    WHERE order_id = order_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 🔧 FUNÇÃO PARA RESTAURAR (UNDELETE)
-- =========================================

-- Função para restaurar pedido deletado
CREATE OR REPLACE FUNCTION restore_order(
    order_id TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Restaurar pedido
    UPDATE public.orders
    SET 
        deleted_at = NULL,
        deleted_by = NULL
    WHERE id = order_id;
    
    -- Restaurar itens
    UPDATE public.order_items
    SET 
        deleted_at = NULL,
        deleted_by = NULL
    WHERE order_id = order_id;
    
    -- Restaurar contatos
    UPDATE public.order_contacts
    SET 
        deleted_at = NULL,
        deleted_by = NULL
    WHERE order_id = order_id;
    
    -- Restaurar PDFs
    UPDATE public.acceptance_pdfs
    SET 
        deleted_at = NULL,
        deleted_by = NULL
    WHERE order_id = order_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 🔧 FUNÇÃO PARA HARD DELETE (PERMANENTE)
-- =========================================

-- Função para deletar permanentemente (usar com cuidado!)
CREATE OR REPLACE FUNCTION hard_delete_order(
    order_id TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Deletar PDFs
    DELETE FROM public.acceptance_pdfs WHERE order_id = order_id;
    
    -- Deletar contatos
    DELETE FROM public.order_contacts WHERE order_id = order_id;
    
    -- Deletar itens
    DELETE FROM public.order_items WHERE order_id = order_id;
    
    -- Deletar pedido
    DELETE FROM public.orders WHERE id = order_id;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- 📊 QUERIES DE EXEMPLO
-- =========================================

-- Soft delete de um pedido
-- SELECT soft_delete_order('ORDER_ID_AQUI', 'usuario@email.com');

-- Restaurar um pedido
-- SELECT restore_order('ORDER_ID_AQUI');

-- Ver pedidos deletados
-- SELECT * FROM public.orders_deleted;

-- Ver todos os pedidos (ativos + deletados)
-- SELECT * FROM public.orders_all;

-- Hard delete (CUIDADO! Permanente!)
-- SELECT hard_delete_order('ORDER_ID_AQUI');

-- =========================================
-- ✅ VERIFICAÇÃO
-- =========================================

-- Verificar se campos foram adicionados
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name IN ('deleted_at', 'deleted_by')
ORDER BY table_name, column_name;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- =========================================
-- 📝 NOTAS DE USO NO CÓDIGO
-- =========================================
-- 1. Para deletar (soft delete):
--    await supabase.rpc('soft_delete_order', {
--      order_id: orderId,
--      deleted_by_email: currentUserEmail
--    })
--
-- 2. Para restaurar:
--    await supabase.rpc('restore_order', {
--      order_id: orderId
--    })
--
-- 3. Queries normais automaticamente ignoram deletados
--    (graças às políticas RLS)

-- =========================================
-- 🎯 BENEFÍCIOS
-- =========================================
-- ✅ Dados nunca são perdidos permanentemente
-- ✅ Possibilidade de restaurar pedidos deletados
-- ✅ Auditoria completa de deleções
-- ✅ Compliance com LGPD/GDPR (rastreamento)
-- ✅ Proteção contra deleções acidentais
