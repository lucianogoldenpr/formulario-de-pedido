
import React, { useState, useEffect } from 'react';
import { supabaseService, AppUser } from '../services/supabaseService';

interface UserManagementProps {
    currentUser: any;
    onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser, onClose }) => {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Estado unificado para Create/Edit
    const [formData, setFormData] = useState({ name: '', email: '', role: 'user' as 'admin' | 'user', password: '' });
    const [editingEmail, setEditingEmail] = useState<string | null>(null); // Se null = modo criar, se string = modo editar

    const [processing, setProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const data = await supabaseService.fetchUsers();
        setUsers(data as AppUser[]);
        setLoading(false);
    };

    const openNewUserModal = () => {
        setFormData({ name: '', email: '', role: 'user', password: '' });
        setEditingEmail(null);
        setErrorMsg(null);
        setShowModal(true);
    };

    const openEditUserModal = (user: AppUser) => {
        setFormData({ name: user.name, email: user.email, role: user.role, password: '' });
        setEditingEmail(user.email); // Marca como edição deste email
        setErrorMsg(null);
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrorMsg(null);

        // Validação Básica
        if (!formData.name || !formData.email) {
            setErrorMsg("Preencha todos os campos obrigatórios.");
            setProcessing(false);
            return;
        }

        // Tenta criar/autenticar usuário no Supabase Auth SE houver senha
        if (formData.password) {
            if (formData.password.length < 6) {
                setErrorMsg("A senha deve ter no mínimo 6 caracteres.");
                setProcessing(false);
                return;
            }

            const authResult = await supabaseService.createAuthUser(formData.email, formData.password);

            if (!authResult.success) {
                // Se o erro for que já existe, continuamos para atualizar os dados da tabela (caso seja edição)
                // Se for erro critico, paramos.
                if (authResult.error?.toLowerCase().includes('already registered')) {
                    if (!editingEmail) {
                        // Se estamos criando UM NOVO e já existe, é erro.
                        setErrorMsg("Este e-mail já possui conta de acesso.");
                        setProcessing(false);
                        return;
                    }
                    // Se estamos EDITANDO, apenas avisamos que a senha não mudou.
                    // Silent continue or Alert? Vamos dar um toast/alert no final se der sucesso no DB.
                } else {
                    setErrorMsg("Erro ao definir senha: " + authResult.error);
                    setProcessing(false);
                    return;
                }
            } else {
                // Sucesso na criação Auth
            }
        }

        if (!editingEmail) {
            // --- MODO CRIAR ---
            if (!formData.email.includes('@goldenpr.com.br')) {
                setErrorMsg("O e-mail deve ser do domínio @goldenpr.com.br");
                setProcessing(false);
                return;
            }

            const result = await supabaseService.createUser({
                name: formData.name,
                email: formData.email,
                role: formData.role
            });

            if (result.success) {
                await loadUsers();
                setShowModal(false);
                if (formData.password) alert('Usuário e Acesso criados com sucesso!');
            } else {
                setErrorMsg(result.error || "Erro ao criar usuário na tabela.");
            }
        } else {
            // --- MODO EDITAR ---
            const result = await supabaseService.updateUser(editingEmail, {
                name: formData.name,
                role: formData.role
                // Não enviamos email novo, assumimos que email é chave fixa por segurança
            });

            if (result.success) {
                await loadUsers();
                setShowModal(false);
                if (formData.password) {
                    // Como não temos service_role, se o user já existia, o createAuthUser falhou (tratado acima) ou ignorou.
                    // Se ele NÃO existia (caso de user criado só no banco), ele foi criado agora.
                    alert('Dados atualizados. Se o usuário não tinha acesso, agora possui com a nova senha.');
                }
            } else {
                setErrorMsg(result.error || "Erro ao atualizar usuário.");
            }
        }

        setProcessing(false);
    };

    const handleDelete = async (email: string) => {
        if (email === currentUser?.email) {
            alert("Você não pode excluir sua própria conta.");
            return;
        }

        if (email === 'luciano@goldenpr.com.br') {
            alert("Este usuário mestre não pode ser excluído.");
            return;
        }

        if (!confirm(`Tem certeza que deseja remover o acesso de ${email}?`)) return;

        const result = await supabaseService.deleteUser(email);
        if (result.success) {
            await loadUsers();
        } else {
            alert("Erro ao excluir: " + result.error);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                        Gestão de Equipe
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Gerencie quem tem acesso ao sistema de pedidos.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold transition-colors"
                    >
                        Fechar
                    </button>
                    <button
                        onClick={openNewUserModal}
                        className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-lg shadow-amber-500/20 transition-transform active:scale-95 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Adicionar Membro
                    </button>
                </div>
            </div>

            {/* Grid de Usuários */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="p-4 py-5 text-xs font-black text-slate-500 uppercase tracking-widest pl-8">Nome / Email</th>
                                <th className="p-4 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Cargo</th>
                                <th className="p-4 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="p-4 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right pr-8">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">
                                        <div className="flex justify-center mb-2">
                                            <svg className="animate-spin h-6 w-6 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        </div>
                                        Carregando equipe...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">Nenhum membro encontrado.</td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.email} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-4 pl-8">
                                            <div className="font-bold text-slate-800 dark:text-slate-100 text-lg">{user.name}</div>
                                            <div className="text-sm text-slate-500 font-mono">{user.email}</div>
                                        </td>
                                        <td className="p-4">
                                            {user.role === 'admin' ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 uppercase">
                                                    Administrador
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black tracking-wide bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 uppercase">
                                                    Vendedor
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                                    Ativo
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right pr-8">
                                            <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                {/* EDIT BUTTON */}
                                                <button
                                                    onClick={() => openEditUserModal(user)}
                                                    className="p-2 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                    title="Editar Usuário"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>

                                                {/* DELETE BUTTON */}
                                                <button
                                                    onClick={() => handleDelete(user.email)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                                    title="Remover Acesso"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Criar/Editar Usuário */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-scaleIn">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingEmail ? 'Editar Usuário' : 'Novo Membro'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {errorMsg && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg font-medium">
                                    {errorMsg}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-800 dark:text-white"
                                    placeholder="Ex: João Silva"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">E-mail Corporativo</label>
                                <input
                                    type="email"
                                    className={`w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono text-sm text-slate-800 dark:text-white ${editingEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    placeholder="usuario@goldenpr.com.br"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!!editingEmail}
                                    title={editingEmail ? "Não é possível alterar o e-mail." : ""}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">
                                    {editingEmail ? "Definir Nova Senha de Acesso" : "Definir Senha de Acesso"}
                                </label>
                                <input
                                    type="password"
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono text-sm text-slate-800 dark:text-white"
                                    placeholder={editingEmail ? "Deixe em branco para manter a senha atual" : "Mínimo 6 caracteres"}
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingEmail} // Obrigatório se for criar novo
                                    minLength={6}
                                />
                                {editingEmail && <p className="text-[10px] text-slate-400 mt-1 ml-1">Preencha apenas se quiser gerar um novo acesso para este usuário.</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Cargo / Permissões</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'user' })}
                                        className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${formData.role === 'user' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 grayscale hover:grayscale-0'}`}
                                    >
                                        Vendedor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'admin' })}
                                        className={`p-3 rounded-lg border-2 text-sm font-bold transition-all ${formData.role === 'admin' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' : 'border-slate-200 dark:border-slate-700 text-slate-400 grayscale hover:grayscale-0'}`}
                                    >
                                        Admin
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-3 bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 font-bold rounded-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
                                >
                                    {processing ? 'Salvando...' : (editingEmail ? 'Salvar Alterações' : 'Adicionar Membro')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
