
import React, { useState, useEffect } from 'react';
import OrderList from './components/OrderList';
import OrderForm from './components/OrderForm';
import ShareModal from './components/ShareModal';
import Login from './components/Login';
import { Order } from './types';
import { ICONS } from './constants';
import { supabaseService } from './services/supabaseService';

const App: React.FC = () => {
  const [user, setUser] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedForShare, setSelectedForShare] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'missing-credentials' | 'error'>('connected');

  useEffect(() => {
    // Verifica se as credenciais estão presentes (ou se estamos usando o fallback da imagem)
    const url = (process.env as any).SUPABASE_URL || 'https://zoqofjswsotykjfwqucp.supabase.co';
    const key = (process.env as any).SUPABASE_ANON_KEY || 'sb_publishable_MyOrm7en402Ox-5VgvEFZA_yLkvQ8jI';
    
    if (!url || !key) {
      setDbStatus('missing-credentials');
    } else {
      setDbStatus('connected');
    }

    const savedUser = localStorage.getItem('golden_user');
    if (savedUser) {
      setUser(savedUser);
      loadOrders();
    }
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    const data = await supabaseService.fetchOrders();
    setOrders(data);
    setIsLoading(false);
  };

  const handleLogin = (email: string) => {
    setUser(email);
    localStorage.setItem('golden_user', email);
    loadOrders();
  };

  const handleLogout = () => {
    if (window.confirm('Deseja realmente sair do sistema?')) {
      setUser(null);
      localStorage.removeItem('golden_user');
      setView('list');
    }
  };

  const handleSave = async (order: Order) => {
    setIsLoading(true);
    const result = await supabaseService.saveOrder(order);
    
    if (result.success) {
      await loadOrders();
      setView('list');
      setEditingOrder(null);
      setSelectedForShare(order); 
    } else {
      alert(`Erro ao salvar o pedido: ${result.error || 'Verifique sua conexão.'}`);
    }
    setIsLoading(false);
  };

  const handleNew = () => {
    setEditingOrder(null);
    setView('form');
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setView('form');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este pedido permanentemente do banco de dados?')) {
      setIsLoading(true);
      const success = await supabaseService.deleteOrder(id);
      if (success) {
        setOrders(orders.filter(o => o.id !== id));
      } else {
        alert('Erro ao excluir o pedido.');
      }
      setIsLoading(false);
    }
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-stretch h-12 rounded-lg overflow-hidden shadow-md border border-slate-200 cursor-pointer" onClick={() => setView('list')}>
              <div className="bg-black px-4 flex items-center">
                <span className="text-white font-serif text-2xl font-bold tracking-tight">Golden</span>
              </div>
              <div className="bg-gradient-to-br from-[#D4AF37] via-[#F9E27E] to-[#B8860B] px-3 flex flex-col justify-center leading-none">
                <span className="text-black font-sans text-[10px] font-black tracking-tighter uppercase">Equipamentos</span>
                <span className="text-black font-sans text-[12px] font-black tracking-tighter uppercase">Médicos</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 ml-4">
              {isLoading ? (
                <div className="flex items-center gap-2 text-amber-600 font-bold animate-pulse text-xs">
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                  Sincronizando...
                </div>
              ) : dbStatus === 'missing-credentials' ? (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-red-100">
                  Banco Desconectado
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase border border-emerald-100">
                  Nuvem Ativa
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-l border-slate-100 pl-6">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-800">{user}</p>
                <p className="text-[9px] text-amber-600 uppercase font-black tracking-widest">Colaborador Golden</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                title="Sair do Sistema"
              >
                {ICONS.Back}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'list' ? (
          <OrderList 
            orders={orders} 
            onSelect={setSelectedForShare} 
            onEdit={handleEdit}
            onNew={handleNew}
            onDelete={handleDelete}
            onRefresh={loadOrders}
          />
        ) : (
          <OrderForm 
            onSave={handleSave} 
            onCancel={() => setView('list')}
            initialOrder={editingOrder}
            salespersonName={user}
          />
        )}
      </main>

      {selectedForShare && (
        <ShareModal 
          order={selectedForShare} 
          onClose={() => setSelectedForShare(null)} 
        />
      )}

      <div className="fixed -top-24 -right-24 -z-10 w-96 h-96 bg-amber-100 rounded-full blur-[100px] opacity-30 pointer-events-none" />
      <div className="fixed -bottom-24 -left-24 -z-10 w-64 h-64 bg-slate-200 rounded-full blur-[80px] opacity-20 pointer-events-none" />
    </div>
  );
};

export default App;
