# 📦 Golden - Controle de Pedidos

> **Status:** ✅ Produção | **Versão:** 1.5.0 (2026-02-03)
>
> Sistema especializado para criação, gestão e arquivamento de pedidos da Golden Equipamentos Médicos.

---

## 🚀 O que há de novo? (Sessão Atual)

Nesta última atualização, transformamos o sistema de um simples formulário para uma plataforma completa de gestão:

- ✅ **Geração Automática de PDF:** O sistema agora cria o documento oficial no exato momento do salvamento.
- ✅ **Cloud Archiving:** Integração real com **Supabase Storage** para arquivar PDFs permanentemente.
- ✅ **Controle de Acesso (RBAC):** Diferenciação entre Admins e Vendedores.
- ✅ **Privacidade de Dados:** Vendedores agora possuem visão restrita apenas aos seus próprios pedidos.
- ✅ **Gestão de Usuários:** Interface administrativa para criar e gerenciar acessos e senhas.

---

## 🎨 Design System: Cyber-Medical Brutalist

O projeto segue o **Golden Design System (GDS)**:

- **Estética:** Bordas afiadas, alto contraste, tipografia técnica.
- **Paleta:** Slate-900 (Fundo), Amber-500 (Destaque), Emerald-500 (Sucesso).
- **UX:** Micro-interações rápidas e feedbacks visuais via Toasts.

---

## 🛠️ Tecnologias

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind CSS (Modern Patterns)
- **Backend/DB:** Supabase (Auth, DB, Storage)
- **Documentos:** jsPDF + autoTable

---

## 📂 Estrutura do Projeto

```bash
Golden-Equipamentos-Medicos/
├── 📁 components/        # Componentes UI (GDS)
│   ├── OrderForm.tsx     # O cérebro da criação
│   ├── OrderList.tsx     # Lista inteligente e filtrada
│   └── UserManagement.tsx # Painel de Administração
├── 📁 services/          # Integrações (Supabase, LocalStorage)
├── 📁 utils/             # Lógica de PDF e Conversão
└── 📁 types/             # Definições TypeScript
```

---

## 🚀 Como Rodar

1. **Dependências:**

   ```bash
   npm install
   ```

2. **Configuração Supabase:**
   Certifique-se de configurar o `.env.local` com suas credenciais.
   > **Nota:** É necessário criar um bucket no Storage chamado `order-pdfs`.

3. **Execução:**

   ```bash
   npm run dev
   ```

---

## 🛡️ Regras de Negócio

1. **Admins:** Acesso total (Usuários, todos os pedidos, deletar).
2. **Vendedores:** Criam pedidos e acessam apenas seu próprio histórico.
3. **PDFs:** Somente pedidos salvos na nuvem geram arquivamento digital automático.

---

**Desenvolvido por:** Antigravity AI  
**Para:** Golden Equipamentos Médicos
