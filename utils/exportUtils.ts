
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';

/**
 * Exporta usando o template Excel existente com mapeamento correto de células
 */
export const exportToExcelWithTemplate = async (order: Order) => {
  try {
    // Carrega o template
    const response = await fetch('/template-pedido.xlsx');
    if (!response.ok) {
      throw new Error('Template não encontrado');
    }
    const arrayBuffer = await response.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // ===== DADOS PARA FATURAMENTO =====
    // Nome (linha 3, coluna B)
    worksheet['B3'] = { t: 's', v: order.customer.name };

    // Endereço (linha 4, coluna B)
    worksheet['B4'] = { t: 's', v: order.customer.billingAddress.street };

    // Nº (linha 5, coluna B)
    worksheet['B5'] = { t: 's', v: order.customer.billingAddress.number };

    // Complemento (linha 5, coluna C)
    worksheet['C5'] = { t: 's', v: order.customer.billingAddress.complement };

    // Bairro (linha 5, coluna E)
    worksheet['E5'] = { t: 's', v: order.customer.billingAddress.neighborhood };

    // Cidade (linha 6, coluna B)
    worksheet['B6'] = { t: 's', v: order.customer.billingAddress.city };

    // UF (linha 6, coluna D)
    worksheet['D6'] = { t: 's', v: order.customer.billingAddress.state };



    // CNPJ/CPF (linha 7, coluna B)
    worksheet['B7'] = { t: 's', v: order.customer.document };

    // RG (linha 7, coluna G)
    if (order.customer.rg) {
      worksheet['G7'] = { t: 's', v: order.customer.rg };
    }

    // Insc. Estadual (linha 8, coluna B)
    worksheet['B8'] = { t: 's', v: order.customer.stateRegistration || 'ISENTO' };

    // Insc. Municipal (linha 8, coluna E)
    if (order.customer.municipalRegistration) {
      worksheet['E8'] = { t: 's', v: order.customer.municipalRegistration };
    }

    // Telefone (linha 9, coluna B)
    worksheet['B9'] = { t: 's', v: order.customer.phone };

    // E-mail (linha 10, coluna B)
    worksheet['B10'] = { t: 's', v: order.customer.email };

    // Vendedor (linha 10, coluna I)
    worksheet['I10'] = { t: 's', v: order.salesperson };

    // ===== ENDEREÇO PARA COBRANÇA =====
    // Nº (linha 13, coluna B)
    if (order.customer.collectionAddress) {
      worksheet['B13'] = { t: 's', v: order.customer.collectionAddress.number };
      worksheet['C13'] = { t: 's', v: order.customer.collectionAddress.complement };
      worksheet['E13'] = { t: 's', v: order.customer.collectionAddress.neighborhood };
      worksheet['I13'] = { t: 's', v: order.customer.collectionAddress.city };
      worksheet['B14'] = { t: 's', v: order.customer.collectionAddress.state };
      worksheet['D14'] = { t: 's', v: order.customer.collectionAddress.zipCode };
    }

    // ===== ENDEREÇO PARA ENTREGA =====
    // Nº (linha 17, coluna B)
    if (order.customer.deliveryAddress) {
      worksheet['B17'] = { t: 's', v: order.customer.deliveryAddress.number };
      worksheet['C17'] = { t: 's', v: order.customer.deliveryAddress.complement };
      worksheet['E17'] = { t: 's', v: order.customer.deliveryAddress.neighborhood };
      worksheet['I17'] = { t: 's', v: order.customer.deliveryAddress.city };
      worksheet['B18'] = { t: 's', v: order.customer.deliveryAddress.state };
      worksheet['D18'] = { t: 's', v: order.customer.deliveryAddress.zipCode };
    }

    // ===== CONTATOS =====
    if (order.contacts && order.contacts.length > 0) {
      // Contato 1 (linhas 21-23)
      if (order.contacts[0]) {
        worksheet['B21'] = { t: 's', v: order.contacts[0].name };
        worksheet['B22'] = { t: 's', v: order.contacts[0].jobTitle || '' };
        worksheet['D22'] = { t: 's', v: order.contacts[0].department || '' };
        worksheet['G22'] = { t: 's', v: order.contacts[0].phone };
        worksheet['B23'] = { t: 's', v: order.contacts[0].email };
      }

      // Contato 2 (linhas 25-27)
      if (order.contacts[1]) {
        worksheet['B25'] = { t: 's', v: order.contacts[1].name };
        worksheet['B26'] = { t: 's', v: order.contacts[1].jobTitle || '' };
        worksheet['D26'] = { t: 's', v: order.contacts[1].department || '' };
        worksheet['G26'] = { t: 's', v: order.contacts[1].phone };
        worksheet['B27'] = { t: 's', v: order.contacts[1].email };
      }
    }

    // ===== CLASSIFICAÇÃO (linha 30) =====
    if (order.classification) {
      // Marca X na classificação correta
      const classifications: { [key: string]: string } = {
        'Venda': 'B30',
        'Demonstração': 'C30',
        'Exposição': 'D30',
        'Consignação': 'E30',
        'Doação': 'F30',
        'Outros': 'G30'
      };

      const cell = classifications[order.classification];
      if (cell) {
        worksheet[cell] = { t: 's', v: 'X' };
      }

      if (order.classificationOther) {
        worksheet['H30'] = { t: 's', v: order.classificationOther };
      }
    }

    // Pedido nº (linha 31, coluna G)
    worksheet['G31'] = { t: 's', v: order.id };

    // Data (linha 32, coluna G)
    worksheet['G32'] = { t: 's', v: order.date };

    // ===== ITENS DO PEDIDO (começando na linha 35) =====
    let currentRow = 35;
    order.items.forEach((item, index) => {
      // ITEM (coluna A)
      worksheet[`A${currentRow}`] = { t: 'n', v: index + 1 };

      // QTD (coluna B)
      worksheet[`B${currentRow}`] = { t: 'n', v: item.quantity };

      // DESCRIÇÃO (coluna C)
      worksheet[`C${currentRow}`] = { t: 's', v: item.description };

      // VALOR UNIT. R$ (coluna G)
      worksheet[`G${currentRow}`] = { t: 'n', v: item.unitPrice };

      // VALOR TOTAL R$ (coluna I)
      worksheet[`I${currentRow}`] = { t: 'n', v: item.total };

      currentRow++;
    });

    // ===== RESUMO FINANCEIRO =====
    // Valor Global 1 (linha 38, coluna I)
    worksheet['I38'] = { t: 'n', v: order.globalValue1 || 0 };

    // Descontos (linha 40, coluna I)
    worksheet['I40'] = { t: 'n', v: order.discountTotal || 0 };

    // Frete (linha 41, coluna I)
    worksheet['I41'] = { t: 'n', v: order.freightValue || 0 };

    // Valor Global 2 (linha 42, coluna I)
    worksheet['I42'] = { t: 'n', v: order.globalValue2 || 0 };

    // ===== CONVERSÃO EURO/US$ =====
    if (order.currencyConversion && order.currencyConversion !== 'Real') {
      // Câmbio (linha 44, coluna G)
      worksheet['G44'] = { t: 'n', v: order.exchangeRate || 1 };

      // Total R$ (linha 44, coluna I)
      worksheet['I44'] = { t: 'n', v: order.totalInBRL || 0 };
    }

    // ===== FATURAMENTO MÍNIMO =====
    if (order.minBilling) {
      // Sim (linha 47, coluna D)
      worksheet['D47'] = { t: 's', v: 'X' };

      // Valor (linha 47, coluna G)
      worksheet['G47'] = { t: 'n', v: order.minBillingValue || 0 };
    } else {
      // Não (linha 47, coluna E)
      worksheet['E47'] = { t: 's', v: 'X' };
    }

    // ===== CLIENTE FINAL =====
    // Cliente Final (linha 48, coluna B)
    if (order.finalCustomer) {
      worksheet['B48'] = { t: 's', v: 'Sim' };
    }

    // ===== CONDIÇÕES COMERCIAIS =====
    // Forma de Pagamento (linha 49, coluna B)
    worksheet['B49'] = { t: 's', v: order.paymentTerms };

    // Prazo de Entrega (linha 50, coluna B)
    worksheet['B50'] = { t: 's', v: order.deliveryTime };

    // Validade (linha 51, coluna B)
    worksheet['B51'] = { t: 's', v: order.validity };

    // ===== LICITAÇÃO/EMPENHO =====
    // Licitação nº (linha 52, coluna B)
    if (order.biddingNumber) {
      worksheet['B52'] = { t: 's', v: order.biddingNumber };

      // Data da Realização (linha 52, coluna G)
      if (order.biddingDate) {
        worksheet['G52'] = { t: 's', v: order.biddingDate };
      }
    }

    // Empenho nº (linha 53, coluna B)
    if (order.commitmentNumber) {
      worksheet['B53'] = { t: 's', v: order.commitmentNumber };

      // Data da Emissão do Empenho (linha 53, coluna G)
      if (order.commitmentDate) {
        worksheet['G53'] = { t: 's', v: order.commitmentDate };
      }
    }

    // ===== ASSINATURA DO CLIENTE =====
    // Assinatura do Cliente (linha 55, coluna B)
    worksheet['B55'] = { t: 's', v: order.customer.name };

    // ===== ENVIAR PARA =====
    // Enviar para (linha 57, coluna B)
    if (order.notes) {
      worksheet['B57'] = { t: 's', v: order.notes };
    }

    // Salva o arquivo
    XLSX.writeFile(workbook, `Pedido_${order.id}.xlsx`);
  } catch (error) {
    console.error('Erro ao exportar com template:', error);
    // Fallback para exportação simples
    exportToExcel(order);
  }
};

/**
 * Exportação Excel simples (fallback)
 */
export const exportToExcel = (order: Order) => {
  const wsData = [
    ["GOLDEN EQUIPAMENTOS MÉDICOS - FORMULÁRIO DE PEDIDO"],
    ["ID DO PEDIDO:", order.id, "", "DATA:", order.date],
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
    ["ITEM", "DESCRIÇÃO", "UN", "QTD", "UNITÁRIO", "TOTAL"],
    ...order.items.map((item, idx) => [
      idx + 1,
      item.description,
      item.unit || 'UN',
      item.quantity,
      item.unitPrice,
      item.total
    ]),
    [""],
    ["RESUMO FINANCEIRO"],
    ["Subtotal:", "", "", "", "", order.globalValue1 || 0],
    ["Desconto:", "", "", "", "", order.discountTotal || 0],
    ["Frete:", "", "", "", "", order.freightValue || 0],
    ["TOTAL LÍQUIDO:", "", "", "", "", order.globalValue2 || 0],
    ["Moeda Original:", order.currencyConversion || 'Real'],
    ["Taxa de Câmbio:", order.exchangeRate || 1],
    ["VALOR TOTAL EM REAIS (R$):", "", "", "", "", order.totalInBRL || 0],
    [""],
    ["CONDIÇÕES COMERCIAIS"],
    ["Forma de Pagamento:", order.paymentTerms],
    ["Prazo de Entrega:", order.deliveryTime],
    ["Validade da Proposta:", order.validity],
    ["Observações:", order.notes]
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 6 }, { wch: 50 }, { wch: 6 }, { wch: 8 }, { wch: 15 }, { wch: 15 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pedido " + order.id);
  XLSX.writeFile(wb, `PEDIDO_GOLDEN_${order.id}.xlsx`, { bookType: 'xlsx' });
};

/**
 * Gera PDF COMPLETO com TODOS os campos do formulário
 */
const getBase64ImageFromURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } else resolve('');
    };
    img.onerror = () => reject(new Error('Img load failed'));
    img.src = url;
  });
};

/**
 * Gera PDF COMPLETO com TODOS os campos do formulário
 */
export const generatePDF = async (order: Order) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const curSymbol = order.currencyConversion === 'Real' ? 'R$' : order.currencyConversion;
    let currentY = 0;

    // Carrega logo antecipadamente
    let logoBase64: string | null = null;
    try {
      const logoUrl = `${window.location.origin}/logo_marca.png`;
      logoBase64 = await getBase64ImageFromURL(logoUrl);
    } catch (e) {
      console.warn('Logo load failed', e);
    }

    // Função de Cabeçalho Reutilizável
    const drawHeader = () => {
      // Fundo branco (sem retângulo azul)

      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 20, 10, 50, 20);
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(184, 134, 11); // Dourado
        doc.text("GOLDEN EQUIPAMENTOS", 20, 25);
      }

      doc.setTextColor(50, 50, 50); // Preto
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("FORMULÁRIO DE PEDIDO", pageWidth - 20, 22, { align: 'right' });

      // Line separator (dourada)
      doc.setDrawColor(184, 134, 11);
      doc.setLineWidth(0.5);
      doc.line(20, 35, pageWidth - 20, 35);
    };

    // Função auxiliar para adicionar nova página se necessário
    const checkPageBreak = (neededSpace: number) => {
      if (currentY + neededSpace > pageHeight - 20) {
        doc.addPage();
        drawHeader(); // Desenha cabeçalho na nova página
        currentY = 50; // Reinicia Y abaixo do cabeçalho
        return true;
      }
      return false;
    };

    // Desenha cabeçalho inicial
    drawHeader();
    currentY = 50;
    // Cabeçalho desenhado acima

    // ===== INFORMAÇÕES DO PEDIDO =====
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`PEDIDO N°: ${order.id}`, 20, currentY);
    doc.text(`DATA: ${order.date.split('-').reverse().join('/')}`, pageWidth - 20, currentY, { align: 'right' });
    currentY += 6;
    doc.text(`VENDEDOR: ${order.salesperson}`, 20, currentY);

    // Classificação (se houver)
    if (order.classification) {
      currentY += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Finalidade: ${order.classification}${order.classificationOther ? ' - ' + order.classificationOther : ''}`, 20, currentY);
    }

    currentY += 8;

    // ===== DADOS DO CLIENTE =====
    doc.setDrawColor(200, 200, 200);
    doc.line(20, currentY, pageWidth - 20, currentY);
    currentY += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CLIENTE", 20, currentY);
    currentY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Razão Social: ${order.customer.name}`, 20, currentY);
    doc.text(`Telefone: ${order.customer.phone}`, 110, currentY);
    currentY += 5;

    doc.text(`CNPJ/CPF: ${order.customer.document}`, 20, currentY);
    doc.text(`E-mail: ${order.customer.email}`, 110, currentY);
    currentY += 5;

    doc.text(`Insc. Estadual: ${order.customer.stateRegistration || 'Isento'}`, 20, currentY);
    if (order.customer.municipalRegistration) {
      doc.text(`Insc. Municipal: ${order.customer.municipalRegistration}`, 110, currentY);
    }
    currentY += 5;

    if (order.customer.rg) {
      doc.text(`RG: ${order.customer.rg}`, 20, currentY);
      currentY += 5;
    }



    currentY += 3;

    // ===== ENDEREÇOS =====
    doc.setFont("helvetica", "bold");
    doc.text("ENDEREÇO DE FATURAMENTO", 20, currentY);
    currentY += 5;
    doc.setFont("helvetica", "normal");
    doc.text(`${order.customer.billingAddress.street}, ${order.customer.billingAddress.number} - ${order.customer.billingAddress.complement}`, 20, currentY);
    currentY += 5;
    doc.text(`${order.customer.billingAddress.neighborhood} - ${order.customer.billingAddress.city}/${order.customer.billingAddress.state}`, 20, currentY);
    currentY += 5;
    doc.text(`CEP: ${order.customer.billingAddress.zipCode}`, 20, currentY);
    currentY += 8;

    // Endereço de Coleta (se diferente)
    if (order.customer.collectionAddress &&
      order.customer.collectionAddress.street !== order.customer.billingAddress.street) {
      doc.setFont("helvetica", "bold");
      doc.text("ENDEREÇO DE COLETA", 20, currentY);
      currentY += 5;
      doc.setFont("helvetica", "normal");
      doc.text(`${order.customer.collectionAddress.street}, ${order.customer.collectionAddress.number} - ${order.customer.collectionAddress.complement}`, 20, currentY);
      currentY += 5;
      doc.text(`${order.customer.collectionAddress.neighborhood} - ${order.customer.collectionAddress.city}/${order.customer.collectionAddress.state}`, 20, currentY);
      currentY += 5;
      doc.text(`CEP: ${order.customer.collectionAddress.zipCode}`, 20, currentY);
      currentY += 8;
    }

    // Endereço de Entrega (se diferente)
    if (order.customer.deliveryAddress &&
      order.customer.deliveryAddress.street !== order.customer.billingAddress.street) {
      doc.setFont("helvetica", "bold");
      doc.text("ENDEREÇO DE ENTREGA", 20, currentY);
      currentY += 5;
      doc.setFont("helvetica", "normal");
      doc.text(`${order.customer.deliveryAddress.street}, ${order.customer.deliveryAddress.number} - ${order.customer.deliveryAddress.complement}`, 20, currentY);
      currentY += 5;
      doc.text(`${order.customer.deliveryAddress.neighborhood} - ${order.customer.deliveryAddress.city}/${order.customer.deliveryAddress.state}`, 20, currentY);
      currentY += 5;
      doc.text(`CEP: ${order.customer.deliveryAddress.zipCode}`, 20, currentY);
      currentY += 8;
    }

    // ===== CONTATOS =====
    if (order.contacts && order.contacts.length > 0) {
      checkPageBreak(30);
      doc.setFont("helvetica", "bold");
      doc.text("CONTATOS", 20, currentY);
      currentY += 5;
      doc.setFont("helvetica", "normal");

      order.contacts.forEach((contact, idx) => {
        if (idx > 0) currentY += 3;
        doc.text(`${contact.name} - ${contact.jobTitle || 'N/A'}`, 20, currentY);
        currentY += 4;
        doc.text(`Tel: ${contact.phone} | Email: ${contact.email}`, 20, currentY);
        currentY += 4;
      });
      currentY += 5;
    }

    // ===== TABELA DE ITENS =====
    // ===== TABELA DE ITENS =====
    checkPageBreak(50);
    const tableData = order.items.map((item, i) => [
      i + 1,
      item.description,
      item.unit || 'UN',
      item.quantity,
      `${curSymbol} ${item.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${curSymbol} ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['IT', 'PRODUTO', 'UN', 'QTD', 'UNITÁRIO', 'TOTAL']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 90 }, // Descrição expandida
        2: { cellWidth: 10 },
        3: { cellWidth: 10 },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' }
      },
      margin: { top: 50 },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          drawHeader();
        }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    // ===== RESUMO FINANCEIRO =====
    checkPageBreak(50);
    doc.setFillColor(248, 250, 252);
    doc.rect(20, currentY, pageWidth - 40, 45, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    let finY = currentY + 7;
    doc.text(`Subtotal:`, 25, finY);
    doc.text(`${curSymbol} ${(order.globalValue1 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 25, finY, { align: 'right' });

    finY += 6;
    doc.text(`Descontos:`, 25, finY);
    doc.text(`${curSymbol} ${(order.discountTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 25, finY, { align: 'right' });

    finY += 6;
    doc.text(`Frete:`, 25, finY);
    doc.text(`${curSymbol} ${(order.freightValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 25, finY, { align: 'right' });

    finY += 8;
    doc.setFontSize(11);
    doc.setTextColor(184, 134, 11);
    doc.text(`TOTAL LÍQUIDO:`, 25, finY);
    doc.text(`${curSymbol} ${(order.globalValue2 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, pageWidth - 25, finY, { align: 'right' });

    finY += 6;
    doc.setFontSize(8);
    doc.setTextColor(100);
    // Peso Total removido conforme solicitado

    if (order.currencyConversion !== 'Real' && order.exchangeRate) {
      finY += 5;
      doc.text(`Taxa de Câmbio: ${order.exchangeRate}`, 25, finY);
      finY += 5;
      doc.text(`Equiv. em R$: R$ ${(order.totalInBRL || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 25, finY);
    }

    currentY = currentY + 50;

    // ===== CONDIÇÕES COMERCIAIS =====
    checkPageBreak(40);
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("CONDIÇÕES COMERCIAIS", 20, currentY);
    currentY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    if (order.downPayment && order.downPayment > 0) {
      doc.text(`Valor de Entrada: R$ ${(order.downPayment || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, currentY);
      currentY += 5;
    }
    doc.text(`Condições de Pagamento: ${order.paymentTerms}`, 20, currentY);
    currentY += 5;
    doc.text(`Prazo de Entrega: ${order.deliveryTime}`, 20, currentY);
    currentY += 5;
    doc.text(`Validade da Proposta: ${order.validity}`, 20, currentY);
    currentY += 5;

    if (order.validUntil) {
      doc.text(`Válido até: ${order.validUntil.split('-').reverse().join('/')}`, 20, currentY);
      currentY += 5;
    }

    if (order.carrier) {
      doc.text(`Transportadora: ${order.carrier}`, 20, currentY);
      currentY += 5;
    }

    if (order.shippingType) {
      doc.text(`Tipo de Frete: ${order.shippingType}`, 20, currentY);
      currentY += 5;
    }

    if (order.minBilling) {
      doc.text(`Faturamento Mínimo: ${order.currencyConversion || 'R$'} ${(order.minBillingValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 20, currentY);
      currentY += 5;
    }

    if (order.finalCustomer) {
      doc.text(`Cliente Final: Sim`, 20, currentY);
      currentY += 5;
    }

    // ===== LICITAÇÃO/EMPENHO =====
    if (order.biddingNumber || order.commitmentNumber) {
      currentY += 5;
      doc.setFont("helvetica", "bold");
      doc.text("DADOS DE LICITAÇÃO", 20, currentY);
      currentY += 6;
      doc.setFont("helvetica", "normal");

      if (order.biddingNumber) {
        doc.text(`Nº Licitação: ${order.biddingNumber}`, 20, currentY);
        if (order.biddingDate) {
          doc.text(`Data: ${order.biddingDate.split('-').reverse().join('/')}`, 110, currentY);
        }
        currentY += 5;
      }

      if (order.commitmentNumber) {
        doc.text(`Nº Empenho: ${order.commitmentNumber}`, 20, currentY);
        if (order.commitmentDate) {
          doc.text(`Data: ${order.commitmentDate.split('-').reverse().join('/')}`, 110, currentY);
        }
        currentY += 5;
      }
    }

    // ===== OBSERVAÇÕES =====
    if (order.notes) {
      currentY += 8;
      checkPageBreak(30);
      doc.setFont("helvetica", "bold");
      doc.text("OBSERVAÇÕES", 20, currentY);
      currentY += 6;
      doc.setFont("helvetica", "normal");

      const notesLines = doc.splitTextToSize(order.notes, pageWidth - 40);
      notesLines.forEach((line: string) => {
        checkPageBreak(5);
        doc.text(line, 20, currentY);
        currentY += 5;
      });
    }

    // ===== RODAPÉ =====
    const footerY = pageHeight - 15;
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`Documento gerado em ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, footerY, { align: 'center' });

    return doc;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw new Error(`Falha ao gerar PDF: ${error}`);
  }
};

export const shareWhatsApp = (order: Order) => {
  const currencySymbol = order.currencyConversion === 'Real' ? 'R$' : (order.currencyConversion || 'R$');
  const message = encodeURIComponent(
    `*FORMULÁRIO DE PEDIDO - GOLDEN EQUIPAMENTOS MÉDICOS*\\n\\n` +
    `Olá ${order.customer.name},\\n` +
    `Segue o registro do seu pedido Nº *${order.id}*.\\n\\n` +
    `*Resumo do Formulário:*\\n` +
    `Itens: ${order.items.length}\\n` +
    `Total Líquido: *${currencySymbol} ${(order.globalValue2 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*\\n\\n` +
    `*Logística:*\\n` +
    `Entrega Estimada: ${order.deliveryTime}\\n\\n` +
    `Vendedor: ${order.salesperson}`
  );
  // Sanitizar telefone: remover tudo que não é número
  const cleanPhone = order.customer.phone.replace(/\D/g, '');
  // Adicionar 55 se não tiver (assumindo Brasil)
  const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

  const url = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${message}`;
  window.open(url, '_blank');
};

export const shareEmail = (order: Order, body: string) => {
  const subject = encodeURIComponent(`Formulário de Pedido Golden - N° ${order.id} - ${order.customer.name}`);
  const mailBody = encodeURIComponent(body);
  window.location.href = `mailto:${order.customer.email}?subject=${subject}&body=${mailBody}`;
};
