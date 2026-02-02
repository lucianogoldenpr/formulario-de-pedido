import React, { useRef } from 'react';
import { Order } from '../types';
import { ICONS } from '../constants';

interface OrderListProps {
  orders: Order[];
  onNew: () => void;
  onEdit: (order: Order) => void;
  onDelete: (id: string) => void;
  onSync?: () => void;
  onRefresh?: () => void;
  onImport?: (file: File) => void;
  onView?: (order: Order) => void;
  isAdmin: boolean;
}

// Helper function to format date/time without seconds
const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month} ${hour}:${minute}`;
};

const OrderList: React.FC<OrderListProps> = ({ orders, onNew, onEdit, onDelete, onSync, onRefresh, onImport, onView, isAdmin }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImport) {
      onImport(file);
      // Limpa o input para permitir selecionar o mesmo arquivo novamente
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Pedidos de Venda</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Sistema Golden de Formulário de Pedidos</p>
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500 hover:border-amber-500 rounded-xl transition shadow-sm"
              title="Sincronizar com Nuvem"
            >
              {ICONS.History}
            </button>
          )}
          <button
            onClick={onNew}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-600/20 active:scale-95 transition"
          >
            {ICONS.Plus} Gerar Pedido
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        {orders.length === 0 ? (
          <div className="p-24 text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-blue-500">
              {ICONS.Excel}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Nenhum pedido na nuvem</h3>
              <p className="text-slate-400">Clique no botão acima para registrar sua primeira venda comercial.</p>
            </div>
            <button onClick={onNew} className="text-blue-600 hover:text-blue-500 font-bold hover:underline">Iniciar agora</button>

            {/* Sync Button for Lost Data */}
            {onSync && (
              <button
                onClick={onSync}
                className="block mx-auto mt-8 text-sm font-medium text-slate-400 hover:text-amber-500 underline transition-colors cursor-pointer"
                title="Tentar recuperar pedidos salvos apenas no computador"
              >
                Verificar Pedidos Salvos Offline (Backup)
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 px-6">Cliente / Contato</th>
                  <th className="py-4 px-6 text-center">Data / Validade</th>
                  <th className="py-4 px-6 text-center">Total Líquido</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {orders.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 tracking-wider mb-0.5">
                          {order.id}
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{order.customer.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500 dark:text-slate-500 font-medium">{order.customer.contactName || 'Sem contato'}</span>
                        </div>
                        {order.created_by && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-600 flex items-center gap-1 uppercase">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              {order.created_by.split('@')[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{order.date}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Val: {order.validity || '---'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <span className="font-black text-slate-800 dark:text-slate-100">
                        R$ {(order.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                          Nuvem
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1">
                      {/* PDF Download */}
                      {order.pdf_url && (
                        <a
                          href={order.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
                          title="Baixar PDF"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </a>
                      )}

                      {/* View Action (Available for All) */}
                      {onView && (
                        <button
                          onClick={() => onView(order)}
                          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                          title="Visualizar Pedido"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </button>
                      )}

                      {/* Admin Actions */}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => onEdit(order)}
                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition"
                            title="Editar"
                          >
                            {ICONS.Edit}
                          </button>
                          <button
                            onClick={() => onDelete(order.id)}
                            className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                            title="Excluir"
                          >
                            {ICONS.Trash}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;
