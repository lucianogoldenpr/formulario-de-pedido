import React, { useState, useEffect } from 'react';
import { supabase, supabaseService } from './services/supabaseService';
import { localStorageService } from './services/localStorageService';
import Login from './components/Login';
import OrderList from './components/OrderList';
import OrderForm from './components/OrderForm';
import UserManagement from './components/UserManagement';
import { Order } from './types';
import { generatePDF } from './utils/exportUtils';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'list' | 'form' | 'users'>('list');
  const [orders, setOrders] = useState<Order[]>([]);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedForShare, setSelectedForShare] = useState<Order | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' | 'info' } | null>(null);

  // --- DARK MODE ---
  useEffect(() => {
    // Default to DARK authentication
    const savedTheme = localStorage.getItem('theme');

    // Only use light mode if EXPLICITLY saved as 'light'
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      // Default / Dark
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // --- AUTH & DATA LOADING ---
  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000); // Auto hide toast
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const checkSession = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();

    // Check DB Connection (Simplified)
    setDbStatus('connected');

    if (session) {
      const { data: user } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', session.user.email)
        .single();

      // Fallback para admin inicial se não encontrar no banco
      const userRole = user?.role || (session.user.email === 'luciano@goldenpr.com.br' ? 'admin' : 'user');

      setSession({ ...session, user: { ...session.user, role: userRole } });
      setIsAdmin(userRole === 'admin');

      await loadOrders(session.user.email, userRole === 'admin');
    }
    setIsLoading(false);
  };



  // --- HANDLERS ---

  const handleLogin = async (newSession: any) => {
    // A sessão vem do Login.tsx (Supabase Auth Real)
    setIsLoading(true);

    // 1. Define a sessão inicial
    setSession(newSession);

    // 2. Busca role (duplicando lógica de checkSession para garantir update imediato)
    const email = newSession.user.email;
    const { data: user } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', email)
      .single();

    const userRole = user?.role || (email === 'luciano@goldenpr.com.br' ? 'admin' : 'user');

    // Atualiza com a role correta
    setSession({ ...newSession, user: { ...newSession.user, role: userRole } });
    setIsAdmin(userRole === 'admin');

    // Atualiza last_login
    await supabaseService.updateLastLogin(email);

    await loadOrders(email, userRole === 'admin');
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
    setView('list');
    setOrders([]);
  };

  const handleNew = () => {
    setEditingOrder(null);
    setView('form');
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setView('form');
  };

  const loadOrders = async (overrideEmail?: string, overrideIsAdmin?: boolean) => {
    setIsLoading(true);
    // Usa overrides se fornecidos (durante login/check), senão usa estado atual
    const email = overrideEmail ?? session?.user?.email;
    // Se overrideIsAdmin for boolean, usa ele. Se for undefined, usa state.
    const admin = overrideIsAdmin !== undefined ? overrideIsAdmin : (session?.user?.role === 'admin');

    console.log(`Carregando pedidos para: ${email} (Admin: ${admin})`);

    const data = await supabaseService.fetchOrders(email, admin);
    setOrders(data);
    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pedido?')) return;
    setIsLoading(true);

    // 1. Tenta deletar na Nuvem
    const cloudResult = await supabaseService.deleteOrder(id) as any;
    const success = typeof cloudResult === 'boolean' ? cloudResult : cloudResult?.success;

    if (!success) {
      console.warn("Falha ao deletar na nuvem, tentando apenas localmente:", cloudResult?.error);
    }

    // 2. Deleta Localmente (Sempre)
    await localStorageService.deleteOrder(id);

    // 3. Atualiza UI
    if (success) {
      setToast({ message: 'Pedido excluído com sucesso!', type: 'success' });
    } else {
      setToast({ message: 'Pedido removido (apenas localmente ou erro de nuvem).', type: 'warning' });
    }

    await loadOrders();
    setIsLoading(false);
  };

  const handleSave = async (order: Order) => {
    setIsLoading(true);

    // 1. Garante ownership
    const orderWithUser = {
      ...order,
      created_by: session?.user?.email
    };

    // 2. Salva na Nuvem
    console.log("Tentando salvar na nuvem...");
    const cloudResult = await supabaseService.saveOrder(orderWithUser);

    if (!cloudResult.success) {
      console.error("Erro ao salvar no Supabase:", cloudResult.error);
      alert(`❌ Erro ao salvar na nuvem: ${cloudResult.error}\n\nO pedido será salvo apenas localmente no seu navegador.`);

      setToast({ message: `⚠️ Erro na Nuvem: ${cloudResult.error}. Salvando localmente...`, type: 'warning' });

      // 3. Fallback: Salva Localmente
      const localResult = await localStorageService.saveOrder(orderWithUser);
      if (localResult.success) {
        await loadOrders();
        setToast({ message: 'Salvo LOCALMENTE com sucesso!', type: 'success' });
        setView('list');
        setEditingOrder(null);
      }
    } else {
      // Sucesso na Nuvem
      console.log("Sucesso na nuvem! Iniciando geração de PDF...");

      // Salva backup local também, por segurança
      await localStorageService.saveOrder(orderWithUser);

      setToast({ message: 'Dados gravados! Gerando arquivo PDF...', type: 'info' });

      try {
        const doc = await generatePDF(orderWithUser);
        const pdfBlob = doc.output('blob');

        const uploadRes = await supabaseService.uploadOrderPDF(orderWithUser.id, pdfBlob);

        if (uploadRes.success) {
          setToast({ message: 'Pedido Salvo e Arquivado na Nuvem! ☁️', type: 'success' });
        } else {
          console.warn("Upload PDF falhou:", uploadRes.error);
          setToast({ message: 'Salvo, mas falha ao arquivar PDF.', type: 'warning' });
        }
      } catch (e) {
        console.error("Erro PDF:", e);
        setToast({ message: 'Salvo, mas erro ao gerar PDF.', type: 'warning' });
      }

      await loadOrders();
      setView('list');
      setEditingOrder(null);
    }
    setIsLoading(false);
  };

  const handleSyncLocal = async () => {
    if (!supabaseService) return;
    setIsLoading(true);
    setToast({ message: 'Procurando pedidos offline...', type: 'info' });

    try {
      const localOrders = await localStorageService.fetchOrders();
      if (localOrders.length === 0) {
        setToast({ message: 'Nenhum pedido offline encontrado.', type: 'info' });
        setIsLoading(false);
        return;
      }

      let syncedCount = 0;
      let errorCount = 0;

      for (const localOrder of localOrders) {
        const orderToSave = {
          ...localOrder,
          created_by: session?.user?.email || localOrder.created_by || 'recovered@system'
        };

        const result = await supabaseService.saveOrder(orderToSave);
        if (result.success) {
          syncedCount++;
        } else {
          console.error(`Falha ao sincronizar pedido ${localOrder.id}:`, result.error);
          errorCount++;
        }
      }

      if (syncedCount > 0) {
        setToast({
          message: `${syncedCount} pedidos recuperados com sucesso! ${errorCount > 0 ? `(${errorCount} falhas)` : ''}`,
          type: 'success'
        });
        await loadOrders();
      } else if (errorCount > 0) {
        setToast({ message: `Falha ao sincronizar ${errorCount} pedidos. Verifique o console.`, type: 'error' });
      } else {
        await loadOrders();
        setToast({ message: 'Sincronização concluída.', type: 'success' });
      }

    } catch (error) {
      console.error('Erro geral ao sincronizar:', error);
      setToast({ message: 'Erro ao executar sincronização.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDER ---

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950' : 'bg-slate-100'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">

            {/* Logo CSS Compacta */}
            <div className="flex rounded-lg overflow-hidden shadow-md transform hover:scale-105 transition duration-300 origin-left scale-90 select-none cursor-pointer" onClick={() => setView('list')}>
              {/* Lado Esquerdo */}
              <div className="bg-black px-4 py-2 flex items-center justify-center">
                <span className="text-2xl tracking-wide" style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  background: 'linear-gradient(to bottom, #FFF8DC 0%, #FFD700 40%, #B8860B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.5))'
                }}>
                  Golden
                </span>
              </div>

              {/* Lado Direito */}
              <div className="px-3 py-2 flex flex-col justify-center leading-none" style={{
                background: 'linear-gradient(to right, #B8860B, #FFD700, #F0E68C)'
              }}>
                <span className="text-[7px] text-black tracking-[0.15em] font-normal uppercase whitespace-nowrap" style={{ fontFamily: 'sans-serif' }}>EQUIPAMENTOS</span>
                <span className="text-[7px] text-black tracking-[0.15em] font-normal uppercase whitespace-nowrap mt-0.5" style={{ fontFamily: 'sans-serif' }}>MÉDICOS</span>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${dbStatus === 'connected' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800'}`}>
              <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {dbStatus === 'connected' ? 'NUVEM ATIVA' : 'OFFLINE'}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            {/* Botão de Equipe (Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => setView('users')}
                className={`p-2 transition-colors rounded-lg flex items-center gap-2 font-bold text-sm ${view === 'users' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                title="Gerenciar Equipe"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <span className="hidden lg:inline">Equipe</span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title={isDarkMode ? "Mudar para Claro" : "Mudar para Escuro"}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>

            <div className="text-right hidden sm:block">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-200">{session.user?.email}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{session.user?.role === 'admin' ? 'Administrador' : 'Vendedor'}</div>
            </div>

            <button
              onClick={() => handleLogout()}
              className="p-2 text-slate-400 hover:text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg ml-2"
              title="Sair"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>

        {/* --- MAIN CONTENT --- */}
        <main className="transition-all duration-300">
          {view === 'users' ? (
            <UserManagement
              currentUser={session.user}
              onClose={() => setView('list')}
            />
          ) : view === 'form' ? (
            <OrderForm
              initialData={editingOrder || undefined}
              onSave={handleSave}
              onCancel={() => {
                setEditingOrder(null);
                setView('list');
              }}
            />
          ) : (
            <OrderList
              orders={orders}
              onNew={handleNew}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onSync={handleSyncLocal}
              onView={(order) => {
                if (order.pdf_url) {
                  window.open(order.pdf_url, '_blank');
                } else {
                  setToast({ message: 'Gerando pré-visualização do PDF...', type: 'info' });
                  generatePDF(order).then(doc => {
                    const blob = doc.output('blob');
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                    setToast(null);
                  }).catch(err => {
                    console.error(err);
                    setToast({ message: 'Erro ao gerar PDF.', type: 'error' });
                  });
                }
              }}
              isAdmin={isAdmin}
            />
          )}
        </main>
      </div>

      {/* Floating Toast */}
      {toast && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slideIn z-50 ${toast.type === 'error' ? 'bg-red-500 text-white' :
          toast.type === 'warning' ? 'bg-amber-500 text-white' :
            toast.type === 'info' ? 'bg-blue-500 text-white' :
              'bg-emerald-500 text-white'
          }`}>
          <span className="text-2xl">
            {toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : toast.type === 'info' ? 'ℹ️' : '✅'}
          </span>
          <p className="font-bold">{toast.message}</p>
        </div>
      )}
    </div>
  );
};

export default App;
