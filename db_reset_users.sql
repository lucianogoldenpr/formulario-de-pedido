-- RECRIAÇÃO TOTAL DA TABELA DE USUÁRIOS
-- Execute este script no Supabase SQL Editor

-- 1. Apaga a tabela antiga se existir (Cuidado: apaga usuários existentes)
DROP TABLE IF EXISTS public.app_users;

-- 2. Cria a tabela novamente
CREATE TABLE public.app_users (
    email text PRIMARY KEY,
    name text NOT NULL,
    role text DEFAULT 'user',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login timestamp with time zone
);

-- 3. Configura permissões ABERTAS (sem bloqueios)
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.app_users TO anon;
GRANT ALL ON TABLE public.app_users TO authenticated;
GRANT ALL ON TABLE public.app_users TO service_role;

-- 4. Insere o Admin
INSERT INTO public.app_users (email, name, role)
VALUES ('luciano@goldenpr.com.br', 'Dr. Luciano Ferreira', 'admin');

-- Verificação final
SELECT * FROM public.app_users;
