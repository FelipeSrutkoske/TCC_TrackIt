"use client";

import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { authService } from "@/services/auth.service";
import { usersService } from "@/services/users.service";
import { useRouter } from "next/navigation";

export default function PerfilPage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estado inicial do usuário logado
  const [user, setUser] = useState({
    id: 0,
    nome: "",
    email: "",
    senha: "", // Nunca exibida real
    tipoUsuario: "DASHBOARD",
    ativo: true,
    dataCriacao: new Date().toISOString()
  });

  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const currentUser = authService.getUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }
        
        // Busca os dados detalhados da API
        const userData = await usersService.getById(currentUser.id);
        setUser({
          id: userData.id,
          nome: userData.nome,
          email: userData.email,
          senha: "", // a senha sempre vem vazia na view
          tipoUsuario: userData.tipoUsuario,
          ativo: userData.ativo !== false, // Trata possíveis nulos do sqlite/mysql boolean
          dataCriacao: userData.data_criacao || new Date().toISOString()
        });
      } catch (error) {
        console.error("Erro ao carregar os dados:", error);
      } finally {
        setLoading(false);
      }
    };
    
    carregarUsuario();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToUpdate: Record<string, string> = {
        nome: user.nome,
        email: user.email,
        tipoUsuario: user.tipoUsuario, // Administradores podem atualizar via interface, mockamos isso
      };
      
      if (user.senha.trim() !== "") {
        dataToUpdate.senha = user.senha;
      }
      
      await usersService.update(user.id, dataToUpdate);
      setIsEditing(false);
      setUser(prev => ({ ...prev, senha: "" }));
      alert("Dados atualizados com sucesso!");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao salvar perfil.";
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1f2320]">
         <div className="animate-spin text-[#4f654b] text-4xl">
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
         </div>
      </div>
    );
  }

  return (
    <>
      <Header title="Meu Perfil" breadcrumb={["Home", "Perfil"]} />
      
      <div className="page-body">
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">

          {/* Banner do Perfil */}
          <section className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-6 shadow-sm flex items-center gap-6">
            <div className="w-20 h-20 bg-[#4f654b] rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-inner flex-shrink-0">
              {user.nome.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1f2320]">{user.nome}</h2>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-sm text-[#5f695d] flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {user.email}
                </span>
                <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#4f654b]/10 text-[#4f654b] border border-[#4f654b]/20">
                  {user.tipoUsuario}
                </span>
                {user.ativo && (
                  <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                    Ativo
                  </span>
                )}
              </div>
            </div>
            <div className="ml-auto">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${isEditing ? 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300' : 'bg-[#4f654b] text-white hover:bg-[#3e523a]'}`}
              >
                {isEditing ? "Cancelar Edição" : "✏️ Editar Dados"}
              </button>
            </div>
          </section>

          {/* Formulário de Edição */}
          <section className="rounded-2xl border border-[#c8cec8] bg-white p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-[#1f2320] mb-6 border-b border-[#e3e8e3] pb-4">
              Informações da Conta
            </h3>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Nome */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5f695d]">Nome Completo</label>
                  <input 
                    type="text" 
                    value={user.nome}
                    onChange={(e) => setUser({...user, nome: e.target.value})}
                    disabled={!isEditing}
                    className="w-full bg-[#f6f7f5] border border-[#c8cec8] disabled:opacity-60 rounded-xl px-4 py-2.5 text-sm text-[#1f2320] focus:outline-none focus:border-[#4f654b] focus:ring-1 focus:ring-[#4f654b] transition-all"
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5f695d]">Endereço de E-mail</label>
                  <input 
                    type="email" 
                    value={user.email}
                    onChange={(e) => setUser({...user, email: e.target.value})}
                    disabled={!isEditing}
                    className="w-full bg-[#f6f7f5] border border-[#c8cec8] disabled:opacity-60 rounded-xl px-4 py-2.5 text-sm text-[#1f2320] focus:outline-none focus:border-[#4f654b] transition-all"
                    required
                  />
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5f695d]">Senha de Acesso</label>
                  <input 
                    type={isEditing ? "text" : "password"} // Mostra em texto se editando para poder alterar mais facil
                    value={user.senha}
                    onChange={(e) => setUser({...user, senha: e.target.value})}
                    disabled={!isEditing}
                    placeholder="Nova senha"
                    className="w-full bg-[#f6f7f5] border border-[#c8cec8] disabled:opacity-60 rounded-xl px-4 py-2.5 text-sm text-[#1f2320] focus:outline-none focus:border-[#4f654b] transition-all"
                  />
                  {isEditing && <p className="text-[10px] text-[#8a9488]">Deixe em branco para manter a atual.</p>}
                </div>

                {/* Tipo de Usuário (Somente Leitura neste contexto a menos que ADMIN) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#5f695d]">Nível de Acesso (Tipo)</label>
                  <select 
                    value={user.tipoUsuario}
                    onChange={(e) => setUser({...user, tipoUsuario: e.target.value})}
                    disabled={true} // Travado para não mudar próprio nível acidentalmente
                    className="w-full bg-[#f6f7f5] border border-[#c8cec8] opacity-70 cursor-not-allowed rounded-xl px-4 py-2.5 text-sm text-[#1f2320] focus:outline-none"
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="DASHBOARD">Dashboard</option>
                    <option value="MOTORISTA">Motorista</option>
                  </select>
                </div>

              </div>
              
              {/* Informações Readonly Adicionais */}
              <div className="pt-4 border-t border-[#e3e8e3] flex flex-wrap gap-8">
                 <div>
                    <p className="text-[10px] items-center gap-1 font-bold uppercase tracking-wider text-[#8a9488] mb-1">Status da Conta</p>
                    <p className="text-sm font-medium text-[#1f2320] flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${user.ativo ? 'bg-green-500' : 'bg-red-500'}`}></span>
                       {user.ativo ? "Ativa" : "Desativada"}
                    </p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#8a9488] mb-1">Membro desde</p>
                    <p className="text-sm font-medium text-[#1f2320]">
                       {new Date(user.dataCriacao).toLocaleDateString('pt-BR')}
                    </p>
                 </div>
              </div>

              {/* Ações */}
              {isEditing && (
                <div className="pt-6 flex justify-end">
                  <button 
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#4f654b] text-white hover:bg-[#3e523a] transition-all shadow-sm hover:shadow-md"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg> Salvar Alterações
                  </button>
                </div>
              )}

            </form>
          </section>

        </div>
      </div>
    </>
  );
}
