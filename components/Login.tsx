
import React, { useState } from 'react';
import { supabaseService } from '../services/supabaseService';

interface LoginProps {
  onLogin: (session: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Nova validação
  const [fullname, setFullname] = useState(''); // Para cadastro
  const [isSignApp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignApp) {
        // --- CADASTRO ---
        if (!email.includes('@goldenpr.com.br')) {
          setError('Apenas e-mails corporativos (@goldenpr.com.br) são permitidos.');
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('As senhas não coincidem. Por favor, verifique.');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setError('A senha deve ter pelo menos 6 caracteres.');
          setLoading(false);
          return;
        }

        const { user, error } = await supabaseService.signUp(email, password, fullname);

        if (error) throw error;

        if (user) {
          // Tenta logar imediatamente (Funciona se "Confirm Email" estiver OFF no Supabase)
          const { session } = await supabaseService.signInWithPassword(email, password);

          if (session) {
            onLogin(session);
            return;
          }

          setSuccessMsg('Conta recebida! Se necessário, verifique seu e-mail para confirmar.');
          setIsSignUp(false);
        }
      } else {
        // --- LOGIN ---
        const { session, error } = await supabaseService.signInWithPassword(email, password);

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('E-mail ou senha incorretos.');
          }
          throw error;
        }

        if (session) {
          onLogin(session);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      {/* Container Central Clean */}
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">

        {/* Header com Logo */}
        <div className="p-8 pb-6 border-b border-slate-100 dark:border-slate-800 text-center">
          {/* Logo Oficial */}
          {/* Logo Oficial (High Fidelity CSS) */}
          <div className="flex justify-center mb-10 mt-2">
            <div className="flex rounded-lg overflow-hidden shadow-2xl transform hover:scale-105 transition duration-500">
              {/* Lado Esquerdo: Golden */}
              <div className="bg-black px-6 py-3 flex items-center justify-center min-h-[50px]">
                <span className="text-3xl tracking-wide" style={{
                  fontFamily: '"Times New Roman", Times, serif',
                  background: 'linear-gradient(to bottom, #FFF8DC 0%, #FFD700 40%, #B8860B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.5))'
                }}>
                  Golden
                </span>
              </div>

              {/* Lado Direito: Equipamentos Médicos */}
              <div className="px-4 py-3 flex flex-col justify-center leading-none min-h-[50px]" style={{
                background: 'linear-gradient(to right, #B8860B, #FFD700, #F0E68C)'
              }}>
                <span className="text-[10px] text-black tracking-[0.15em] font-normal uppercase whitespace-nowrap" style={{ fontFamily: 'sans-serif' }}>EQUIPAMENTOS</span>
                <span className="text-[10px] text-black tracking-[0.15em] font-normal uppercase whitespace-nowrap mt-0.5" style={{ fontFamily: 'sans-serif' }}>MÉDICOS</span>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {isSignApp ? 'Criar Nova Conta' : 'Acesse sua Conta'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isSignApp ? 'Preencha seus dados corporativos' : 'Sistema Golden de Formulário de Pedidos'}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleLogin} className="p-8 pt-6 space-y-5">

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg border border-red-100 dark:border-red-800 font-medium animate-pulse">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm p-3 rounded-lg border border-emerald-100 dark:border-emerald-800 font-medium">
              {successMsg}
            </div>
          )}

          <div className="space-y-4">
            {isSignApp && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Nome Completo</label>
                <input
                  type="text"
                  value={fullname}
                  onChange={e => setFullname(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  placeholder="Seu Nome"
                  required={isSignApp}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">E-mail Corporativo</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                placeholder="nome@goldenpr.com.br"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {isSignApp && (
              <div className="animate-scaleIn pt-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Confirmar Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-4 py-3 text-slate-900 dark:text-slate-100 focus:ring-2 outline-none transition-all ${confirmPassword && password !== confirmPassword
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-amber-500'
                    }`}
                  placeholder="Repita a senha"
                  required
                  minLength={6}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-500 text-xs mt-1 ml-1 font-bold">As senhas não conferem</p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait mt-2"
          >
            {loading ? 'Processando...' : (isSignApp ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 text-center border-t border-slate-100 dark:border-slate-800">
          <p className="text-sm text-slate-500">
            {isSignApp ? 'Já tem uma conta?' : 'Ainda não tem acesso?'}
            <button
              onClick={() => { setIsSignUp(!isSignApp); setError(null); }}
              className="ml-2 font-bold text-amber-600 hover:text-amber-700 hover:underline"
            >
              {isSignApp ? 'Fazer Login' : 'Criar Conta'}
            </button>
          </p>
        </div>

      </div>

      {/* Copyright Footer */}
      <div className="absolute bottom-6 text-center w-full text-slate-500 text-xs opacity-60">
        &copy; 2026 Golden Equipamentos Médicos - T.I
      </div>
    </div>
  );
};

export default Login;
