-- ==================================================================
-- 🚑 SCRIPT DE CORREÇÃO DE ERROS DE VALIDAÇÃO (CONSTRAINTS)
-- ==================================================================
-- Este script remove as regras antigas que estão impedindo seus pedidos de serem salvos.

-- 1. Remove restrição de STATUS (Permite qualquer texto como status)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS valid_status;

-- 2. Remove restrição de CLASSIFICAÇÃO (Se houver)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS valid_classification;

-- 3. Remove restrição de datas (Se houver)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS valid_dates;

-- Confirmação
SELECT 'Correções aplicadas com sucesso. Tente recuperar os pedidos agora.' as result;
