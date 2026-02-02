# 📝 Guia de Implementação - Botão de Importação Excel

## ✅ O que já está pronto

1. ✅ Utilitário de importação criado em `utils/importUtils.ts`
2. ✅ Ícone Upload adicionado em `constants.tsx`
3. ✅ PDF corrigido e deve funcionar agora

## 🔧 Como adicionar o botão de importação

### Passo 1: Adicionar no App.tsx

Adicione esta função no componente App (após a função `handleDelete`):

```typescript
const handleImport = async (file: File) => {
  try {
    setIsLoading(true);
    const { importFromExcel } = await import('./utils/importUtils');
    const importedData = await importFromExcel(file);
    
    // Criar um novo pedido com os dados importados
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR'),
      salesperson: user || '',
      status: 'draft',
      ...importedData,
      customer: importedData.customer!,
      items: importedData.items || [],
      paymentTerms: importedData.paymentTerms || '',
      deliveryTime: importedData.deliveryTime || '',
      validity: importedData.validity || '',
      notes: importedData.notes || '',
      totalWeight: importedData.totalWeight || 0,
      totalAmount: importedData.totalAmount || 0,
      shippingCost: importedData.shippingCost || 0,
      validUntil: importedData.validUntil || ''
    };
    
    // Editar o pedido importado
    setEditingOrder(newOrder);
    setView('form');
    alert('Dados importados com sucesso! Revise e salve o pedido.');
  } catch (error) {
    console.error('Erro ao importar:', error);
    alert('Erro ao importar arquivo. Verifique se o formato está correto.');
  } finally {
    setIsLoading(false);
  }
};
```

### Passo 2: Passar a função para OrderList

No componente App, onde você renderiza o OrderList, adicione a prop `onImport`:

```typescript
<OrderList 
  orders={orders} 
  onSelect={setSelectedForShare} 
  onEdit={handleEdit}
  onNew={handleNew}
  onDelete={handleDelete}
  onRefresh={loadOrders}
  onImport={handleImport}  // <-- ADICIONAR ESTA LINHA
/>
```

### Passo 3: Adicionar o botão no OrderList.tsx

No arquivo `components/OrderList.tsx`, adicione este código logo após a linha 34 (`</div>`):

```typescript
<div className="flex gap-2">
  {onImport && (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
      <button 
        onClick={() => fileInputRef.current?.click()}
        className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 rounded-xl transition shadow-sm"
        title="Importar de Excel"
      >
        {ICONS.Upload}
      </button>
    </>
  )}
  {/* ... resto dos botões ... */}
```

## 📄 Formato do Excel para Importação

O arquivo Excel deve seguir o mesmo formato do arquivo exportado:

- Linha com "Razão Social:", seguida do nome
- Linha com "CNPJ/CPF:", seguida do documento
- Linha com "E-mail:", seguida do email
- Linha com "Telefone:", seguida do telefone
- Tabela de itens com colunas: ITEM, REF, DESCRIÇÃO, UN, QTD, UNITÁRIO, TOTAL
- Condições comerciais no final

## 🎯 Testando

1. Exporte um pedido existente para Excel
2. Modifique os dados no Excel
3. Use o botão de Upload (seta para cima) para importar
4. O formulário abrirá com os dados preenchidos
5. Revise e salve

---

**Nota**: O botão de importação já está parcialmente implementado no código. Você só precisa seguir os passos acima para completar a integração!
