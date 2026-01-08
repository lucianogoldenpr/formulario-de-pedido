
import React, { useState } from 'react';
import { ICONS } from '../constants';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const corporateDomain = '@goldenpr.com.br';
    
    if (!email.toLowerCase().endsWith(corporateDomain)) {
      setError(`Utilize seu e-mail corporativo finalizado em ${corporateDomain}`);
      return;
    }

    onLogin(email.trim().toLowerCase());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] -mr-48 -mt-48" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] -ml-48 -mb-48" />
      
      <div className="w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
          <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
            {/* Recreated Logo from Image */}
            <div className="flex items-stretch h-14 rounded-xl overflow-hidden shadow-lg border border-slate-200 mx-auto w-fit mb-6">
              <div className="bg-black px-5 flex items-center">
                <span className="text-white font-serif text-3xl font-bold tracking-tight">Golden</span>
              </div>
              <div className="bg-gradient-to-br from-[#D4AF37] via-[#F9E27E] to-[#B8860B] px-4 flex flex-col justify-center leading-none">
                <span className="text-black font-sans text-[10px] font-black tracking-tighter uppercase">Equipamentos</span>
                <span className="text-black font-sans text-[13px] font-black tracking-tighter uppercase">Médicos</span>
              </div>
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Portal do Vendedor</h2>
            <p className="text-sm text-slate-400 font-medium mt-1">Identifique-se com seu e-mail corporativo</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                E-mail Corporativo
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                  {ICONS.Mail}
                </div>
                <input
                  required
                  type="email"
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-100'} rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold text-slate-700`}
                  placeholder="usuario@goldenpr.com.br"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                />
              </div>
              {error && (
                <p className="text-[10px] text-red-500 font-bold px-2 animate-bounce">
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-slate-900 text-amber-400 font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
            >
              Acessar Sistema {ICONS.Send}
            </button>
          </form>

          <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              {ICONS.Legal} Golden Medical Systems v2.1
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-slate-500 text-xs font-medium">
          Acesso exclusivo para funcionários @goldenpr.com.br
        </p>
      </div>
    </div>
  );
};

export default Login;
