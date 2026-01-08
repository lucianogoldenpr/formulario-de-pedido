
import React, { useState, useEffect } from 'react';
import { Order, OrderItem, CustomerInfo, Contact, OrderClassification, Address } from '../types';
import { ICONS, INITIAL_CUSTOMER, EMPTY_ITEM, EMPTY_CONTACT } from '../constants';
import { optimizeItemDescription } from '../services/geminiService';
import { isValidDocument, formatCEP, validatePhone, formatPhone } from '../utils/validationUtils';
import { fetchAddressByCEP } from '../services/addressService';

interface OrderFormProps {
  onSave: (order: Order) => Promise<void> | void;
  onCancel: () => void;
  initialOrder?: Order | null;
  salespersonName: string;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSave, onCancel, initialOrder, salespersonName }) => {
  // --- States ---
  const [salesperson, setSalesperson] = useState(initialOrder?.salesperson || salespersonName);
  const [orderDate, setOrderDate] = useState(initialOrder?.date || new Date().toISOString().split('T')[0]);
  const [classification, setClassification] = useState<OrderClassification>(initialOrder?.classification || 'Venda');
  const [classificationOther, setClassificationOther] = useState(initialOrder?.classificationOther || '');
  const [customer, setCustomer] = useState<CustomerInfo>(initialOrder?.customer || { ...INITIAL_CUSTOMER });
  const [contacts, setContacts] = useState<Contact[]>(initialOrder?.contacts || [EMPTY_CONTACT('1')]);
  const [items, setItems] = useState<OrderItem[]>(initialOrder?.items || [EMPTY_ITEM('item-1')]);
  
  // Totals & Currency
  const [discountTotal, setDiscountTotal] = useState(initialOrder?.discountTotal || 0);
  const [freightValue, setFreightValue] = useState(initialOrder?.freightValue || 0);
  const [currency, setCurrency] = useState<'Real' | 'Euro' | 'US$'>(initialOrder?.currencyConversion || 'Real');
  const [exchangeRate, setExchangeRate] = useState(initialOrder?.exchangeRate || 1);
  
  // Commercial
  const [minBilling, setMinBilling] = useState(initialOrder?.minBilling || false);
  const [minBillingValue, setMinBillingValue] = useState(initialOrder?.minBillingValue || 0);
  const [finalCustomer, setFinalCustomer] = useState(initialOrder?.finalCustomer || false);
  const [paymentTerms, setPaymentTerms] = useState(initialOrder?.paymentTerms || '');
  const [deliveryTime, setDeliveryTime] = useState(initialOrder?.deliveryTime || '');
  const [validity, setValidity] = useState(initialOrder?.validity || '15 dias');
  const [validUntil, setValidUntil] = useState(initialOrder?.validUntil || '');
  
  // Bidding
  const [biddingNumber, setBiddingNumber] = useState(initialOrder?.biddingNumber || '');
  const [biddingDate, setBiddingDate] = useState(initialOrder?.biddingDate || '');
  const [commitmentNumber, setCommitmentNumber] = useState(initialOrder?.commitmentNumber || '');
  const [commitmentDate, setCommitmentDate] = useState(initialOrder?.commitmentDate || '');
  
  const [notes, setNotes] = useState(initialOrder?.notes || '');
  const [isOptimizing, setIsOptimizing] = useState<string | null>(null);
  const [fetchingCEP, setFetchingCEP] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- Helpers ---
  const updateAddress = (type: 'billingAddress' | 'collectionAddress' | 'deliveryAddress', field: keyof Address, value: string) => {
    setCustomer(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const handleCEPBlur = async (type: 'billingAddress' | 'collectionAddress' | 'deliveryAddress', cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setFetchingCEP(type);
      const data = await fetchAddressByCEP(cleanCEP);
      if (data) {
        setCustomer(prev => ({
          ...prev,
          [type]: {
            ...prev[type],
            street: data.street || prev[type].street,
            neighborhood: data.neighborhood || prev[type].neighborhood,
            city: data.city || prev[type].city,
            state: data.state || prev[type].state,
            zipCode: formatCEP(cleanCEP)
          }
        }));
      }
      setFetchingCEP(null);
    }
  };

  const addItem = () => setItems([...items, EMPTY_ITEM(Date.now().toString())]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  
  const addContact = () => setContacts([...contacts, EMPTY_CONTACT(Date.now().toString())]);
  const removeContact = (id: string) => setContacts(contacts.filter(c => c.id !== id));

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        updated.total = (parseFloat(updated.quantity.toString()) || 0) * (parseFloat(updated.unitPrice.toString()) || 0);
        return updated;
      }
      return item;
    }));
  };

  const updateContact = (id: string, field: keyof Contact, value: string) => {
    let finalValue = value;
    if (field === 'phone') {
      finalValue = formatPhone(value);
    }
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: finalValue } : c));
  };

  const handleOptimizeDescription = async (id: string, currentDesc: string) => {
    if (!currentDesc) return;
    setIsOptimizing(id);
    const optimized = await optimizeItemDescription(currentDesc);
    updateItem(id, 'description', optimized);
    setIsOptimizing(null);
  };

  // --- Calculations ---
  const globalValue1 = items.reduce((acc, curr) => acc + curr.total, 0);
  const globalValue2 = Math.max(0, globalValue1 - discountTotal + freightValue);
  
  // O valor total em Reais deve ser o valor líquido (globalValue2) multiplicado pela taxa de câmbio.
  // Se a moeda for Real, a taxa é 1.
  const totalInBRL = currency === 'Real' ? globalValue2 : globalValue2 * exchangeRate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações rigorosas
    if (!customer.name || !customer.document || !customer.phone || !customer.email || !paymentTerms || !deliveryTime) {
      alert('Preencha todos os campos obrigatórios marcados com (*).');
      return;
    }

    if (!isValidDocument(customer.document)) {
      alert('CPF/CNPJ inválido.');
      return;
    }

    if (!validatePhone(customer.phone)) {
      alert('Telefone do cliente inválido.');
      return;
    }

    if (!customer.billingAddress.zipCode || !customer.billingAddress.street || !customer.billingAddress.number) {
      alert('O endereço de faturamento é obrigatório e deve estar completo.');
      return;
    }

    setIsSaving(true);
    const order: Order = {
      id: initialOrder?.id || `PED-${Date.now().toString().slice(-6)}`,
      date: orderDate,
      salesperson,
      classification,
      classificationOther,
      status: initialOrder?.status || 'confirmed',
      customer,
      contacts,
      items,
      globalValue1,
      discountTotal,
      freightValue,
      globalValue2,
      currencyConversion: currency,
      exchangeRate,
      totalInBRL,
      minBilling,
      minBillingValue,
      finalCustomer,
      paymentTerms,
      deliveryTime,
      validity,
      validUntil,
      biddingNumber,
      biddingDate,
      commitmentNumber,
      commitmentDate,
      notes,
      totalWeight: items.reduce((acc, curr) => acc + (curr.weight * curr.quantity), 0),
      totalAmount: globalValue2, // Valor na moeda escolhida
      shippingCost: freightValue,
    };
    
    try {
      await onSave(order);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o formulário.');
    } finally {
      setIsSaving(false);
    }
  };

  const isDocValid = !customer.document || isValidDocument(customer.document);
  const isPhoneValid = !customer.phone || validatePhone(customer.phone);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-32 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition">
            {ICONS.Back}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {initialOrder ? 'Corrigir Pedido' : 'Formulário de Pedidos'}
              </h2>
              {initialOrder && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded tracking-widest">
                  Edição Ativa
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 font-medium">Registro oficial de vendas Golden Equipamentos Médicos</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Data do Registro (*)</label>
            <input required type="date" className="w-full text-sm font-bold bg-slate-50 border-none rounded-lg px-3 py-2" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendedor Autenticado</label>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg text-slate-400 border border-slate-100">
               {ICONS.User}
               <span className="text-sm font-black text-slate-800">{salesperson}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CLASSIFICATION */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
          {ICONS.Commercial} Finalidade do Formulário (*)
        </h3>
        <div className="flex flex-wrap gap-4">
          {['Venda', 'Demonstração', 'Exposição', 'Consignação', 'Doação', 'Outros'].map((type) => (
            <label key={type} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition ${classification === type ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-slate-100 hover:border-slate-200'}`}>
              <input type="radio" name="classification" className="hidden" checked={classification === type} onChange={() => setClassification(type as OrderClassification)} />
              <span className="text-sm font-bold">{type}</span>
            </label>
          ))}
          {classification === 'Outros' && (
            <input required className="flex-1 bg-slate-50 border-none rounded-lg px-4 py-2 text-sm" placeholder="Especifique o tipo..." value={classificationOther} onChange={(e) => setClassificationOther(e.target.value)} />
          )}
        </div>
      </section>

      {/* FATURAMENTO (BILLING) */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-6 flex items-center gap-2">
          {ICONS.User} Dados para Faturamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Razão Social / Nome Completo (*)</label>
            <input required className="w-full bg-slate-50 border-none rounded-lg px-4 py-2.5 text-sm font-medium" value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">CNPJ / CPF (*)</label>
            <div className="relative">
              <input 
                required 
                className={`w-full bg-slate-50 border-none rounded-lg px-4 py-2.5 text-sm ${!isDocValid ? 'ring-2 ring-red-500' : ''}`} 
                value={customer.document} 
                onChange={(e) => setCustomer({...customer, document: e.target.value})} 
                placeholder="00.000.000/0000-00 ou 000.000.000-00"
              />
              {!isDocValid && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-500 uppercase tracking-tighter">Inválido</span>}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">RG / Documento Identidade (*)</label>
            <input required className="w-full bg-slate-50 border-none rounded-lg px-4 py-2.5 text-sm" value={customer.rg} onChange={(e) => setCustomer({...customer, rg: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Insc. Estadual (*)</label>
            <input required className="w-full bg-slate-50 border-none rounded-lg px-4 py-2.5 text-sm" value={customer.stateRegistration} onChange={(e) => setCustomer({...customer, stateRegistration: e.target.value})} placeholder="Digite 'ISENTO' se for o caso" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Insc. Municipal</label>
            <input className="w-full bg-slate-50 border-none rounded-lg px-4 py-2.5 text-sm" value={customer.municipalRegistration} onChange={(e) => setCustomer({...customer, municipalRegistration: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Telefone de Contato (*)</label>
            <div className="relative">
              <input 
                required 
                className={`w-full bg-slate-50 border-none rounded-lg px-4 py-2.5 text-sm ${!isPhoneValid ? 'ring-2 ring-red-500' : ''}`} 
                value={customer.phone} 
                onChange={(e) => setCustomer({...customer, phone: formatPhone(e.target.value)})} 
                placeholder="(00) 90000-0000"
              />
              {!isPhoneValid && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-500 uppercase tracking-tighter">Inválido</span>}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">E-mail para Faturamento (*)</label>
            <input required type="email" className="w-full bg-slate-50 border-none rounded-lg px-4 py-2.5 text-sm" value={customer.email} onChange={(e) => setCustomer({...customer, email: e.target.value})} />
          </div>
        </div>

        {/* Address Blocks */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Faturamento */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-300 uppercase flex items-center gap-2">{ICONS.Address} Endereço Faturamento (*)</h4>
            <div className="relative">
              <input 
                required
                className="w-full bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" 
                placeholder="CEP" 
                value={customer.billingAddress.zipCode} 
                onChange={(e) => updateAddress('billingAddress', 'zipCode', e.target.value)}
                onBlur={(e) => handleCEPBlur('billingAddress', e.target.value)}
              />
              {fetchingCEP === 'billingAddress' && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full" />}
            </div>
            <input required className="w-full bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" placeholder="Logradouro" value={customer.billingAddress.street} onChange={(e) => updateAddress('billingAddress', 'street', e.target.value)} />
            <div className="flex gap-2">
              <input required className="w-20 bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" placeholder="N°" value={customer.billingAddress.number} onChange={(e) => updateAddress('billingAddress', 'number', e.target.value)} />
              <input className="flex-1 bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" placeholder="Complemento" value={customer.billingAddress.complement} onChange={(e) => updateAddress('billingAddress', 'complement', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input required className="bg-slate-50 border-none rounded-lg px-2 py-2 text-xs" placeholder="Bairro" value={customer.billingAddress.neighborhood} onChange={(e) => updateAddress('billingAddress', 'neighborhood', e.target.value)} />
              <input required className="bg-slate-50 border-none rounded-lg px-2 py-2 text-xs" placeholder="Cidade" value={customer.billingAddress.city} onChange={(e) => updateAddress('billingAddress', 'city', e.target.value)} />
              <input required className="bg-slate-50 border-none rounded-lg px-2 py-2 text-xs uppercase" placeholder="UF" value={customer.billingAddress.state} onChange={(e) => updateAddress('billingAddress', 'state', e.target.value)} />
            </div>
          </div>

          {/* Cobrança */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-300 uppercase flex items-center gap-2">{ICONS.Card} Endereço Cobrança (*)</h4>
            <div className="relative">
              <input 
                required
                className="w-full bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" 
                placeholder="CEP" 
                value={customer.collectionAddress.zipCode} 
                onChange={(e) => updateAddress('collectionAddress', 'zipCode', e.target.value)}
                onBlur={(e) => handleCEPBlur('collectionAddress', e.target.value)}
              />
              {fetchingCEP === 'collectionAddress' && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full" />}
            </div>
            <input required className="w-full bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" placeholder="Logradouro" value={customer.collectionAddress.street} onChange={(e) => updateAddress('collectionAddress', 'street', e.target.value)} />
            <div className="flex gap-2">
              <input required className="w-20 bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" placeholder="N°" value={customer.collectionAddress.number} onChange={(e) => updateAddress('collectionAddress', 'number', e.target.value)} />
              <input className="flex-1 bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" placeholder="Complemento" value={customer.collectionAddress.complement} onChange={(e) => updateAddress('collectionAddress', 'complement', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input required className="bg-slate-50 border-none rounded-lg px-2 py-2 text-xs" placeholder="Bairro" value={customer.collectionAddress.neighborhood} onChange={(e) => updateAddress('collectionAddress', 'neighborhood', e.target.value)} />
              <input required className="bg-slate-50 border-none rounded-lg px-2 py-2 text-xs" placeholder="Cidade" value={customer.collectionAddress.city} onChange={(e) => updateAddress('collectionAddress', 'city', e.target.value)} />
              <input required className="bg-slate-50 border-none rounded-lg px-2 py-2 text-xs uppercase" placeholder="UF" value={customer.collectionAddress.state} onChange={(e) => updateAddress('collectionAddress', 'state', e.target.value)} />
            </div>
          </div>

          {/* Entrega */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-300 uppercase flex items-center gap-2">{ICONS.Truck} Endereço Entrega (*)</h4>
            <div className="relative">
              <input 
                required
                className="w-full bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" 
                placeholder="CEP" 
                value={customer.deliveryAddress.zipCode} 
                onChange={(e) => updateAddress('deliveryAddress', 'zipCode', e.target.value)}
                onBlur={(e) => handleCEPBlur('deliveryAddress', e.target.value)}
              />
              {fetchingCEP === 'deliveryAddress' && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full" />}
            </div>
            <input required className="w-full bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" placeholder="Logradouro" value={customer.deliveryAddress.street} onChange={(e) => updateAddress('deliveryAddress', 'street', e.target.value)} />
            <div className="flex gap-2">
              <input required className="w-20 bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" placeholder="N°" value={customer.deliveryAddress.number} onChange={(e) => updateAddress('deliveryAddress', 'number', e.target.value)} />
              <input className="flex-1 bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" placeholder="Complemento" value={customer.deliveryAddress.complement} onChange={(e) => updateAddress('deliveryAddress', 'complement', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input required className="bg-slate-50 border-none rounded-lg px-2 py-2 text-xs" placeholder="Bairro" value={customer.deliveryAddress.neighborhood} onChange={(e) => updateAddress('deliveryAddress', 'neighborhood', e.target.value)} />
              <input required className="bg-slate-50 border-none rounded-lg px-2 py-2 text-xs" placeholder="Cidade" value={customer.deliveryAddress.city} onChange={(e) => updateAddress('deliveryAddress', 'city', e.target.value)} />
              <input required className="bg-slate-50 border-none rounded-lg px-2 py-2 text-xs uppercase" placeholder="UF" value={customer.deliveryAddress.state} onChange={(e) => updateAddress('deliveryAddress', 'state', e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* CONTATOS */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
            {ICONS.Contacts} Gestão de Contatos
          </h3>
          <button type="button" onClick={addContact} className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition">
            + Adicionar Contato
          </button>
        </div>
        <div className="space-y-4">
          {contacts.map((contact, idx) => {
            const isCPhoneValid = !contact.phone || validatePhone(contact.phone);
            return (
              <div key={contact.id} className="p-4 bg-slate-50 rounded-xl grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">Nome (*)</label>
                  <input required className="w-full bg-white border-none rounded px-2 py-1.5 text-xs" value={contact.name} onChange={(e) => updateContact(contact.id, 'name', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">Cargo (*)</label>
                  <input required className="w-full bg-white border-none rounded px-2 py-1.5 text-xs" value={contact.jobTitle} onChange={(e) => updateContact(contact.id, 'jobTitle', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">Setor</label>
                  <input className="w-full bg-white border-none rounded px-2 py-1.5 text-xs" value={contact.department} onChange={(e) => updateContact(contact.id, 'department', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">Telefone (*)</label>
                  <div className="relative">
                    <input 
                      required
                      className={`w-full bg-white border-none rounded px-2 py-1.5 text-xs ${!isCPhoneValid ? 'ring-1 ring-red-500' : ''}`} 
                      value={contact.phone} 
                      onChange={(e) => updateContact(contact.id, 'phone', e.target.value)} 
                      placeholder="(00) 00000-0000"
                    />
                    {!isCPhoneValid && <span className="absolute right-1 top-1 text-[8px] font-black text-red-500 uppercase">!</span>}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">E-mail (*)</label>
                  <input required className="w-full bg-white border-none rounded px-2 py-1.5 text-xs" value={contact.email} onChange={(e) => updateContact(contact.id, 'email', e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-bold text-slate-400">Aniversário</label>
                    <input className="w-full bg-white border-none rounded px-2 py-1.5 text-xs" value={contact.birthday} onChange={(e) => updateContact(contact.id, 'birthday', e.target.value)} />
                  </div>
                  {contacts.length > 1 && (
                    <button type="button" onClick={() => removeContact(contact.id)} className="p-2 text-red-300 hover:text-red-500 transition">
                      {ICONS.Trash}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ITEMS TABLE */}
      <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Tabela de Itens do Pedido (*)</h3>
          <button type="button" onClick={addItem} className="text-xs bg-amber-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-amber-700 transition">
            + Novo Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="py-4 px-6 w-12">ITEM</th>
                <th className="py-4 px-6 w-24">REF.</th>
                <th className="py-4 px-6">DESCRIÇÃO DOS PRODUTOS</th>
                <th className="py-4 px-6 w-20 text-center">QTD</th>
                <th className="py-4 px-6 w-32 text-right">VALOR UNIT.</th>
                <th className="py-4 px-6 w-32 text-right">VALOR TOTAL</th>
                <th className="py-4 px-6 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-6 text-xs text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-6">
                    <input required className="w-full bg-transparent border-none text-xs font-bold focus:bg-white px-1 py-1 rounded" value={item.code} onChange={(e) => updateItem(item.id, 'code', e.target.value)} />
                  </td>
                  <td className="py-3 px-6">
                    <div className="relative group">
                      <input required className="w-full bg-transparent border-none text-xs focus:bg-white px-1 py-1 rounded" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} />
                      <button type="button" onClick={() => handleOptimizeDescription(item.id, item.description)} className="absolute right-1 top-1 text-amber-500 opacity-0 group-hover:opacity-100 transition">
                        {isOptimizing === item.id ? <div className="animate-spin h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full" /> : ICONS.AI}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <input required type="number" min="1" className="w-16 bg-transparent border-none text-xs text-center focus:bg-white px-1 py-1 rounded" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} />
                  </td>
                  <td className="py-3 px-6 text-right">
                    <input required type="number" step="0.01" className="w-28 bg-transparent border-none text-xs text-right focus:bg-white px-1 py-1 rounded" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} />
                  </td>
                  <td className="py-3 px-6 text-right font-bold text-slate-700 text-xs">
                    {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(item.id)} className="text-slate-200 hover:text-red-500">
                        {ICONS.Trash}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* TOTALS & FINANCE */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Commercial Terms */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="space-y-4">
               <h3 className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-2">{ICONS.Finance} Condições Comerciais (*)</h3>
               <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded text-amber-600" checked={minBilling} onChange={(e) => setMinBilling(e.target.checked)} />
                    <span className="text-xs font-bold text-slate-500">Fat. Mínimo?</span>
                  </label>
                  {minBilling && (
                    <input required type="number" className="w-24 bg-slate-50 border-none rounded px-3 py-1.5 text-xs font-bold" placeholder="Valor" value={minBillingValue} onChange={(e) => setMinBillingValue(parseFloat(e.target.value) || 0)} />
                  )}
                  <label className="flex items-center gap-2 cursor-pointer ml-4">
                    <input type="checkbox" className="w-4 h-4 rounded text-amber-600" checked={finalCustomer} onChange={(e) => setFinalCustomer(e.target.checked)} />
                    <span className="text-xs font-bold text-slate-500">Cliente Final?</span>
                  </label>
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">Validade Proposta (*)</label>
                   <input required className="w-full bg-slate-50 border-none rounded-lg px-4 py-2 text-sm" value={validity} onChange={(e) => setValidity(e.target.value)} placeholder="Ex: 15 dias" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">Vencimento (*)</label>
                   <input required type="date" className="w-full bg-slate-50 border-none rounded-lg px-4 py-2 text-sm" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                 </div>
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Forma de Pagamento (*)</label>
                 <input required className="w-full bg-slate-50 border-none rounded-lg px-4 py-2 text-sm" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Prazo de Entrega Estimado (*)</label>
                 <input required className="w-full bg-slate-50 border-none rounded-lg px-4 py-2 text-sm" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
               </div>
             </div>

             <div className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-300 uppercase flex items-center gap-2">{ICONS.Legal} Processos Licitatórios</h3>
               <div className="grid grid-cols-2 gap-2">
                 <input className="bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" placeholder="N° Licitação" value={biddingNumber} onChange={(e) => setBiddingNumber(e.target.value)} />
                 <input type="date" className="bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" value={biddingDate} onChange={(e) => setBiddingDate(e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <input className="bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" placeholder="N° Empenho" value={commitmentNumber} onChange={(e) => setCommitmentNumber(e.target.value)} />
                 <input type="date" className="bg-slate-50 border-none rounded-lg px-4 py-2 text-xs" value={commitmentDate} onChange={(e) => setCommitmentDate(e.target.value)} />
               </div>
             </div>
          </div>

          {/* Currency Block */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-8">
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Moeda do Orçamento</h4>
              <div className="flex gap-2">
                {['Real', 'Euro', 'US$'].map((m) => (
                  <button key={m} type="button" onClick={() => setCurrency(m as any)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${currency === m ? 'bg-amber-600 text-white' : 'bg-slate-50 text-slate-400'}`}>{m}</button>
                ))}
              </div>
            </div>
            {currency !== 'Real' && (
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Taxa de Câmbio (1 {currency} = X R$)</label>
                <input required type="number" step="0.0001" className="w-32 bg-slate-50 border-none rounded-lg px-4 py-2 text-sm font-bold" value={exchangeRate} onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)} />
              </div>
            )}
            <div className="text-right flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Final em R$</p>
              <p className="text-xl font-black text-amber-700 uppercase">R$ {totalInBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* SUMMARY CARD */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl text-white flex flex-col justify-between relative overflow-hidden border-b-4 border-amber-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            {ICONS.Excel}
          </div>
          <div className="space-y-6 relative z-10">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Subtotal de Itens ({currency})</p>
              <h5 className="text-xl font-bold">{currency === 'Real' ? 'R$' : currency} {globalValue1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h5>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">(-) Desconto</label>
                <input required type="number" className="w-full bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold text-amber-400" value={discountTotal} onChange={(e) => setDiscountTotal(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">(+) Frete</label>
                <input required type="number" className="w-full bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-300" value={freightValue} onChange={(e) => setFreightValue(parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800">
              <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-1">Valor do Orçamento ({currency})</p>
              <h4 className="text-5xl font-black text-white">
                {globalValue2.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>
              <p className="text-xs text-slate-500 mt-2">Documento oficial Golden Equipamentos</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400">
             <span>FORMULÁRIO DE PEDIDOS</span>
             <span className="text-amber-500">MÓDULO COMERCIAL</span>
          </div>
        </div>
      </section>

      {/* FLOATING ACTION */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 p-6 flex justify-center z-50">
        <div className="max-w-7xl w-full flex justify-end gap-4">
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={isSaving}
            className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition disabled:opacity-50"
          >
            Descartar
          </button>
          <button 
            type="submit" 
            disabled={isSaving}
            className="px-12 py-3 bg-amber-600 text-white font-black rounded-2xl shadow-xl shadow-amber-200 hover:bg-amber-700 active:scale-95 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              ICONS.Save
            )}
            {isSaving ? 'Gravando no Banco...' : initialOrder ? 'Salvar Alterações' : 'Gerar Formulário de Pedido'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default OrderForm;
