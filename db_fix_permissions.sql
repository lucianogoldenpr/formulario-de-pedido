-- CORREÇÃO DE PERMISSÕES PARA CADASTRO
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilita RLS temporariamente para garantir que não seja bloqueio de política
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;

-- 2. Garante permissões explícitas para a role 'anon' (usuários não logados) e 'authenticated'
GRANT ALL ON TABLE public.app_users TO anon;
GRANT ALL ON TABLE public.app_users TO authenticated;
GRANT ALL ON TABLE public.app_users TO service_role;

-- 3. Verifica se o usuário 'mauricio' já foi criado (caso tenha dado erro mas salvo)
SELECT * FROM public.app_users WHERE email LIKE 'mauricio%';
