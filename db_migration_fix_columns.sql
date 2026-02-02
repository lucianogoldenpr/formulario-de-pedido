-- MIGRAÇÃO: Adiciona colunas faltantes na tabela orders
-- Execute este script no SQL Editor do Supabase

-- Adiciona valid_until se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'valid_until'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN valid_until text;
    END IF;
END $$;

-- Adiciona down_payment se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'down_payment'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN down_payment numeric;
    END IF;
END $$;

-- Adiciona shipping_cost se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shipping_cost'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN shipping_cost numeric;
    END IF;
END $$;

-- Adiciona carrier se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'carrier'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN carrier text;
    END IF;
END $$;

-- Adiciona shipping_type se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'shipping_type'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN shipping_type text;
    END IF;
END $$;

-- Remove customer_birthday se existir (foi removido do tipo)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'customer_birthday'
    ) THEN
        ALTER TABLE public.orders DROP COLUMN customer_birthday;
    END IF;
END $$;

-- Remove birthday da tabela order_contacts se existir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_contacts' AND column_name = 'birthday'
    ) THEN
        ALTER TABLE public.order_contacts DROP COLUMN birthday;
    END IF;
END $$;

-- Adiciona discount na tabela order_items se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'discount'
    ) THEN
        ALTER TABLE public.order_items ADD COLUMN discount numeric DEFAULT 0;
    END IF;
END $$;
