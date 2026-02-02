# 🚀 Setup Rápido - Golden Projects Supabase

**Projeto Criado:** ✅ Golden Projects  
**URL:** `https://siomzanxeteltkskftp.supabase.co`  
**Data:** 2026-02-02

---

## 📋 **PASSO 1: Copiar Anon Key**

### **Acessar:**

```
https://supabase.com/dashboard/project/siomzanxeteltkskftp/settings/api
```

### **Copiar:**

Procure por **"anon public"** e copie a key completa.

Exemplo:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpb216YW54ZXRlbHRrc2tmdHAiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczODUwMTM0MSwiZXhwIjoyMDU0MDc3MzQxfQ...
```

---

## 📋 **PASSO 2: Atualizar Código**

### **Opção A: Script Automático (Recomendado)**

1. **Editar o script:**

   ```
   update_supabase_credentials.py
   ```

2. **Colar sua Anon Key:**

   ```python
   NEW_SUPABASE_KEY = "COLE_AQUI_SUA_ANON_KEY"
   ```

3. **Executar:**

   ```bash
   python update_supabase_credentials.py
   ```

### **Opção B: Manual**

Atualizar 3 arquivos:

**1. services/supabaseService.ts (linha 9-10):**

```typescript
const supabaseUrl = 'https://siomzanxeteltkskftp.supabase.co';
const supabaseAnonKey = '[SUA_ANON_KEY]';
```

**2. services/storageService.ts (linha 3-4):**

```typescript
const supabaseUrl = 'https://siomzanxeteltkskftp.supabase.co';
const supabaseAnonKey = '[SUA_ANON_KEY]';
```

**3. App.tsx (linha 27-28):**

```typescript
const url = 'https://siomzanxeteltkskftp.supabase.co';
const key = '[SUA_ANON_KEY]';
```

---

## 📋 **PASSO 3: Executar Scripts SQL**

### **Acessar SQL Editor:**

```
https://supabase.com/dashboard/project/siomzanxeteltkskftp/sql/new
```

### **Executar na Ordem:**

#### **1. db_schema_users.sql**

```sql
-- Copiar e colar conteúdo completo do arquivo
-- Clicar em "Run" (Ctrl+Enter)
```

#### **2. db_schema_orders.sql**

```sql
-- Copiar e colar conteúdo completo do arquivo
-- Clicar em "Run"
```

#### **3. db_schema_pdf_storage.sql**

```sql
-- Copiar e colar conteúdo completo do arquivo
-- Clicar em "Run"
```

#### **4. db_optimization.sql**

```sql
-- Copiar e colar conteúdo completo do arquivo
-- Clicar em "Run"
```

#### **5. db_audit.sql**

```sql
-- Copiar e colar conteúdo completo do arquivo
-- Clicar em "Run"
```

#### **6. db_soft_delete.sql**

```sql
-- Copiar e colar conteúdo completo do arquivo
-- Clicar em "Run"
```

#### **7. db_security.sql**

```sql
-- Copiar e colar conteúdo completo do arquivo
-- Clicar em "Run"
```

---

## 📋 **PASSO 4: Configurar Storage**

### **Criar Bucket:**

```
Storage → New bucket
```

**Nome:** `acceptance-pdfs`  
**Public:** ✅ Sim

### **Configurar Políticas:**

No SQL Editor:

```sql
-- Permitir upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'acceptance-pdfs');

-- Permitir leitura pública
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'acceptance-pdfs');
```

---

## 📋 **PASSO 5: Testar**

### **Testar Conexão:**

```bash
cd "C:\Users\Luciano\Downloads\projeto golden\formulario de pedidos\Golden-Equipamentos-Medicos"
node test_supabase_connection.mjs
```

**Resultado Esperado:**

```
✅ CONEXÃO ESTABELECIDA!
📊 Banco de dados está funcionando! (0 pedidos)
```

### **Iniciar Aplicação:**

```bash
npm run dev
```

Abrir: `http://localhost:3000`

---

## ✅ **CHECKLIST**

- [ ] Anon Key copiada
- [ ] Código atualizado (3 arquivos)
- [ ] Script db_schema_users.sql executado
- [ ] Script db_schema_orders.sql executado
- [ ] Script db_schema_pdf_storage.sql executado
- [ ] Script db_optimization.sql executado
- [ ] Script db_audit.sql executado
- [ ] Script db_soft_delete.sql executado
- [ ] Script db_security.sql executado
- [ ] Storage bucket criado
- [ ] Teste de conexão passou
- [ ] Aplicação funcionando

---

## 🎯 **Links Úteis**

**Dashboard:**

```
https://supabase.com/dashboard/project/siomzanxeteltkskftp
```

**SQL Editor:**

```
https://supabase.com/dashboard/project/siomzanxeteltkskftp/sql/new
```

**Table Editor:**

```
https://supabase.com/dashboard/project/siomzanxeteltkskftp/editor
```

**API Settings:**

```
https://supabase.com/dashboard/project/siomzanxeteltkskftp/settings/api
```

**Storage:**

```
https://supabase.com/dashboard/project/siomzanxeteltkskftp/storage/buckets
```

---

**Tempo estimado:** 10-15 minutos  
**Pronto para começar!** 🚀✨
