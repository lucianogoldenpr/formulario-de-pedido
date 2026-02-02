# Script para concatenar arquivos SQL na ordem correta
import os

# Lista de arquivos na ordem exata de dependência
files = [
    'db_schema_users.sql',       # 1. Cria tabela de usuários
    'db_schema_orders.sql',      # 2. Cria tabelas de pedidos (depende de nada, mas bom vir antes)
    'db_schema_pdf_storage.sql', # 3. Cria tabelas de PDF
    'db_optimization.sql',       # 4. Cria índices (precisa das tabelas acima)
    'db_audit.sql',              # 5. Cria triggers de auditoria
    'db_soft_delete.sql',        # 6. Adiciona soft delete
    'db_security.sql'            # 7. Adiciona regras de segurança finais
]

output_file = 'db_FULL_SETUP.sql'

print(f"🔄 Gerando {output_file}...")

try:
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write("-- ==================================================================\n")
        outfile.write("-- 🚀 SCRIPT DE SETUP COMPLETO - GOLDEN FORMULÁRIO DE PEDIDOS\n")
        outfile.write("-- ==================================================================\n")
        outfile.write("-- Data: 02/02/2026\n")
        outfile.write("-- Descrição: Cria TODAS as tabelas, índices e regras de uma vez só.\n")
        outfile.write("-- INSTALAÇÃO: Copie e cole todo este conteúdo no SQL Editor do Supabase.\n")
        outfile.write("-- ==================================================================\n\n")

        for filename in files:
            if os.path.exists(filename):
                print(f"   ➕ Adicionando {filename}...")
                outfile.write(f"\n\n-- >>> INÍCIO DO ARQUIVO: {filename} <<<\n")
                with open(filename, 'r', encoding='utf-8') as infile:
                    outfile.write(infile.read())
                outfile.write(f"\n-- >>> FIM DO ARQUIVO: {filename} <<<\n")
            else:
                print(f"⚠️ AVISO: Arquivo {filename} não encontrado. Pulando.")

    print(f"\n✅ Arquivo {output_file} gerado com sucesso!")

except Exception as e:
    print(f"\n❌ Erro ao gerar o arquivo: {e}")
