// ============================================================
// HEADER COMPONENT
// ============================================================
// Barra superior da aplicação. Exibe o título da página atual,
// um breadcrumb opcional, uma área de ações (botões, etc.)
// e um avatar de usuário.
//
// Como usar:
//   <Header
//     title="Dashboard"
//     breadcrumb={["Home", "Dashboard"]}
//     actions={<Button>Nova transação</Button>}
//   />
//
// Props:
//   title      — título principal exibido no header
//   breadcrumb — array de strings que forma o caminho (opcional)
//   actions    — qualquer ReactNode para colocar no lado direito (opcional)
//   userName   — nome do usuário logado (opcional, padrão "Usuário")
//   userAvatar — URL da foto do avatar (opcional)
// ============================================================

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authService } from "@/services/auth.service";

interface HeaderProps {
  title: string;
  breadcrumb?: string[];
  actions?: React.ReactNode;
  userAvatar?: string;
}

export function Header({
  title,
  breadcrumb,
  actions,
  userAvatar,
}: HeaderProps) {
  // Estado que controla a abertura do menu dropdown do avatar
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Carregando...");

  useEffect(() => {
    void Promise.resolve().then(() => {
      const user = authService.getUser();
      setUserName(user?.nome || "Visitante");
    });
  }, []);

  // Gera as iniciais do usuário para o avatar fallback (ex: "João Silva" → "JS")
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-[rgba(246,247,245,0.9)] backdrop-blur-sm border-b border-[#c8cec8] rounded-t-xl">

      {/* ── Lado esquerdo: título e breadcrumb ────────────── */}
      <div className="flex flex-col justify-center">

        {/* Breadcrumb — só renderiza se a prop for passada */}
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1 mb-0.5">
            {breadcrumb.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1">
                {/* Separador entre itens */}
                {index > 0 && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-[#8a9488]">
                    <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
                  </svg>
                )}
                <span
                  className={`text-xs ${
                    index === breadcrumb.length - 1
                      ? "text-[#63705f]" // último item é o atual
                      : "text-[#8a9488] hover:text-[#4f654b] cursor-pointer transition-colors"
                  }`}
                >
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        )}

        {/* Título da página */}
        <h1 className="text-[#1f2320] font-semibold text-lg leading-tight">{title}</h1>
      </div>

      {/* ── Lado direito: ações customizadas + avatar ─────── */}
      <div className="flex items-center gap-4">

        {/* Slot de ações — renderiza qualquer conteúdo passado via prop */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Divisor visual (só aparece se tiver ações) */}
        {actions && <div className="w-px h-6 bg-[#c8cec8]" />}

        {/* ── Avatar com dropdown ──────────────────────────── */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2.5 group"
          >
            {/* Avatar: foto ou iniciais */}
            <div className="w-8 h-8 rounded-full bg-[#4d6a2f] flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-[#7a9163] transition-all">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">{initials}</span>
              )}
            </div>

            {/* Nome do usuário */}
            <span className="text-sm text-[#566053] group-hover:text-[#1f2320] transition-colors hidden sm:block">
              {userName}
            </span>

            {/* Seta */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`w-4 h-4 text-[#8a9488] transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
            >
              <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Menu dropdown do avatar */}
          {isMenuOpen && (
            <>
              {/* Overlay invisível para fechar o menu ao clicar fora */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsMenuOpen(false)}
              />

              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#f6f7f5] border border-[#c8cec8] shadow-xl z-50 py-1 overflow-hidden">
                {/* Informação do usuário no topo do dropdown */}
                <div className="px-3 py-2 border-b border-[#d8ddd8] mb-1">
                  <p className="text-[#1f2320] text-sm font-medium truncate">{userName}</p>
                  <p className="text-[#8a9488] text-xs">Conta</p>
                </div>

                {/* Itens do menu */}
                <Link
                  href="/perfil"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#566053] hover:bg-[#e7ece7] hover:text-[#1f2320] transition-colors text-left"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Perfil
                </Link>
                <Link
                  href="/configuracoes"
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#566053] hover:bg-[#e7ece7] hover:text-[#1f2320] transition-colors text-left"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span>⚙️</span> Configurações
                </Link>

                <div className="border-t border-[#d8ddd8] mt-1 pt-1">
                  <button
                    onClick={() => {
                      authService.logout();
                      setIsMenuOpen(false);
                      window.location.href = "/login";
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors text-left"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
