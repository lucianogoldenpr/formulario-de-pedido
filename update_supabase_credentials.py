# Script para atualizar credenciais Supabase
# Execute: python update_supabase_credentials.py

import os
import re

# CONFIGURAÇÃO - PREENCHA COM SUAS CREDENCIAIS
NEW_SUPABASE_URL = "https://siomzanxeteltkskftp.supabase.co"
NEW_SUPABASE_KEY = "COLE_SUA_ANON_KEY_AQUI"  # Pegar em Settings → API

# Credenciais antigas (para substituir)
OLD_SUPABASE_URL = "https://zoqofjswsotykjfwqucp.supabase.co"
OLD_SUPABASE_KEY_PATTERN = r"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvcm9manN3c290eWtqZndxdWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4OTg3MjEsImV4cCI6MjA4MzQ3NDcyMX0\.b9XD-F4r3IWvMBKq6cfbHeJ3uLnFAUlpbQGIGZAkBXQ"

# Arquivos para atualizar
FILES_TO_UPDATE = [
    "services/supabaseService.ts",
    "services/storageService.ts",
    "App.tsx"
]

def update_file(filepath):
    """Atualiza as credenciais em um arquivo"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Substituir URL
        content = content.replace(OLD_SUPABASE_URL, NEW_SUPABASE_URL)
        
        # Substituir Key
        content = re.sub(OLD_SUPABASE_KEY_PATTERN, NEW_SUPABASE_KEY, content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Atualizado: {filepath}")
        return True
    except Exception as e:
        print(f"❌ Erro em {filepath}: {e}")
        return False

def main():
    print("🔧 Atualizando credenciais Supabase...\n")
    
    # Verificar se a key foi preenchida
    if NEW_SUPABASE_KEY == "COLE_SUA_ANON_KEY_AQUI":
        print("❌ ERRO: Você precisa preencher NEW_SUPABASE_KEY!")
        print("\n📝 Como pegar a Anon Key:")
        print("   1. Acesse: https://supabase.com/dashboard/project/siomzanxeteltkskftp/settings/api")
        print("   2. Copie a 'anon public' key")
        print("   3. Cole no script (variável NEW_SUPABASE_KEY)")
        print("   4. Execute novamente")
        return
    
    print(f"📍 Nova URL: {NEW_SUPABASE_URL}")
    print(f"🔑 Nova Key: {NEW_SUPABASE_KEY[:50]}...\n")
    
    success_count = 0
    for filepath in FILES_TO_UPDATE:
        if update_file(filepath):
            success_count += 1
    
    print(f"\n✅ Concluído! {success_count}/{len(FILES_TO_UPDATE)} arquivos atualizados")
    
    if success_count == len(FILES_TO_UPDATE):
        print("\n🎯 Próximos passos:")
        print("   1. Executar scripts SQL no Supabase")
        print("   2. Testar conexão: node test_supabase_connection.mjs")
        print("   3. Iniciar app: npm run dev")

if __name__ == "__main__":
    main()
