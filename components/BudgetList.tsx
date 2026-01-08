
import React from 'react';
import { Order } from '../types';
import { ICONS } from '../constants';

interface OrderListProps {
  orders: Order[];
  onSelect: (order: Order) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, onSelect, onNew, onDelete }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Pedidos de Venda</h1>
          <p className="text-slate-500">Fluxo comercial e controle de faturamento.</p>
        </div>
        <button 
          onClick={onNew}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition"
        >
          {ICONS.Plus} Gerar Novo Pedido
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {orders.length === 0 ? (
          <div className="p-24 text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-200">
              {ICONS.Excel}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-700">Nenhum pedido processado</h3>
              <p className="text-slate-400">Registre suas vendas para gerar os arquivos XLSX do comercial.</p>
            </div>
            <button onClick={onNew} className="text-blue-600 font-bold hover:underline">Iniciar primeiro pedido</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                  <th className="py-4 px-6">Cliente / Pedido</th>
                  <th className="py-4 px-6 text-center">Data</th>
                  <th className="py-4 px-6 text-center">Valor do Pedido</th>
                  <th className="py-4 px-6 text-center">Frete</th>
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
                        <span className="text-xs text-slate-400 font-mono">{order.id}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center text-slate-500 text-sm">
                      {order.date}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="font-bold text-slate-800">
                        R$ {order.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded text-slate-500">{order.shippingType}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        order.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        Confirmado
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-x-1">
                      <button 
                        onClick={() => onSelect(order)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Exportar Pedido"
                      >
                        {ICONS.Share}
                      </button>
                      <button 
                        onClick={() => onDelete(order.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
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
