
import React from 'react';
import { Order } from '../types';
import { ICONS } from '../constants';

interface OrderListProps {
  orders: Order[];
  onSelect: (order: Order) => void;
  onEdit: (order: Order) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRefresh?: () => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onSelect, onEdit, onNew, onDelete, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pedidos de Venda</h1>
          <p className="text-slate-500 font-medium">Controle de faturamento e fluxo comercial via Supabase.</p>
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200 rounded-xl transition shadow-sm"
              title="Sincronizar com Nuvem"
            >
              {ICONS.History}
            </button>
          )}
          <button 
            onClick={onNew}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95 transition"
          >
            {ICONS.Plus} Gerar Pedido
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-24 text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-200">
              {ICONS.Excel}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-700">Nenhum pedido na nuvem</h3>
              <p className="text-slate-400">Clique no botão acima para registrar sua primeira venda comercial.</p>
            </div>
            <button onClick={onNew} className="text-blue-600 font-bold hover:underline">Iniciar agora</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="py-4 px-6">Cliente / Contato</th>
                  <th className="py-4 px-6 text-center">Data / Validade</th>
                  <th className="py-4 px-6 text-center">Peso Total</th>
                  <th className="py-4 px-6 text-center">Total Líquido</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => (
                  <tr key={order.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700 group-hover:text-blue-600 transition">{order.customer.name}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400 font-medium">{order.customer.contactName || 'Sem contato'}</span>
                          <span className="text-[10px] text-slate-300 font-mono">• {order.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-600">{order.date}</span>
                        <span className="text-[10px] text-slate-400">Val: {order.validity || '---'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-sm font-bold text-slate-500">{(order.totalWeight || 0).toFixed(2)} Kg</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-black text-slate-800">
                        R$ {(order.totalAmount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-bold uppercase text-emerald-600">
                          Nuvem
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1">
                      <button 
                        onClick={() => onEdit(order)}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                        title="Corrigir Informações"
                      >
                        {ICONS.Edit}
                      </button>
                      <button 
                        onClick={() => onSelect(order)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Exportar/Compartilhar"
                      >
                        {ICONS.Share}
                      </button>
                      <button 
                        onClick={() => onDelete(order.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Remover do Banco"
                      >
                        {ICONS.Trash}
                      </button>
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
