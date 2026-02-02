-- CORREÇÃO DO NOME DO ADMIN
-- O usuário 'luciano@goldenpr.com.br' é um COLABORADOR/VENDEDOR, não um cliente.

UPDATE public.app_users 
SET name = 'Luciano (Admin)' 
WHERE email = 'luciano@goldenpr.com.br';

-- Confere o resultado
SELECT * FROM public.app_users;
