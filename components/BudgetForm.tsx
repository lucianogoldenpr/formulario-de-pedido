
import React, { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Order, OrderItem, CustomerInfo } from '../types';
import { ICONS, INITIAL_CUSTOMER, EMPTY_ITEM } from '../constants';
import { optimizeItemDescription } from '../services/geminiService';

interface OrderFormProps {
  onSave: (order: Order) => void;
  onCancel: () => void;
  initialOrder?: Order | null;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSave, onCancel, initialOrder }) => {
  const [salesperson, setSalesperson] = useState(initialOrder?.salesperson || 'Vendedor Comercial');
  const [customer, setCustomer] = useState<CustomerInfo>(initialOrder?.customer || { ...INITIAL_CUSTOMER });
  const [items, setItems] = useState<OrderItem[]>(initialOrder?.items || [EMPTY_ITEM(Date.now().toString())]);
  const [paymentTerms, setPaymentTerms] = useState(initialOrder?.paymentTerms || 'Boleto 30 dias');
  const [paymentMethod, setPaymentMethod] = useState(initialOrder?.paymentMethod || 'Faturamento');
  const [shippingType, setShippingType] = useState<'CIF' | 'FOB'>(initialOrder?.shippingType || 'CIF');
  const [carrier, setCarrier] = useState(initialOrder?.carrier || 'Transportadora Própria');
  const [deliveryTime, setDeliveryTime] = useState(initialOrder?.deliveryTime || '5 a 7 dias úteis');
  // Added validity state
  const [validity, setValidity] = useState(initialOrder?.validity || '15 dias');
  // Added discountGlobal state
  const [discountGlobal, setDiscountGlobal] = useState(initialOrder?.discountGlobal || 0);
  const [notes, setNotes] = useState(initialOrder?.notes || '');
  const [isOptimizing, setIsOptimizing] = useState<string | null>(null);

  const addItem = () => {
    setItems([...items, EMPTY_ITEM(Date.now().toString())]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        const qty = parseFloat(updated.quantity.toString()) || 0;
        const price = parseFloat(updated.unitPrice.toString()) || 0;
        const disc = parseFloat(updated.discount.toString()) || 0;
        const subtotal = qty * price;
        updated.total = subtotal - (subtotal * (disc / 100));
        return updated;
      }
      return item;
    });
    setItems(newItems);
  };

  const handleOptimizeDescription = async (id: string, currentDesc: string) => {
    if (!currentDesc) return;
    setIsOptimizing(id);
    const optimized = await optimizeItemDescription(currentDesc);
    updateItem(id, 'description', optimized);
    setIsOptimizing(null);
  };

  const itemsTotal = items.reduce((acc, curr) => acc + curr.total, 0);
  // Calculate total amount with global discount
  const totalAmount = Math.max(0, itemsTotal - discountGlobal);
  // Calculate total weight
  const totalWeight = items.reduce((acc, curr) => acc + (parseFloat(curr.weight.toString()) || 0) * (parseFloat(curr.quantity.toString()) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Fixed: Added missing properties (validity, discountGlobal, totalWeight) to satisfy Order type
    const order: Order = {
      id: initialOrder?.id || `PED-${new Date().getFullYear()}${Math.floor(Math.random() * 9000) + 1000}`,
      date: initialOrder?.date || new Date().toLocaleDateString('pt-BR'),
      salesperson,
      status: 'confirmed',
      customer,
      items,
      paymentTerms,
      paymentMethod,
      shippingType,
      carrier,
      deliveryTime,
      validity,
      discountGlobal,
      totalWeight,
      notes,
      totalAmount,
      shippingCost: 0,
      validUntil: '',
    };
    onSave(order);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button type="button" onClick={onCancel} className="flex items-center text-slate-500 hover:text-slate-800 transition">
          {ICONS.Back} <span className="ml-1 font-medium">Lista de Pedidos</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
            <span className="text-slate-400">{ICONS.User}</span>
            <input 
              className="text-sm font-bold text-slate-700 bg-transparent outline-none w-40"
              value={salesperson}
              onChange={(e) => setSalesperson(e.target.value)}
              placeholder="Vendedor"
            />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Novo Pedido de Venda</h2>
        </div>
      </div>

      {/* Customer Info Section */}
      <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Dados do Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Razão Social</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
              value={customer.name}
              onChange={(e) => setCustomer({...customer, name: e.target.value})}
              placeholder="Nome da Empresa"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">CNPJ / CPF</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
              value={customer.document}
              onChange={(e) => setCustomer({...customer, document: e.target.value})}
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Inscrição Estadual (I.E)</label>
            <input 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
              value={customer.stateRegistration}
              onChange={(e) => setCustomer({...customer, stateRegistration: e.target.value})}
              placeholder="Isento ou Nº"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">WhatsApp</label>
            <input 
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
              value={customer.phone}
              onChange={(e) => setCustomer({...customer, phone: e.target.value})}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail</label>
            <input 
              required
              type="email"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
              value={customer.email}
              onChange={(e) => setCustomer({...customer, email: e.target.value})}
              placeholder="comercial@empresa.com"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Endereço Completo</label>
            <input 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
              value={customer.address}
              onChange={(e) => setCustomer({...customer, address: e.target.value})}
              placeholder="Rua, Número, Bairro, Cidade - UF"
            />
          </div>
        </div>
      </section>

      {/* Items Section - Professional Spreadsheet Style */}
      <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Itens do Pedido (XLSX Format)</h3>
          <button 
            type="button" 
            onClick={addItem}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-bold flex items-center gap-1"
          >
            {ICONS.Plus} Novo Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="text-slate-500 text-[10px] font-bold uppercase bg-slate-50/50">
                <th className="py-3 px-4 w-28">Ref.</th>
                <th className="py-3 px-4 w-28 text-center">NCM</th>
                <th className="py-3 px-4">Descrição do Produto</th>
                <th className="py-3 px-4 w-16 text-center">UN</th>
                <th className="py-3 px-4 w-20 text-center">Qtd</th>
                <th className="py-3 px-4 w-28 text-right">Preço (R$)</th>
                <th className="py-3 px-4 w-32 text-right">Total (R$)</th>
                <th className="py-3 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-4">
                    <input 
                      className="w-full bg-transparent px-2 py-1.5 text-xs border border-transparent group-hover:border-slate-200 rounded focus:bg-white outline-none"
                      value={item.code}
                      onChange={(e) => updateItem(item.id, 'code', e.target.value)}
                      placeholder="Cod"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input 
                      className="w-full text-center bg-transparent px-2 py-1.5 text-xs border border-transparent group-hover:border-slate-200 rounded focus:bg-white outline-none"
                      value={item.ncm}
                      onChange={(e) => updateItem(item.id, 'ncm', e.target.value)}
                      placeholder="0000.00.00"
                    />
                  </td>
                  <td className="py-2 px-4">
                    <div className="relative group/ai">
                      <input 
                        required
                        className="w-full bg-transparent px-2 py-1.5 text-xs border border-transparent group-hover:border-slate-200 rounded focus:bg-white outline-none font-medium"
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Nome do produto comercial"
                      />
                      <button 
                        type="button"
                        onClick={() => handleOptimizeDescription(item.id, item.description)}
                        className="absolute right-1 top-1.5 opacity-0 group-hover/ai:opacity-100 transition text-blue-500"
                      >
                        {isOptimizing === item.id ? <div className="animate-spin h-3 w-3 border-2 border-blue-500 border-t-transparent rounded-full" /> : ICONS.AI}
                      </button>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <input 
                      className="w-full text-center bg-transparent px-2 py-1.5 text-xs border border-transparent group-hover:border-slate-200 rounded focus:bg-white outline-none"
                      value={item.unit}
                      onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input 
                      required
                      type="number"
                      className="w-full text-center bg-transparent px-2 py-1.5 text-xs border border-transparent group-hover:border-slate-200 rounded focus:bg-white outline-none"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                    />
                  </td>
                  <td className="py-2 px-4">
                    <input 
                      required
                      type="number"
                      step="0.01"
                      className="w-full text-right bg-transparent px-2 py-1.5 text-xs border border-transparent group-hover:border-slate-200 rounded focus:bg-white outline-none"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                    />
                  </td>
                  <td className="py-2 px-4 text-right text-xs font-bold text-slate-700">
                    {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-4 text-center">
                    <button type="button" onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500">
                      {ICONS.Trash}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Commercial & Shipping Conditions */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                {ICONS.Card} Financeiro
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Condição</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Ex: 30 dias"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Validade</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={validity}
                    onChange={(e) => setValidity(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Meio de Pagamento</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="Boleto">Boleto Bancário</option>
                  <option value="PIX">Transferência / PIX</option>
                  <option value="Cartão">Cartão de Crédito</option>
                  <option value="Faturamento">Faturamento Direto</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                {ICONS.Truck} Logística
              </h4>
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Frete</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={shippingType}
                    onChange={(e) => setShippingType(e.target.value as 'CIF' | 'FOB')}
                  >
                    <option value="CIF">CIF (Emitente)</option>
                    <option value="FOB">FOB (Destinatário)</option>
                  </select>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Entrega</label>
                  <input 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Transportadora</label>
                <input 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Nome da transportadora"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Notas Fiscais / Observações Internas</label>
            <textarea 
              rows={2}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-blue-700 p-8 rounded-xl shadow-xl flex flex-col justify-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FileSpreadsheet size={120} />
          </div>
          <div className="relative z-10 space-y-4">
            <div>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Subtotal de Itens</p>
              <h5 className="text-xl font-bold">R$ {itemsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h5>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-blue-200 uppercase">Desconto Global (R$)</label>
              <input 
                type="number"
                className="w-full bg-blue-800 border border-blue-400/30 rounded px-3 py-1 text-lg font-bold outline-none focus:border-blue-300"
                value={discountGlobal}
                onChange={(e) => setDiscountGlobal(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="pt-4 border-t border-white/20">
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Total Geral Líquido</p>
              <h4 className="text-4xl font-extrabold">
                R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs font-medium">
              <span>Peso Total: {totalWeight.toFixed(2)} Kg</span>
              <span>Total de Itens: {items.reduce((a, b) => a + (Number(b.quantity) || 0), 0)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-slate-200 p-4 flex justify-center z-50">
        <div className="max-w-6xl w-full flex justify-end gap-3 px-4">
          <button type="button" onClick={onCancel} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition">Cancelar</button>
          <button type="submit" className="px-10 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition flex items-center gap-2">
            {ICONS.Save} Confirmar Pedido
          </button>
        </div>
      </div>
    </form>
  );
};

export default OrderForm;
