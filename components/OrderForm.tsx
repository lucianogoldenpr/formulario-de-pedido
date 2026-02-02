
import React, { useState, useEffect } from 'react';
import { Order, OrderItem, CustomerInfo, Contact, OrderClassification, Address } from '../types';
import { ICONS, INITIAL_CUSTOMER, EMPTY_ITEM, EMPTY_CONTACT } from '../constants';
import { optimizeItemDescription } from '../services/geminiService';
import { isValidDocument, formatCEP, validatePhone, formatPhone, applyDocumentMask, applyDateMask } from '../utils/validationUtils';
import { fetchAddressByCEP } from '../services/addressService';
import { currencyService } from '../services/currencyService';

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
  const [downPayment, setDownPayment] = useState(initialOrder?.downPayment || 0);
  const [currency, setCurrency] = useState<'Real' | 'Euro' | 'US$'>(initialOrder?.currencyConversion || 'Real');
  const [exchangeRate, setExchangeRate] = useState(initialOrder?.exchangeRate || 1);
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const handleCurrencyChange = async (newCurrency: 'Real' | 'Euro' | 'US$') => {
    setCurrency(newCurrency);
    if (newCurrency !== 'Real') {
      setIsFetchingRate(true);
      const rate = await currencyService.getExchangeRate(newCurrency);
      if (rate) {
        setExchangeRate(rate);
      } else {
        // Silencioso fail, usuário pode digitar
      }
      setIsFetchingRate(false);
    } else {
      setExchangeRate(1);
    }
  };

  // Commercial
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
  // UPDATE: Usuário solicitou divisão pelo valor do dólar/euro.
  const totalInBRL = currency === 'Real' ? globalValue2 : (exchangeRate ? globalValue2 / exchangeRate : 0);

  // Helpers para exibição
  const currencySymbol = currency === 'Real' ? 'R$' : currency === 'Euro' ? '€' : 'US$';

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
      totalInBRL, // Salva o valor convertido no banco
      downPayment,
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
      totalAmount: globalValue2, // Valor na moeda de entrada
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

  const handleAutoFill = () => {
    // Dados do Cliente
    const dummyAddress: Address = {
      street: 'Av. Paulista',
      number: '1578',
      complement: 'Andar 12 - Sala 1205',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-200'
    };

    setCustomer({
      name: 'Dr. Luciano Ferreira Santos',
      document: '677.651.309-00',
      rg: '45.678.912-3',
      stateRegistration: 'ISENTO',
      municipalRegistration: '',
      phone: '(11) 98765-4321',
      email: 'luciano@goldenpr.com.br',
      billingAddress: { ...dummyAddress },
      collectionAddress: { ...dummyAddress, complement: 'Andar 1 - Financeiro' },
      deliveryAddress: { ...dummyAddress, street: 'Rua Cincinato Braga', number: '340', complement: 'Doca 2' }
    });

    setContacts([
      {
        id: Date.now().toString(),
        name: 'Dra. Ana beatriz',
        jobTitle: 'Gerente de Compras',
        department: 'Suprimentos',
        phone: '(11) 98765-4321',
        email: 'ana.compras@hospitalsantaclara.com.br',
      }
    ]);

    const item1: OrderItem = {
      id: `item-${Date.now()}`,
      code: 'US-001',
      ncm: '9018.12.90',
      description: 'Sistema de Ultrassom Digital Portátil - Modelo X5',
      unit: 'UN',
      weight: 12.5,
      quantity: 1,
      unitPrice: 45900.00,
      discount: 0,
      total: 45900.00
    };

    setItems([item1]);

    setPaymentTerms('Entrada de R$ 15.000,00 + Saldo em 30/60 dias');
    setDownPayment(15000);
    setDeliveryTime('15 dias úteis após confirmação do pedido');
    setValidity('30 Dias');
    setClassification('Venda');
    setClassificationOther('');
    setFinalCustomer(true);

    setFreightValue(850.00);
    setDiscountTotal(2900.00);
    setCurrency('Real');
    setExchangeRate(1);

    setNotes('Obs: Entrega agendada. Recebimento apenas em horário comercial (08:00 às 17:00). Equipamento com garantia de 12 meses.');

    alert('✅ Formulário preenchido com dados de teste!');
  };

  const isDocValid = !customer.document || isValidDocument(customer.document);
  const isPhoneValid = !customer.phone || validatePhone(customer.phone);

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-32 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full text-slate-400 transition">
            {ICONS.Back}
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {initialOrder ? 'Corrigir Pedido' : 'Formulário de Pedidos'}
              </h2>
              {initialOrder && (
                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase rounded tracking-widest">
                  Edição Ativa
                </span>
              )}
              <button
                type="button"
                onClick={handleAutoFill}
                className="ml-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold uppercase rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 transition"
                title="Preencher com dados falsos para teste"
              >
                Preencher Teste
              </button>
            </div>
            <p className="text-sm text-slate-400 font-medium">Registro oficial de vendas Golden Equipamentos Médicos</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Data do Registro (*)</label>
            <input required type="date" className="w-full text-sm font-bold bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-3 py-2" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendedor Autenticado</label>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-lg text-slate-400 border border-slate-100 dark:border-slate-800">
              {ICONS.User}
              <span className="text-sm font-black text-slate-800 dark:text-slate-200">{salesperson}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CLASSIFICATION */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
          {ICONS.Commercial} Finalidade do Formulário (*)
        </h3>
        <div className="flex flex-wrap gap-4">
          {['Venda', 'Demonstração', 'Exposição', 'Consignação', 'Doação', 'Outros'].map((type) => (
            <label key={type} className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition ${classification === type ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-400' : 'border-slate-100 dark:border-slate-800 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'}`}>
              <input type="radio" name="classification" className="hidden" checked={classification === type} onChange={() => setClassification(type as OrderClassification)} />
              <span className="text-sm font-bold">{type}</span>
            </label>
          ))}
          {classification === 'Outros' && (
            <input required className="flex-1 bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-sm" placeholder="Especifique o tipo..." value={classificationOther} onChange={(e) => setClassificationOther(e.target.value)} />
          )}
        </div>
      </section>

      {/* FATURAMENTO (BILLING) */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-6 flex items-center gap-2">
          {ICONS.User} Dados para Faturamento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Razão Social / Nome Completo (*)</label>
            <input required className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2.5 text-sm font-medium" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">CNPJ / CPF (*)</label>
            <div className="relative">
              <input
                required
                className={`w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2.5 text-sm ${!isDocValid ? 'ring-2 ring-red-500' : ''}`}
                value={customer.document}
                onChange={(e) => setCustomer({ ...customer, document: applyDocumentMask(e.target.value) })}
                placeholder="00.000.000/0000-00 ou 000.000.000-00"
              />
              {!isDocValid && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-500 uppercase tracking-tighter">Inválido</span>}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Insc. Estadual (*)</label>
            <input required className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2.5 text-sm" value={customer.stateRegistration} onChange={(e) => setCustomer({ ...customer, stateRegistration: e.target.value })} placeholder="Digite 'ISENTO' se for o caso" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Insc. Municipal</label>
            <input className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2.5 text-sm" value={customer.municipalRegistration} onChange={(e) => setCustomer({ ...customer, municipalRegistration: e.target.value })} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Telefone de Contato (*)</label>
            <div className="relative">
              <input
                required
                className={`w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2.5 text-sm ${!isPhoneValid ? 'ring-2 ring-red-500' : ''}`}
                value={customer.phone}
                onChange={(e) => setCustomer({ ...customer, phone: formatPhone(e.target.value) })}
                placeholder="(00) 90000-0000"
              />
              {!isPhoneValid && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-500 uppercase tracking-tighter">Inválido</span>}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">E-mail para Faturamento (*)</label>
            <input required type="email" className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2.5 text-sm" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
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
                className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs"
                placeholder="CEP"
                value={customer.billingAddress.zipCode}
                onChange={(e) => updateAddress('billingAddress', 'zipCode', e.target.value)}
                onBlur={(e) => handleCEPBlur('billingAddress', e.target.value)}
              />
              {fetchingCEP === 'billingAddress' && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full" />}
            </div>
            <input required className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs" placeholder="Logradouro" value={customer.billingAddress.street} onChange={(e) => updateAddress('billingAddress', 'street', e.target.value)} />
            <div className="flex gap-2">
              <input required className="w-20 bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs" placeholder="N°" value={customer.billingAddress.number} onChange={(e) => updateAddress('billingAddress', 'number', e.target.value)} />
              <input className="flex-1 bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs" placeholder="Complemento" value={customer.billingAddress.complement} onChange={(e) => updateAddress('billingAddress', 'complement', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input required className="bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-2 py-2 text-xs" placeholder="Bairro" value={customer.billingAddress.neighborhood} onChange={(e) => updateAddress('billingAddress', 'neighborhood', e.target.value)} />
              <input required className="bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-2 py-2 text-xs" placeholder="Cidade" value={customer.billingAddress.city} onChange={(e) => updateAddress('billingAddress', 'city', e.target.value)} />
              <input required className="bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-2 py-2 text-xs uppercase" placeholder="UF" value={customer.billingAddress.state} onChange={(e) => updateAddress('billingAddress', 'state', e.target.value)} />
            </div>
          </div>

          {/* Cobrança */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-300 uppercase flex items-center gap-2">{ICONS.Card} Endereço Cobrança (*)</h4>
            <div className="relative">
              <input
                required
                className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs"
                placeholder="CEP"
                value={customer.collectionAddress.zipCode}
                onChange={(e) => updateAddress('collectionAddress', 'zipCode', e.target.value)}
                onBlur={(e) => handleCEPBlur('collectionAddress', e.target.value)}
              />
              {fetchingCEP === 'collectionAddress' && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full" />}
            </div>
            <input required className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs" placeholder="Logradouro" value={customer.collectionAddress.street} onChange={(e) => updateAddress('collectionAddress', 'street', e.target.value)} />
            <div className="flex gap-2">
              <input required className="w-20 bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs" placeholder="N°" value={customer.collectionAddress.number} onChange={(e) => updateAddress('collectionAddress', 'number', e.target.value)} />
              <input className="flex-1 bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs" placeholder="Complemento" value={customer.collectionAddress.complement} onChange={(e) => updateAddress('collectionAddress', 'complement', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input required className="bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-2 py-2 text-xs" placeholder="Bairro" value={customer.collectionAddress.neighborhood} onChange={(e) => updateAddress('collectionAddress', 'neighborhood', e.target.value)} />
              <input required className="bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-2 py-2 text-xs" placeholder="Cidade" value={customer.collectionAddress.city} onChange={(e) => updateAddress('collectionAddress', 'city', e.target.value)} />
              <input required className="bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-2 py-2 text-xs uppercase" placeholder="UF" value={customer.collectionAddress.state} onChange={(e) => updateAddress('collectionAddress', 'state', e.target.value)} />
            </div>
          </div>

          {/* Entrega */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-300 uppercase flex items-center gap-2">{ICONS.Truck} Endereço Entrega (*)</h4>
            <div className="relative">
              <input
                required
                className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs"
                placeholder="CEP"
                value={customer.deliveryAddress.zipCode}
                onChange={(e) => updateAddress('deliveryAddress', 'zipCode', e.target.value)}
                onBlur={(e) => handleCEPBlur('deliveryAddress', e.target.value)}
              />
              {fetchingCEP === 'deliveryAddress' && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full" />}
            </div>
            <input required className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs" placeholder="Logradouro" value={customer.deliveryAddress.street} onChange={(e) => updateAddress('deliveryAddress', 'street', e.target.value)} />
            <div className="flex gap-2">
              <input required className="w-20 bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs" placeholder="N°" value={customer.deliveryAddress.number} onChange={(e) => updateAddress('deliveryAddress', 'number', e.target.value)} />
              <input className="flex-1 bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs" placeholder="Complemento" value={customer.deliveryAddress.complement} onChange={(e) => updateAddress('deliveryAddress', 'complement', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input required className="bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-2 py-2 text-xs" placeholder="Bairro" value={customer.deliveryAddress.neighborhood} onChange={(e) => updateAddress('deliveryAddress', 'neighborhood', e.target.value)} />
              <input required className="bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-2 py-2 text-xs" placeholder="Cidade" value={customer.deliveryAddress.city} onChange={(e) => updateAddress('deliveryAddress', 'city', e.target.value)} />
              <input required className="bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-2 py-2 text-xs uppercase" placeholder="UF" value={customer.deliveryAddress.state} onChange={(e) => updateAddress('deliveryAddress', 'state', e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* CONTATOS */}
      <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
            {ICONS.Contacts} Gestão de Contatos
          </h3>
          <button type="button" onClick={addContact} className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/50 transition">
            + Adicionar Contato
          </button>
        </div>
        <div className="space-y-4">
          {contacts.map((contact, idx) => {
            const isCPhoneValid = !contact.phone || validatePhone(contact.phone);
            return (
              <div key={contact.id} className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end border border-transparent dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">Nome (*)</label>
                  <input required className="w-full bg-white dark:bg-slate-900 dark:text-white border-none rounded px-2 py-1.5 text-xs" value={contact.name} onChange={(e) => updateContact(contact.id, 'name', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">Cargo (*)</label>
                  <input required className="w-full bg-white dark:bg-slate-900 dark:text-white border-none rounded px-2 py-1.5 text-xs" value={contact.jobTitle} onChange={(e) => updateContact(contact.id, 'jobTitle', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">Setor</label>
                  <input className="w-full bg-white dark:bg-slate-900 dark:text-white border-none rounded px-2 py-1.5 text-xs" value={contact.department} onChange={(e) => updateContact(contact.id, 'department', e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">Telefone (*)</label>
                  <div className="relative">
                    <input
                      required
                      className={`w-full bg-white dark:bg-slate-900 dark:text-white border-none rounded px-2 py-1.5 text-xs ${!isCPhoneValid ? 'ring-1 ring-red-500' : ''}`}
                      value={contact.phone}
                      onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                    {!isCPhoneValid && <span className="absolute right-1 top-1 text-[8px] font-black text-red-500 uppercase">!</span>}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400">E-mail (*)</label>
                  <input required className="w-full bg-white dark:bg-slate-900 dark:text-white border-none rounded px-2 py-1.5 text-xs" value={contact.email} onChange={(e) => updateContact(contact.id, 'email', e.target.value)} />
                </div>
                <div className="flex gap-2">
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
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="bg-slate-50 dark:bg-slate-950/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tabela de Itens do Pedido (*)</h3>
          <button type="button" onClick={addItem} className="text-xs bg-amber-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-amber-700 transition">
            + Novo Item
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                <th className="py-4 px-6 w-12">ITEM</th>
                <th className="py-4 px-6">DESCRIÇÃO DOS PRODUTOS</th>
                <th className="py-4 px-6 w-20 text-center">QTD</th>
                <th className="py-4 px-6 w-32 text-right">VALOR UNIT.</th>
                <th className="py-4 px-6 w-32 text-right">VALOR TOTAL</th>
                <th className="py-4 px-6 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-6 text-xs text-slate-400 font-bold">{idx + 1}</td>
                  <td className="py-3 px-6">
                    <div className="relative group">
                      <input required className="w-full bg-transparent border-none text-xs focus:bg-white dark:focus:bg-slate-800 dark:text-slate-200 px-1 py-1 rounded" value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} />
                      <button type="button" onClick={() => handleOptimizeDescription(item.id, item.description)} className="absolute right-1 top-1 text-amber-500 opacity-0 group-hover:opacity-100 transition">
                        {isOptimizing === item.id ? <div className="animate-spin h-3 w-3 border-2 border-amber-500 border-t-transparent rounded-full" /> : ICONS.AI}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-6 text-center">
                    <input required type="number" min="1" className="w-16 bg-transparent border-none text-xs text-center focus:bg-white dark:focus:bg-slate-800 dark:text-slate-200 px-1 py-1 rounded" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} />
                  </td>
                  <td className="py-3 px-6 text-right">
                    <input required type="number" step="0.01" className="w-28 bg-transparent border-none text-xs text-right focus:bg-white dark:focus:bg-slate-800 dark:text-slate-200 px-1 py-1 rounded" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} />
                  </td>
                  <td className="py-3 px-6 text-right font-bold text-slate-700 dark:text-slate-300 text-xs">
                    {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-6 text-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItem(item.id)} className="text-slate-200 dark:text-slate-600 hover:text-red-500">
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
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 transition-colors">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-amber-600 uppercase flex items-center gap-2">{ICONS.Finance} Condições Comerciais (*)</h3>

              <div className="flex gap-4 items-center">
                <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Valor de Entrada (R$)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-3 py-1.5 text-sm font-bold text-amber-600 focus:ring-1 focus:ring-amber-500"
                    value={downPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                      setDownPayment(val / 100);
                    }}
                    placeholder="0,00"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input type="checkbox" className="w-4 h-4 rounded text-amber-600" checked={finalCustomer} onChange={(e) => setFinalCustomer(e.target.checked)} />
                  <span className="text-xs font-bold text-slate-500">Cliente Final?</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Validade Proposta (*)</label>
                  <input required className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-sm" value={validity} onChange={(e) => setValidity(e.target.value)} placeholder="Ex: 15 dias" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Vencimento (*)</label>
                  <input required type="date" className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-sm" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Condições de Pagamento (*)</label>
                <div className="flex flex-wrap gap-2 mb-1">
                  {['À Vista', '30 dias', '30/60 dias', '30/60/90 dias', '30/60/90/120 dias'].map(term => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setPaymentTerms(term)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                      {term}
                    </button>
                  ))}
                </div>
                <input required className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-sm" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Ex: Entrada 50% + 30 dias" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Prazo de Entrega Estimado (*)</label>
                <input required className="w-full bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-sm" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-300 uppercase flex items-center gap-2">{ICONS.Legal} Processos Licitatórios</h3>
              <div className="grid grid-cols-2 gap-2">
                <input className="bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs" placeholder="N° Licitação" value={biddingNumber} onChange={(e) => setBiddingNumber(e.target.value)} />
                <input type="date" className="bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs" value={biddingDate} onChange={(e) => setBiddingDate(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs" placeholder="N° Empenho" value={commitmentNumber} onChange={(e) => setCommitmentNumber(e.target.value)} />
                <input type="date" className="bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-xs" value={commitmentDate} onChange={(e) => setCommitmentDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Currency Block */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-8 transition-colors">
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Moeda do Orçamento</h4>
              <div className="flex gap-2 items-center">
                {['Real', 'Euro', 'US$'].map((m) => (
                  <button key={m} type="button" onClick={() => handleCurrencyChange(m as any)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${currency === m ? 'bg-amber-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                    {m}
                  </button>
                ))}
                {isFetchingRate && (
                  <span className="text-[10px] text-amber-600 font-bold animate-pulse">Atualizando...</span>
                )}
              </div>
            </div>
            {currency !== 'Real' && (
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-400">Taxa de Câmbio (1 {currency} = X R$)</label>
                <input required type="number" step="0.0001" className="w-32 bg-slate-50 dark:bg-slate-950 dark:text-white border-none rounded-lg px-4 py-2 text-sm font-bold" value={exchangeRate} onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)} />
              </div>
            )}
            {currency !== 'Real' ? (
              <div className="text-right flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor em {currency}</p>
                {/* Aqui mostramos o valor DIVIDIDO (totalInBRL) com o símbolo da moeda correta */}
                <p className="text-xl font-black text-amber-700 uppercase">{currencySymbol} {totalInBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            ) : (
              <div className="text-right flex-1 opacity-0"></div>
            )}
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
              <h5 className="text-xl font-bold">{currency === 'Real' ? 'R$' : currency === 'Euro' ? 'Real' : 'Real'} {globalValue1.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h5>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">(-) Desconto</label>
              <input
                type="text"
                className="w-full bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold text-amber-400 focus:ring-1 focus:ring-amber-500 transition"
                value={discountTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                  setDiscountTotal(val / 100);
                }}
                placeholder="0,00"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">(+) Frete</label>
              <input
                type="text"
                className="w-full bg-slate-800 border-none rounded-lg px-3 py-2 text-sm font-bold text-slate-300 focus:ring-1 focus:ring-slate-500 transition"
                value={freightValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/\D/g, '')) || 0;
                  setFreightValue(val / 100);
                }}
                placeholder="0,00"
              />
            </div>

            <div className="pt-6 border-t border-slate-800">
              {/* CORREÇÃO DO LABEL DO RESUMO */}
              <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest mb-1">Valor do Orçamento ({currency})</p>

              {/* Exibe o total convertido (Divisão) com o símbolo da moeda selecionada */}
              <h4 className="text-4xl font-black text-white tracking-tight">
                {currencySymbol} {totalInBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h4>

              {downPayment > 0 && (
                <div className="mt-2 text-xs font-bold text-slate-400 flex justify-between border-t border-slate-800 pt-2">
                  <span>(-) Entrada Recebida:</span>
                  <span className="text-emerald-400">{currencySymbol} {downPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              {downPayment > 0 && (
                <div className="mt-1 text-xs font-bold text-slate-200 flex justify-between">
                  <span>(=) Saldo a Pagar:</span>
                  <span className="text-white">{currencySymbol} {Math.max(0, totalInBRL - downPayment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <p className="text-xs text-slate-500 mt-3">Documento oficial Golden Equipamentos</p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span>FORMULÁRIO DE PEDIDOS</span>
            <span className="text-amber-500">MÓDULO COMERCIAL</span>
          </div>
        </div>
      </section>

      {/* FLOATING ACTION */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 p-6 flex justify-center z-50 transition-colors shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
        <div className="max-w-7xl w-full flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="px-8 py-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition disabled:opacity-50"
          >
            Descartar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-12 py-3 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-95 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              ICONS.Save
            )}
            {isSaving ? 'Gravando no Banco...' : initialOrder ? 'Salvar Alterações' : 'Salvar e Gerar Formulário'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default OrderForm;
