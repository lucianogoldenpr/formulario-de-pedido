-- MIGRAÇÃO: Preencher created_by em pedidos antigos
-- Execute APENAS este comando no SQL Editor do Supabase

UPDATE public.orders 
SET created_by = 'luciano@goldenpr.com.br'
WHERE created_by IS NULL;
