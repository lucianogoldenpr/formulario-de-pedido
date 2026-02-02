
import React, { useState } from 'react';
import { Order } from '../types';
import { ICONS } from '../constants';
import { applyDocumentMask } from '../utils/validationUtils';
import { supabaseService } from '../services/supabaseService';
import jsPDF from 'jspdf';

interface ProposalAcceptanceProps {
    order: Order;
    onClose: () => void;
    onAccept: (signature: string, acceptanceDate: string) => void;
}

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
            } else {
                reject(new Error('Canvas context is null'));
            }
        };
        img.onerror = (error) => {
            reject(error);
        };
        img.src = url;
    });
};

const ProposalAcceptance: React.FC<ProposalAcceptanceProps> = ({ order, onClose, onAccept }) => {
    const [clientName, setClientName] = useState(order.customer.name);
    const [document, setDocument] = useState(order.customer.document);
    const [email, setEmail] = useState(order.customer.email);
    const [signature, setSignature] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const generateAcceptanceReceipt = async (signature: string, acceptanceDate: string, integrityHash: string) => {
        const doc = new jsPDF();

        // --- CABEÇALHO (FUNDO BRANCO) ---

        // --- LOGO \u0026 HEADER ---
        let logoBase64: string | null = null;
        try {
            const logoUrl = `${window.location.origin}/logo_marca.png`;
            logoBase64 = await getBase64ImageFromURL(logoUrl);
            doc.addImage(logoBase64, 'PNG', 20, 10, 50, 20);
        } catch (e) {
            console.error('Erro ao carregar logo:', e);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(184, 134, 11); // Dourado
            doc.text("GOLDEN EQUIPAMENTOS", 20, 25);
        }

        // Título do documento
        doc.setTextColor(50, 50, 50); // Preto
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.text("COMPROVANTE DE ACEITE", 200, 22, { align: 'right' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100); // Cinza
        doc.text('Documento assinado digitalmente', 200, 27, { align: 'right' });

        // Line separator (dourada)
        doc.setDrawColor(184, 134, 11);
        doc.setLineWidth(0.5);
        doc.line(20, 35, 200, 35);

        let y = 45;

        // --- DADOS DA PROPOSTA (BOX) ---
        doc.setFillColor(248, 250, 252); // Mesmo tom do formulário
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(20, y, 170, 60, 2, 2, 'FD');

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text('Cliente:', 25, y + 8);
        doc.text('Identificador:', 25, y + 16);
        doc.text(`Data de Referência:`, 25, y + 24);
        doc.text(`Finalidade:`, 25, y + 32);

        // Coluna da Direita (Movida para direita para dar espaço ao nome do cliente)
        const rightColLabel = 115;
        const rightColValue = 150;

        doc.text('Valor Total:', rightColLabel, y + 8);
        doc.text(`R$ ${(order.globalValue2 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, rightColValue, y + 8);

        let rowOffset = 16;
        if (order.downPayment && order.downPayment > 0) {
            doc.text('Valor de Entrada:', rightColLabel, y + rowOffset);
            doc.text(`R$ ${(order.downPayment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, rightColValue, y + rowOffset);
            rowOffset += 8;

            // Adicionar Saldo a Pagar
            const saldoAPagar = (order.globalValue2 || 0) - order.downPayment;
            doc.text('Saldo a Pagar:', rightColLabel, y + rowOffset);
            doc.text(`R$ ${saldoAPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, rightColValue, y + rowOffset);
            rowOffset += 8;
        }

        doc.text('Condições Pagto:', rightColLabel, y + rowOffset);
        // Usar splitTextToSize para quebrar linha automaticamente
        doc.setFont('helvetica', 'normal');
        const paymentTermsLines = doc.splitTextToSize(order.paymentTerms || '-', 35); // Largura máxima 35mm (caixa vai até 190mm)
        doc.text(paymentTermsLines, rightColValue, y + rowOffset);
        doc.setFont('helvetica', 'bold');

        // Ajustar rowOffset baseado no número de linhas
        rowOffset += (paymentTermsLines.length * 4) + 4;

        doc.text('Prazo Entrega:', rightColLabel, y + rowOffset);
        doc.setFont('helvetica', 'normal');
        const deliveryLines = doc.splitTextToSize(order.deliveryTime || '-', 35);
        doc.text(deliveryLines, rightColValue, y + rowOffset);
        doc.setFont('helvetica', 'bold');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);

        // Cliente (pode ser longo)
        doc.setFontSize(8);
        // Aumentando largura permitida para 55mm (antes era ~40mm)
        const splitClient = doc.splitTextToSize(order.customer.name, 55);
        doc.text(splitClient, 55, y + 8);
        doc.setFontSize(9);

        doc.text(order.id, 55, y + 16);

        // Data Formatada
        const formattedDate = order.date ? order.date.split('-').reverse().join('/') : '-';
        doc.text(formattedDate, 55, y + 24);

        let purpose = order.classification || 'Venda';
        if (purpose === 'Outros' && order.classificationOther) purpose += ` - ${order.classificationOther}`;
        doc.text(purpose, 55, y + 32);

        y += 70; // Espaço ajustado após box maior (60mm)

        // --- DECLARAÇÃO ---
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Declaração de Aceite', 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);

        const declarationText = `Eu, ${clientName}, inscrito(a) no CPF/CNPJ sob o nº ${document}, na qualidade de representante devidamente autorizado(a), declaro para os devidos fins que recebi, analisei e APROVEI integralmente a Proposta Comercial nº ${order.id} apresentada pela Golden Equipamentos Médicos.`;

        doc.text(declarationText, 20, y, { maxWidth: 170, align: 'justify' });

        const lines = doc.splitTextToSize(declarationText, 170);
        y += (lines.length * 5) + 8; // Espaçamento dinâmico reduzido

        doc.text('Ratifico minha concordância com:', 20, y);
        y += 6;
        doc.setFontSize(9);
        const itemsList = [
            'As especificações técnicas e quantidades dos produtos/serviços;',
            'Os valores, prazos e condições comerciais estabelecidos;',
            'A validade jurídica desta assinatura digital como meio de comprovação de aceite.',
        ];

        itemsList.forEach(item => {
            doc.text(`• ${item}`, 25, y);
            y += 5;
        });

        y += 10;

        // --- ASSINATURA ---
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.1);
        doc.rect(20, y, 170, 50); // Box aumentado para 50 (comporta o Doc)

        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Área de Assinatura Eletrônica', 185, y + 5, { align: 'right' });

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Assinado por:', 30, y + 15);

        // Nome estilo assinatura
        doc.setFont('times', 'italic');
        doc.setFontSize(24);
        doc.text(signature, 30, y + 30);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Doc: ${document}`, 30, y + 42);

        y += 60;

        // --- RODAPÉ TÉCNICO ---
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Registro de Aceite Digital: ${acceptanceDate}`, 20, y);
        doc.text(`Hash de Integridade: ${integrityHash}`, 20, y + 5);

        // Rodapé final da página
        doc.setFontSize(8);
        doc.text('Golden Equipamentos Médicos | Comprovante Gerado Automaticamente pelo Sistema', 105, 285, { align: 'center' });

        // Save com timestamp para evitar cache
        const safeName = clientName.split(' ')[0].replace(/[^a-z0-9]/gi, '_');
        const timestamp = Date.now();
        const fileName = `Aceite_Pedido_${order.id}_${safeName}_${timestamp}.pdf`;

        // Salva localmente
        doc.save(fileName);

        // Upload para Supabase Storage
        try {
            const pdfBlob = doc.output('blob');
            const { storageService } = await import('../services/storageService');

            const pdfUrl = await storageService.uploadPDF(pdfBlob, fileName);

            if (pdfUrl) {
                // Salva log do PDF de aceite
                await storageService.saveAcceptancePDF(order.id, pdfUrl, signature, email);
                console.log('✅ PDF de Aceite salvo no Supabase:', pdfUrl);
            } else {
                console.warn('⚠️ Falha ao salvar PDF de Aceite no Supabase');
            }
        } catch (uploadError) {
            console.error('Erro no upload do PDF de Aceite:', uploadError);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!agreed) {
            alert('Você precisa concordar com os termos da proposta.');
            return;
        }

        if (!signature) {
            alert('Por favor, digite seu nome completo como assinatura.');
            return;
        }

        const cleanDocument = document.replace(/\D/g, '');
        if (cleanDocument.length < 11) {
            alert('CNPJ/CPF parece incompleto.');
            return;
        }

        setIsSubmitting(true);

        const now = new Date();
        const acceptanceDate = now.toLocaleString('pt-BR');

        try {
            // Gera um hash base único
            const baseHash = `SHA.${now.getTime().toString(36).toUpperCase()}.${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            // Salvar Log no Banco
            const logRes = await supabaseService.saveAcceptanceLog({
                order_id: order.id,
                customer_name: clientName,
                customer_document: document,
                signer_name: signature,
                signer_email: email,
                signature_hash: baseHash,
                user_agent: navigator.userAgent
            });

            let finalHash = baseHash;
            // Se salvou, anexa o ID do Log ao hash para rastreabilidade
            if (logRes && (logRes as any).success && (logRes as any).data) {
                finalHash += `.LOG${(logRes as any).data.id}`;
            }

            await generateAcceptanceReceipt(signature, acceptanceDate, finalHash);

            onAccept(signature, acceptanceDate);
            alert('Aceite confirmado com SUCESSO!\n\nO Comprovante PDF foi baixado.\nPor favor, encaminhe este arquivo ao seu departamento de compras.');
            onClose();
        } catch (error) {
            console.error('Erro ao gerar comprovante:', error);
            alert('Erro ao gerar PDF de comprovante. O aceite será processado, mas o PDF falhou.');
            onAccept(signature, acceptanceDate);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in scale-95 duration-200">
                {/* Cabeçalho */}
                <div className="bg-gradient-to-br from-[#D4AF37] via-[#F9E27E] to-[#B8860B] p-6 text-white relative">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black">Confirmação de Proposta</h2>
                            <p className="text-sm opacity-90 mt-1">Golden Equipamentos Médicos</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-full transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="p-6 space-y-6">
                    {/* Informações da Proposta */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            {ICONS.Excel}
                            Detalhes da Proposta
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="col-span-2">
                                <span className="text-slate-500">Cliente:</span>
                                <p className="font-bold text-slate-800">{order.customer.name}</p>
                            </div>
                            <div>
                                <span className="text-slate-500">Pedido Nº:</span>
                                <p className="font-bold text-slate-800">{order.id}</p>
                            </div>
                            <div>
                                <span className="text-slate-500">Data:</span>
                                <p className="font-bold text-slate-800">{order.date}</p>
                            </div>
                            <div>
                                <span className="text-slate-500">Vendedor:</span>
                                <p className="font-bold text-slate-800">{order.salesperson}</p>
                            </div>
                            <div>
                                <span className="text-slate-500">Finalidade:</span>
                                <p className="font-bold text-slate-800">
                                    {order.classification || 'Venda'}
                                    {order.classification === 'Outros' && order.classificationOther && ` - ${order.classificationOther}`}
                                </p>
                            </div>
                            <div>
                                <span className="text-slate-500">Valor Total:</span>
                                <p className="font-bold text-emerald-600 text-lg">
                                    R$ {(order.globalValue2 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            {order.downPayment && order.downPayment > 0 && (
                                <div>
                                    <span className="text-slate-500">Entrada:</span>
                                    <p className="font-bold text-slate-800">
                                        R$ {order.downPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            )}
                            <div>
                                <span className="text-slate-500">Condições de Pgto:</span>
                                <p className="font-bold text-slate-800">{order.paymentTerms || '-'}</p>
                            </div>
                            <div>
                                <span className="text-slate-500">Prazo Entrega:</span>
                                <p className="font-bold text-slate-800">{order.deliveryTime || '-'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Itens da Proposta */}
                    <div>
                        <h3 className="font-bold text-slate-800 mb-3">Itens Incluídos ({order.items.length})</h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {order.items.map((item, idx) => (
                                <div key={item.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg text-sm">
                                    <div className="flex-1">
                                        <span className="font-semibold text-slate-700">{idx + 1}. {item.description}</span>
                                        <p className="text-xs text-slate-500">Qtd: {item.quantity} {item.unit}</p>
                                    </div>
                                    <span className="font-bold text-slate-800">
                                        R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Condições Comerciais */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <h3 className="font-bold text-blue-900 mb-3">Condições Comerciais</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-blue-700">Forma de Pagamento:</span>
                                <span className="font-semibold text-blue-900">{order.paymentTerms || 'Não especificado'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-700">Prazo de Entrega:</span>
                                <span className="font-semibold text-blue-900">{order.deliveryTime || 'Não especificado'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-blue-700">Validade da Proposta:</span>
                                <span className="font-semibold text-blue-900">{order.validity || 'Não especificado'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Formulário de Aceite */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="border-t border-slate-200 pt-4">
                            <h3 className="font-bold text-slate-800 mb-4">Dados para Confirmação e Comprovante</h3>
                            <div className="p-3 bg-amber-50 rounded-lg text-amber-800 text-xs mb-4">
                                ℹ️ Ao concluir, um <strong>Comprovante de Aceite (PDF)</strong> será baixado automaticamente para você enviar ao Depto. de Compras.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Nome Completo
                                    </label>
                                    <input
                                        type="text"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                        placeholder="Nome do Responsável"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        CNPJ/CPF
                                    </label>
                                    <input
                                        type="text"
                                        value={document}
                                        onChange={(e) => setDocument(applyDocumentMask(e.target.value))}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        E-mail para Confirmação
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                        placeholder="seu-email@empresa.com"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Assinatura Digital (Digite seu nome completo)
                                    </label>
                                    <input
                                        type="text"
                                        value={signature}
                                        onChange={(e) => setSignature(e.target.value)}
                                        placeholder="Digite seu nome completo como assinatura"
                                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-serif text-lg"
                                        required
                                    />
                                    <p className="text-xs text-slate-500 mt-1">
                                        Esta assinatura digital tem validade legal conforme Lei nº 14.063/2020
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Termos de Aceite */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="mt-1 w-5 h-5 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                                    required
                                />
                                <div className="flex-1">
                                    <p className="text-sm text-slate-700">
                                        <strong>Declaro que:</strong>
                                    </p>
                                    <ul className="text-xs text-slate-600 mt-2 space-y-1 list-disc list-inside">
                                        <li>Li e concordo com todos os termos desta proposta comercial</li>
                                        <li>Confirmo que as informações fornecidas são verdadeiras</li>
                                        <li>Aceito as condições comerciais, prazos e valores apresentados</li>
                                        <li>Autorizo o processamento dos meus dados conforme LGPD</li>
                                        <li>Esta assinatura digital tem validade legal para este documento</li>
                                    </ul>
                                </div>
                            </label>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !agreed}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg flex justify-center items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                        Gerando Comprovante...
                                    </>
                                ) : (
                                    <>
                                        <span>Confirmar e Baixar Comprovante</span>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Informações Legais */}
                    <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-200">
                        <p>Documento gerado em {new Date().toLocaleString('pt-BR')}</p>
                        <p className="mt-1">Golden Equipamentos Médicos - CNPJ: 00.000.000/0000-00</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProposalAcceptance;
