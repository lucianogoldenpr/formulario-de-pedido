-- MIGRAÇÃO: Preencher created_by em pedidos antigos
-- Execute este script no SQL Editor do Supabase

-- Atualiza todos os pedidos que não têm created_by
-- Atribui ao usuário admin (luciano@goldenpr.com.br)
UPDATE public.orders 
SET created_by = 'luciano@goldenpr.com.br'
WHERE created_by IS NULL;

-- Verifica quantos pedidos foram atualizados
SELECT 
  COUNT(*) as total_pedidos,
  COUNT(created_by) as com_usuario,
  COUNT(*) - COUNT(created_by) as sem_usuario
FROM public.orders;

-- Mostra os pedidos atualizados
SELECT 
  id,
  customer_name,
  created_by,
  created_at,
  date
FROM public.orders
ORDER BY created_at DESC
LIMIT 10;
