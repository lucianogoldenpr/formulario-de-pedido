-- =========================================
-- 📝 DATABASE AUDIT TRAIL SCRIPT
-- Formulário de Pedidos Golden
-- =========================================
-- Descrição: Adiciona campos de auditoria para rastreamento de mudanças
-- Executar em: Supabase SQL Editor
-- Data: 2026-02-02

-- =========================================
-- 📊 ADICIONAR CAMPOS DE AUDITORIA - ORDERS
-- =========================================

-- Adicionar campo de última atualização
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Adicionar campo de quem atualizou
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- =========================================
-- 🔧 CRIAR FUNÇÃO DE AUTO-UPDATE
-- =========================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- ⚡ CRIAR TRIGGER PARA ORDERS
-- =========================================

-- Remover trigger se já existir
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;

-- Criar trigger para atualizar updated_at em cada UPDATE
CREATE TRIGGER update_orders_updated_at 
BEFORE UPDATE ON public.orders 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 📦 ADICIONAR AUDITORIA - ORDER_ITEMS
-- =========================================

ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

DROP TRIGGER IF EXISTS update_order_items_updated_at ON public.order_items;

CREATE TRIGGER update_order_items_updated_at 
BEFORE UPDATE ON public.order_items 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 👥 ADICIONAR AUDITORIA - ORDER_CONTACTS
-- =========================================

ALTER TABLE public.order_contacts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

DROP TRIGGER IF EXISTS update_order_contacts_updated_at ON public.order_contacts;

CREATE TRIGGER update_order_contacts_updated_at 
BEFORE UPDATE ON public.order_contacts 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 👤 ADICIONAR AUDITORIA - APP_USERS
-- =========================================

ALTER TABLE public.app_users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

DROP TRIGGER IF EXISTS update_app_users_updated_at ON public.app_users;

CREATE TRIGGER update_app_users_updated_at 
BEFORE UPDATE ON public.app_users 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- 🔍 CRIAR VIEW DE AUDITORIA
-- =========================================

-- View para visualizar histórico de mudanças
CREATE OR REPLACE VIEW public.orders_audit AS
SELECT 
    id,
    customer_name,
    created_at,
    created_by,
    updated_at,
    updated_by,
    CASE 
        WHEN updated_at IS NULL THEN 'Nunca atualizado'
        ELSE 'Atualizado em ' || updated_at::text
    END as status_auditoria,
    CASE 
        WHEN updated_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600
        ELSE 0
    END as horas_ate_atualizacao
FROM public.orders
ORDER BY created_at DESC;

-- =========================================
-- 📊 QUERY DE EXEMPLO - AUDITORIA
-- =========================================

-- Ver pedidos modificados nas últimas 24 horas
-- SELECT * FROM public.orders 
-- WHERE updated_at > NOW() - INTERVAL '24 hours'
-- ORDER BY updated_at DESC;

-- Ver quem mais modifica pedidos
-- SELECT 
--     updated_by,
--     COUNT(*) as total_modificacoes
-- FROM public.orders
-- WHERE updated_at IS NOT NULL
-- GROUP BY updated_by
-- ORDER BY total_modificacoes DESC;

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
AND column_name IN ('updated_at', 'updated_by')
ORDER BY table_name, column_name;

-- Verificar se triggers foram criados
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

-- =========================================
-- 📝 NOTAS DE USO
-- =========================================
-- 1. updated_at é preenchido AUTOMATICAMENTE pelo trigger
-- 2. updated_by deve ser preenchido pela aplicação
-- 3. Exemplo de uso no código:
--    await supabase
--      .from('orders')
--      .update({ 
--        ...data, 
--        updated_by: currentUserEmail 
--      })
--      .eq('id', orderId)

-- =========================================
-- 🎯 BENEFÍCIOS
-- =========================================
-- ✅ Rastreamento completo de mudanças
-- ✅ Auditoria de quem modificou o quê
-- ✅ Análise de tempo de processamento
-- ✅ Compliance e governança de dados
