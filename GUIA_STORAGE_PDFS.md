# 📦 GUIA: Configurar Storage de PDFs no Supabase

## ✅ **Passo 1: Criar Bucket (FAÇA AGORA)**

1. **Acesse**: <https://supabase.com/dashboard>
2. **Selecione seu projeto**: `zoqofjswsotykjfwqucp`
3. **Menu lateral**: Clique em **"Storage"**
4. **Clique**: "Create a new bucket"
5. **Preencha**:
   - **Name**: `order-pdfs`
   - **Public bucket**: ✅ **MARQUE COMO PUBLIC**
   - **File size limit**: 50 MB (padrão)
6. **Clique**: "Create bucket"

---

## ✅ **Passo 2: Configurar Políticas de Acesso**

1. **No Supabase Dashboard**, vá em **"SQL Editor"**
2. **Clique em**: "+ New Query"
3. **Copie e cole** TODO o conteúdo do arquivo: `db_schema_pdf_storage.sql`
4. **Clique em**: "RUN" (ou Ctrl+Enter)
5. **Aguarde**: "Success. No rows returned"

---

## ✅ **Passo 3: Testar o Sistema**

Após executar os passos acima, o sistema estará pronto!

### **O que vai acontecer automaticamente:**

1. **Quando gerar PDF do Formulário**:
   - ✅ PDF é salvo no Supabase Storage
   - ✅ URL é salva na tabela `orders`
   - ✅ Link aparece na lista de pedidos

2. **Quando gerar PDF de Aceite**:
   - ✅ PDF é salvo no Supabase Storage
   - ✅ Log é criado em `acceptance_pdfs`
   - ✅ Link fica disponível para download

3. **Na lista de pedidos**:
   - ✅ Ícone 📄 aparece se o PDF foi gerado
   - ✅ Clique no ícone para baixar o PDF
   - ✅ Todos os usuários podem baixar (não precisa ser admin)

---

## 🧪 **Como Testar:**

1. **Faça login** no app
2. **Crie um novo pedido** (ou use "Preencher Teste")
3. **Salve o pedido**
4. **Clique em "Compartilhar"**
5. **Clique em "Baixar PDF"**
6. **Aguarde** a mensagem: "✅ PDF salvo no Supabase!"
7. **Volte para a lista**
8. **Veja o ícone 📄** ao lado do pedido
9. **Clique no ícone** para baixar o PDF salvo

---

## 🔍 **Verificar no Supabase:**

1. **Vá em**: Storage → order-pdfs
2. **Você verá**: Lista de PDFs salvos
3. **Vá em**: Table Editor → orders
4. **Veja**: Coluna `pdf_url` preenchida
5. **Vá em**: Table Editor → acceptance_pdfs
6. **Veja**: Logs de PDFs de aceite

---

## ⚠️ **IMPORTANTE:**

- **Bucket DEVE ser PUBLIC** para permitir downloads
- **Não delete o bucket** depois de criar
- **PDFs antigos** (gerados antes) não terão link (normal)
- **Novos PDFs** serão salvos automaticamente

---

## 🆘 **Se der erro:**

1. **Verifique** se o bucket `order-pdfs` existe
2. **Verifique** se está marcado como PUBLIC
3. **Execute** o script SQL novamente
4. **Limpe o cache** (Ctrl+Shift+R)
5. **Me avise** se o erro persistir!

---

**Depois de criar o bucket e executar o SQL, me avise para eu integrar o código!** 🚀
