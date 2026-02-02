# 🚀 Guia: Criar Projeto Supabase - Formulário de Pedidos Golden

**Data:** 2026-02-02  
**Objetivo:** Criar e configurar banco de dados PostgreSQL no Supabase

---

## 📋 **PASSO 1: Criar Projeto Supabase**

### **1.1 Acessar Dashboard**

```
https://supabase.com/dashboard
```

### **1.2 Fazer Login**

- Use sua conta existente
- Ou crie uma nova conta (se necessário)

### **1.3 Criar Novo Projeto**

1. Clique em **"New Project"** (botão verde)
2. Selecione a organização: **"lucianogavaz's Org"** (ou outra de sua preferência)

### **1.4 Configurar Projeto**

**Nome do Projeto:**

```
Golden Formulário de Pedidos
```

**Database Password:**

```
[ESCOLHA UMA SENHA FORTE]
Exemplo: Golden@Pedidos2026!
```

⚠️ **IMPORTANTE:** Anote essa senha! Você vai precisar dela.

**Region:**

```
South America (São Paulo)
```

✅ Menor latência para Brasil

**Pricing Plan:**

```
Free (até 500MB database + 1GB storage)
```

### **1.5 Criar Projeto**

- Clique em **"Create new project"**
- Aguarde ~2 minutos (criação do banco)

---

## 📋 **PASSO 2: Copiar Credenciais**

### **2.1 Acessar Settings**

Após criação, vá em:

```
Project Settings → API
```

### **2.2 Copiar Informações**

**Project URL:**

```
https://[SEU-PROJECT-ID].supabase.co
```

Exemplo: `https://abcdefghijklmnop.supabase.co`

**Anon/Public Key:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(String longa começando com "eyJ")

⚠️ **Anote essas informações!**

---

## 📋 **PASSO 3: Atualizar Código**

### **3.1 Abrir Arquivo**

```
formulario de pedidos/Golden-Equipamentos-Medicos/services/supabaseService.ts
```

### **3.2 Substituir Credenciais**

**ANTES:**

```typescript
const supabaseUrl = 'https://zoqofjswsotykjfwqucp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**DEPOIS:**

```typescript
const supabaseUrl = 'https://[SEU-PROJECT-ID].supabase.co';
const supabaseAnonKey = '[SUA-ANON-KEY]';
```

### **3.3 Atualizar Outros Arquivos**

**Arquivo:** `services/storageService.ts`

```typescript
const supabaseUrl = 'https://[SEU-PROJECT-ID].supabase.co';
const supabaseAnonKey = '[SUA-ANON-KEY]';
```

**Arquivo:** `App.tsx` (linha 27)

```typescript
const url = 'https://[SEU-PROJECT-ID].supabase.co';
const key = '[SUA-ANON-KEY]';
```

---

## 📋 **PASSO 4: Executar Scripts SQL**

### **4.1 Acessar SQL Editor**

No dashboard do Supabase:

```
SQL Editor (menu lateral)
```

### **4.2 Executar Scripts na Ordem**

#### **Script 1: db_schema_users.sql**

1. Abra o arquivo local
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"** (ou Ctrl+Enter)
5. Aguarde mensagem de sucesso ✅

#### **Script 2: db_schema_orders.sql**

1. Abra o arquivo local
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. Aguarde mensagem de sucesso ✅

#### **Script 3: db_schema_pdf_storage.sql**

1. Abra o arquivo local
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. Aguarde mensagem de sucesso ✅

#### **Script 4: db_optimization.sql** (Novo)

1. Abra o arquivo local
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. Aguarde mensagem de sucesso ✅

#### **Script 5: db_audit.sql** (Novo)

1. Abra o arquivo local
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. Aguarde mensagem de sucesso ✅

#### **Script 6: db_soft_delete.sql** (Novo)

1. Abra o arquivo local
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. Aguarde mensagem de sucesso ✅

#### **Script 7: db_security.sql** (Novo)

1. Abra o arquivo local
2. Copie TODO o conteúdo
3. Cole no SQL Editor
4. Clique em **"Run"**
5. Aguarde mensagem de sucesso ✅

---

## 📋 **PASSO 5: Configurar Storage (Para PDFs)**

### **5.1 Criar Bucket**

No dashboard:

```
Storage → Create a new bucket
```

**Nome do Bucket:**

```
acceptance-pdfs
```

**Public bucket:** ✅ Marcar (para permitir acesso aos PDFs)

### **5.2 Configurar Políticas**

```sql
-- Permitir upload de PDFs
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'acceptance-pdfs');

-- Permitir leitura pública
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'acceptance-pdfs');
```

---

## 📋 **PASSO 6: Testar Conexão**

### **6.1 Executar Script de Teste**

```bash
cd "C:\Users\Luciano\Downloads\projeto golden\formulario de pedidos\Golden-Equipamentos-Medicos"
node test_supabase_connection.mjs
```

**Resultado Esperado:**

```
✅ CONEXÃO ESTABELECIDA!
📊 Banco de dados está funcionando! (0 pedidos)
```

### **6.2 Testar Aplicação**

```bash
npm run dev
```

Abra: `http://localhost:3000`

1. Faça login
2. Crie um pedido de teste
3. Verifique se salvou no Supabase

---

## 📋 **PASSO 7: Verificar no Dashboard**

### **7.1 Ver Tabelas Criadas**

No dashboard:

```
Table Editor (menu lateral)
```

**Tabelas esperadas:**

- ✅ orders
- ✅ order_items
- ✅ order_contacts
- ✅ app_users
- ✅ acceptance_pdfs

### **7.2 Ver Dados**

Clique em cada tabela para ver os dados salvos.

---

## ✅ **CHECKLIST DE CONCLUSÃO**

- [ ] Projeto Supabase criado
- [ ] Credenciais copiadas
- [ ] Código atualizado (supabaseService.ts)
- [ ] Código atualizado (storageService.ts)
- [ ] Código atualizado (App.tsx)
- [ ] Script db_schema_users.sql executado
- [ ] Script db_schema_orders.sql executado
- [ ] Script db_schema_pdf_storage.sql executado
- [ ] Script db_optimization.sql executado
- [ ] Script db_audit.sql executado
- [ ] Script db_soft_delete.sql executado
- [ ] Script db_security.sql executado
- [ ] Storage bucket criado
- [ ] Teste de conexão passou
- [ ] Aplicação testada
- [ ] Pedido de teste criado

---

## 🎯 **Próximos Passos (Após Configuração)**

1. **Backup Automático:**
   - Supabase faz backup automático (7 dias no free tier)
   - Considere export manual semanal

2. **Monitoramento:**
   - Dashboard → Database → Usage
   - Verificar uso de storage e bandwidth

3. **Segurança:**
   - Implementar Supabase Auth (futuro)
   - Melhorar políticas RLS por usuário

---

## 📝 **Informações Importantes**

**Free Tier Limits:**

- 500MB Database
- 1GB File Storage
- 2GB Bandwidth/mês
- 50MB File Upload Limit

**Quando Escalar:**

- Pro Plan: $25/mês
- 8GB Database
- 100GB Storage
- 250GB Bandwidth

---

## 🆘 **Problemas Comuns**

### **Erro: "relation does not exist"**

- Você esqueceu de executar os scripts SQL
- Execute os scripts de schema primeiro

### **Erro: "Invalid API key"**

- Credenciais incorretas
- Verifique se copiou a Anon Key correta

### **Erro: "Failed to fetch"**

- Projeto não existe
- Verifique a URL do projeto

---

**Tempo estimado:** 15-20 minutos  
**Dificuldade:** Média  
**Custo:** Grátis (Free Tier)

**Boa sorte!** 🚀✨
