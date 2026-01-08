
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Order } from '../types';

export const exportToExcel = (order: Order) => {
  // Criar estrutura de dados para o corpo da planilha (Itens)
  const itemRows = order.items.map((item, idx) => [
    idx + 1,
    item.code || '',
    item.description,
    item.unit || 'UN',
    item.quantity,
    item.unitPrice,
    item.total
  ]);

  // Criar a planilha (Worksheet)
  const wsData = [
    ["GOLDEN EQUIPAMENTOS MÉDICOS - FORMULÁRIO DE PEDIDO"],
    ["ID DO PEDIDO:", order.id, "DATA:", order.date],
    ["VENDEDOR:", order.salesperson],
    [""],
    ["DADOS DO CLIENTE"],
    ["Razão Social:", order.customer.name],
    ["CNPJ/CPF:", order.customer.document],
    ["I.E:", order.customer.stateRegistration || 'ISENTO'],
    ["E-mail:", order.customer.email],
    ["Telefone:", order.customer.phone],
    [""],
    ["ENDEREÇO DE FATURAMENTO"],
    ["Logradouro:", `${order.customer.billingAddress.street}, ${order.customer.billingAddress.number} ${order.customer.billingAddress.complement}`],
    ["Bairro:", order.customer.billingAddress.neighborhood],
    ["Cidade:", `${order.customer.billingAddress.city} - ${order.customer.billingAddress.state}`],
    ["CEP:", order.customer.billingAddress.zipCode],
    [""],
    ["ITENS DO PEDIDO"],
    ["ITEM", "REF", "DESCRIÇÃO", "UN", "QTD", "UNITÁRIO", "TOTAL"],
    ...itemRows,
    [""],
    ["RESUMO FINANCEIRO"],
    ["Subtotal:", "", "", "", "", "", order.globalValue1],
    ["Desconto:", "", "", "", "", "", order.discountTotal],
    ["Frete:", "", "", "", "", "", order.freightValue],
    ["TOTAL LÍQUIDO:", "", "", "", "", "", order.globalValue2],
    ["Moeda Original:", order.currencyConversion],
    ["Taxa de Câmbio:", order.exchangeRate],
    ["VALOR TOTAL EM REAIS (R$):", "", "", "", "", "", order.totalInBRL],
    [""],
    ["CONDIÇÕES COMERCIAIS"],
    ["Forma de Pagamento:", order.paymentTerms],
    ["Prazo de Entrega:", order.deliveryTime],
    ["Validade da Proposta:", order.validity],
    ["Observações:", order.notes]
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ajustar larguras de colunas
  const wscols = [
    {wch: 6},  // ITEM
    {wch: 12}, // REF
    {wch: 50}, // DESCRIÇÃO
    {wch: 6},  // UN
    {wch: 8},  // QTD
    {wch: 15}, // UNIT
    {wch: 15}, // TOTAL
  ];
  ws['!cols'] = wscols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pedido " + order.id);

  // Forçar o tipo do arquivo para XLSX real
  XLSX.writeFile(wb, `PEDIDO_GOLDEN_${order.id}.xlsx`, { bookType: 'xlsx' });
};

export const generatePDF = (order: Order) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  const pageWidth = doc.internal.pageSize.width;

  // Cabeçalho Profissional
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("GOLDEN", 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(212, 175, 55); // Dourado
  doc.text("EQUIPAMENTOS MÉDICOS", 20, 26);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("FORMULÁRIO DE PEDIDO", pageWidth - 20, 25, { align: 'right' });

  // Informações Gerais
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`PEDIDO N°: ${order.id}`, 20, 50);
  doc.text(`DATA: ${order.date}`, pageWidth - 20, 50, { align: 'right' });
  doc.text(`VENDEDOR: ${order.salesperson}`, 20, 56);

  // Bloco de Cliente
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 62, pageWidth - 20, 62);
  
  doc.setFontSize(11);
  doc.text("DADOS DO CLIENTE", 20, 70);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Razão Social: ${order.customer.name}`, 20, 76);
  doc.text(`CNPJ/CPF: ${order.customer.document}`, 20, 81);
  doc.text(`Insc. Estadual: ${order.customer.stateRegistration || 'Isento'}`, 20, 86);
  doc.text(`Telefone: ${order.customer.phone}`, 110, 76);
  doc.text(`E-mail: ${order.customer.email}`, 110, 81);

  // Endereço
  doc.setFont("helvetica", "bold");
  doc.text("ENDEREÇO DE FATURAMENTO", 20, 95);
  doc.setFont("helvetica", "normal");
  doc.text(`${order.customer.billingAddress.street}, ${order.customer.billingAddress.number} - ${order.customer.billingAddress.complement}`, 20, 100);
  doc.text(`${order.customer.billingAddress.neighborhood} - ${order.customer.billingAddress.city}/${order.customer.billingAddress.state}`, 20, 105);
  doc.text(`CEP: ${order.customer.billingAddress.zipCode}`, 20, 110);

  // Tabela de Itens
  const tableData = order.items.map((item, i) => [
    i + 1,
    item.code || '-',
    item.description,
    item.unit || 'UN',
    item.quantity,
    `${order.currencyConversion || 'R$'} ${item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
    `${order.currencyConversion || 'R$'} ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  ]);

  (doc as any).autoTable({
    startY: 120,
    head: [['IT', 'REF', 'PRODUTO', 'UN', 'QTD', 'UNITÁRIO', 'TOTAL']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 15 },
      3: { cellWidth: 10 },
      4: { cellWidth: 10 },
      5: { cellWidth: 25, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Rodapé Financeiro
  doc.setFillColor(248, 250, 252);
  doc.rect(120, finalY, 70, 35, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(0,0,0);
  doc.text(`Subtotal: ${order.currencyConversion || 'R$'} ${(order.globalValue1 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 125, finalY + 7);
  doc.text(`Descontos: ${order.currencyConversion || 'R$'} ${(order.discountTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 125, finalY + 13);
  doc.text(`Frete: ${order.currencyConversion || 'R$'} ${(order.freightValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 125, finalY + 19);
  
  doc.setFontSize(11);
  doc.setTextColor(184, 134, 11); // Dark Golden
  doc.text(`TOTAL LÍQUIDO:`, 125, finalY + 28);
  doc.text(`${order.currencyConversion || 'R$'} ${(order.globalValue2 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 25, finalY + 28, { align: 'right' });

  if (order.currencyConversion !== 'Real') {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Conversão (Taxa: ${order.exchangeRate})`, 20, finalY + 5);
    doc.text(`Equiv. em Reais: R$ ${order.totalInBRL?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, finalY + 10);
  }

  // Notas e Condições
  doc.setTextColor(0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CONDIÇÕES COMERCIAIS", 20, finalY + 45);
  doc.setFont("helvetica", "normal");
  doc.text(`Pagamento: ${order.paymentTerms}`, 20, finalY + 50);
  doc.text(`Entrega: ${order.deliveryTime}`, 20, finalY + 55);
  doc.text(`Validade: ${order.validity}`, 20, finalY + 60);

  return doc;
};

export const shareWhatsApp = (order: Order) => {
  const currencySymbol = order.currencyConversion === 'Real' ? 'R$' : (order.currencyConversion || 'R$');
  const message = encodeURIComponent(
    `*FORMULÁRIO DE PEDIDO - GOLDEN EQUIPAMENTOS MÉDICOS*\n\n` +
    `Olá ${order.customer.name},\n` +
    `Segue o registro do seu pedido Nº *${order.id}*.\n\n` +
    `*Resumo do Formulário:*\n` +
    `Itens: ${order.items.length}\n` +
    `Total Líquido: *${currencySymbol} ${(order.globalValue2 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\n\n` +
    `*Logística:*\n` +
    `Entrega Estimada: ${order.deliveryTime}\n\n` +
    `Vendedor: ${order.salesperson}`
  );
  window.open(`https://wa.me/${order.customer.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
};

export const shareEmail = (order: Order, body: string) => {
  const subject = encodeURIComponent(`Formulário de Pedido Golden - N° ${order.id} - ${order.customer.name}`);
  const mailBody = encodeURIComponent(body);
  window.location.href = `mailto:${order.customer.email}?subject=${subject}&body=${mailBody}`;
};
