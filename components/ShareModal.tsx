
import React, { useState } from 'react';
import { Order } from '../types';
import { ICONS } from '../constants';
import { exportToExcel, generatePDF, shareWhatsApp, shareEmail } from '../utils/exportUtils';
import { generateSmartProposal } from '../services/geminiService';

interface ShareModalProps {
  order: Order;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ order, onClose }) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleDownloadPDF = () => {
    const doc = generatePDF(order);
    doc.save(`PEDIDO_${order.id}.pdf`);
  };

  const handleEmailWithAI = async () => {
    setIsGeneratingAI(true);
    const proposal = await generateSmartProposal(order);
    shareEmail(order, proposal);
    setIsGeneratingAI(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8">
        <div className="bg-blue-700 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Exportar Pedido</h3>
            <p className="text-blue-100 text-xs">Selecione o formato para envio ao comercial.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => exportToExcel(order)}
              className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-100 transition group"
            >
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition">
                {ICONS.Excel}
              </div>
              <span className="text-xs font-bold text-slate-700">Modelo XLSX</span>
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex flex-col items-center justify-center p-4 border border-slate-100 rounded-xl hover:bg-red-50 hover:border-red-100 transition group"
            >
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition">
                {ICONS.PDF}
              </div>
              <span className="text-xs font-bold text-slate-700">Documento PDF</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-50">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Ações Rápidas</h4>
            <div className="space-y-2">
              <button 
                onClick={() => shareWhatsApp(order)}
                className="w-full flex items-center gap-4 p-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-100"
              >
                {ICONS.WhatsApp} Enviar para o Cliente
              </button>
              <button 
                onClick={handleEmailWithAI}
                disabled={isGeneratingAI}
                className="w-full flex items-center gap-4 p-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl font-bold hover:bg-blue-100 transition"
              >
                {isGeneratingAI ? (
                   <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                ) : (
                  <div className="flex items-center gap-2">
                    {ICONS.Mail} Email com Proposta IA {ICONS.AI}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 text-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold">Pedido confirmado e pronto para processamento</p>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
