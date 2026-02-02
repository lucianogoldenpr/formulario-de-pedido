-- VERIFICAÇÃO: Checar se os dados estão salvos corretamente
-- Execute este script para ver os dados

SELECT 
  id,
  customer_name,
  created_by,
  created_at,
  date
FROM public.orders
ORDER BY created_at DESC
LIMIT 5;
