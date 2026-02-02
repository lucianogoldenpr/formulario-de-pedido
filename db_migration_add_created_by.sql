-- MIGRAÇÃO: Adicionar campo de usuário criador
-- Execute este script no SQL Editor do Supabase

-- Adiciona coluna created_by se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN created_by text;
    END IF;
END $$;

-- Adiciona índice para busca rápida por usuário
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON public.orders(created_by);

-- Comentário para documentação
COMMENT ON COLUMN public.orders.created_by IS 'Email do usuário que criou o pedido';
