-- CRIAÇÃO DA TABELA DE USUÁRIOS DO APLICATIVO
-- Execute este script no SQL Editor do Supabase

-- 1. Cria a tabela de usuários
CREATE TABLE IF NOT EXISTS public.app_users (
    email text PRIMARY KEY,
    name text NOT NULL,
    role text DEFAULT 'user', -- 'admin' ou 'user'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_login timestamp with time zone
);

-- 2. Habilita RLS (Segurança)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- 3. Cria políticas de acesso (Simples para este caso de uso)
-- Permite leitura pública (para verificar login)
CREATE POLICY "Enable read access for all users" ON public.app_users FOR SELECT USING (true);

-- Permite inserção pública (para auto-cadastro)
CREATE POLICY "Enable insert access for all users" ON public.app_users FOR INSERT WITH CHECK (true);

-- Permite atualização (para last_login)
CREATE POLICY "Enable update access for all users" ON public.app_users FOR UPDATE USING (true);

-- 4. Insere o usuário Admin inicial (Luciano)
INSERT INTO public.app_users (email, name, role)
VALUES ('luciano@goldenpr.com.br', 'Dr. Luciano Ferreira', 'admin')
ON CONFLICT (email) DO UPDATE 
SET role = 'admin'; -- Garante que Luciano seja admin
