"use client";

import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { authService } from "@/services/auth.service";
import { usersService } from "@/services/users.service";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";

export default function LoginPage() {
  const [isLoginFlow, setIsLoginFlow] = useState(true);
  const { addToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.push("/");
    }
  }, [router]);
  
  // States para o form
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("DASHBOARD");

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLoginFlow) {
        await authService.login({ email, senha });
        addToast("Acesso autorizado! Redirecionando...", "success");
        router.push("/");
      } else {
        await usersService.create({ 
          nome, 
          email, 
          senha, 
          tipoUsuario: tipo as "ADMIN" | "DASHBOARD" | "MOTORISTA" 
        });
        addToast("Usuário criado com sucesso. Faça seu login.", "success");
        setIsLoginFlow(true);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro inesperado.";
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Autenticação" breadcrumb={["TrackIt", "Login"]} />
      
      <div className="page-body bg-[#1f2320] flex items-center justify-center p-4">
        {/* Usamos esse background escuro interno na página inteira só de charme */}
        
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#c8cec8]">
           
           {/* Header do Card */}
           <div className="bg-[#f6f7f5] p-8 border-b border-[#e3e8e3] text-center space-y-2">
             <div className="w-14 h-14 bg-[#4f654b] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl shadow-inner">
               T
             </div>
             <h2 className="text-2xl font-bold text-[#1f2320]">
               {isLoginFlow ? "Bem-vindo ao TrackIt" : "Criar nova conta"}
             </h2>
             <p className="text-sm text-[#5f695d]">
               {isLoginFlow ? "Acesse o painel de operações." : "Cadastre-se no TrackIt."}
             </p>
           </div>

           {/* Corpo do Form */}
           <div className="p-8">
             <form onSubmit={handleSubmit} className="space-y-4">
                
                {!isLoginFlow && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#5f695d]">Nome Completo</label>
                    <input 
                      type="text" required value={nome} onChange={e => setNome(e.target.value)}
                      placeholder="Ex: João da Silva"
                      className="w-full bg-[#f6f7f5] border border-[#c8cec8] rounded-xl px-4 py-2.5 text-sm focus:border-[#4f654b] focus:outline-none transition-all" 
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#5f695d]">E-mail</label>
                  <input 
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="E-mail"
                    className="w-full bg-[#f6f7f5] border border-[#c8cec8] rounded-xl px-4 py-2.5 text-sm focus:border-[#4f654b] focus:outline-none transition-all" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#5f695d]">Senha</label>
                  <input 
                    type="password" required value={senha} onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#f6f7f5] border border-[#c8cec8] rounded-xl px-4 py-2.5 text-sm focus:border-[#4f654b] focus:outline-none transition-all" 
                  />
                </div>

                {!isLoginFlow && (
                  <div className="space-y-1 pt-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#5f695d]">Tipo de Acesso</label>
                    <select 
                      value={tipo} onChange={e => setTipo(e.target.value)}
                      className="w-full bg-[#f6f7f5] border border-[#c8cec8] rounded-xl px-4 py-2.5 text-sm focus:border-[#4f654b] focus:outline-none transition-all"
                    >
                      <option value="DASHBOARD">Dashboard (Operador)</option>
                      <option value="MOTORISTA">Motorista (App)</option>
                      <option value="ADMIN">Administrador Geral</option>
                    </select>
                  </div>
                )}

                <div className="pt-6">
                  <button disabled={loading} type="submit" className="w-full py-3 rounded-xl bg-[#4f654b] hover:bg-[#3e523a] disabled:opacity-70 text-white font-bold text-sm transition-all shadow-md">
                    {loading ? "Processando..." : (isLoginFlow ? "Entrar Seguramente" : "Registrar Usuário")}
                  </button>
                </div>
             </form>

             <div className="mt-6 text-center">
               <button 
                 type="button" 
                 onClick={() => setIsLoginFlow(!isLoginFlow)}
                 className="text-[#4f654b] font-semibold text-sm hover:underline"
               >
                 {isLoginFlow ? "Ainda não tem conta? Crie agora." : "Já possui cadastro? Fazer login."}
               </button>
             </div>

           </div>
        </div>
      </div>
    </>
  );
}
