# 🔧 CORREÇÃO URGENTE - Colunas Faltantes no Supabase

## ❌ Problema

Erro ao salvar: `Could not find the 'valid_until' column of 'orders' in the schema cache`

## ✅ Solução (2 minutos)

### **Passo 1: Abrir Supabase**

1. Acesse: <https://supabase.com/dashboard>
2. Selecione seu projeto: **zoqofjswsotykjfwqucp**
3. No menu lateral, clique em **"SQL Editor"**

### **Passo 2: Executar Script de Migração**

1. Clique em **"+ New Query"**
2. **Copie TODO o conteúdo** do arquivo: `db_migration_fix_columns.sql`
3. **Cole** no editor SQL
4. Clique em **"RUN"** (ou pressione Ctrl+Enter)
5. Aguarde a mensagem: **"Success. No rows returned"**

### **Passo 3: Testar Novamente**

1. Volte ao app: `http://localhost:3000`
2. Clique em **"Gerar Pedido"**
3. Clique em **"Preencher Teste"**
4. Clique em **"Gerar Formulário de Pedido"**
5. Deve aparecer: **✅ "Pedido salvo COM SUCESSO no Supabase (Nuvem)!"**

---

## 📋 O que o script faz?

✅ Adiciona colunas faltantes:

- `valid_until` (data de validade)
- `down_payment` (valor de entrada)
- `shipping_cost` (custo de envio)
- `carrier` (transportadora)
- `shipping_type` (tipo de frete)

✅ Remove colunas obsoletas:

- `customer_birthday` (removido do sistema)
- `birthday` em contatos (removido do sistema)

✅ Adiciona `discount` nos itens

**O script é SEGURO**: Não apaga dados existentes! ✅

---

## 🆘 Se ainda der erro

Me envie uma captura de tela do erro e vou ajustar!
