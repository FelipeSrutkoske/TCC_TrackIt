// ============================================================
// SIDEBAR COMPONENT
// ============================================================
// Barra de navegação lateral com suporte a colapso.
// Usa "use client" pois precisa de estado interativo (useState).
//
// Como usar:
//   <Sidebar />
//
// Para adicionar novos itens de menu, edite o array `navItems`
// no início do componente.
// ============================================================

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ── Ícone simples usando SVG inline ─────────────────────────
// Cada item do menu tem: href, label e um ícone SVG
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

// ── Lista de itens de navegação ──────────────────────────────
// Adicione ou remova rotas aqui para atualizar o menu
const navItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
        <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198c.03-.028.061-.056.091-.086L12 5.43z" />
      </svg>
    ),
  },
  {
    href: "/entregas",
    label: "Entregas",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875H5.625a1.875 1.875 0 001.875-1.875V17.25h1.5v.375c0 1.035.84 1.875 1.875 1.875h1.5A1.875 1.875 0 0014.25 17.625V15h-.75z" />
        <path d="M8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
      </svg>
    ),
  },
  {
    href: "/ocorrencias",
    label: "Ocorrências",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M9.401 3.003c1.155-2.001 4.043-2.001 5.198 0l7.355 12.745c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.753-2.5-2.599-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/empresas",
    label: "Empresas",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M3 3.75A.75.75 0 013.75 3h16.5a.75.75 0 01.75.75v16.5a.75.75 0 01-.75.75h-16.5A.75.75 0 013 20.25V3.75zm3 3A.75.75 0 016.75 6h2.5a.75.75 0 010 1.5h-2.5A.75.75 0 016 6.75zm0 4A.75.75 0 016.75 10h2.5a.75.75 0 010 1.5h-2.5A.75.75 0 016 10.75zm.75 3.25a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5zM13.5 6.75a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zm.75 3.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3zm-.75 4.75a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/alertas",
    label: "Alertas",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M10.5 6a1.5 1.5 0 113 0v5.25a1.5 1.5 0 01-3 0V6z" />
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75S6.615 21.75 12 21.75s9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 15a1.125 1.125 0 100 2.25A1.125 1.125 0 0012 15z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/sobre",
    label: "Sobre",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    href: "/componentes",
    label: "Componentes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 01.878.645 49.17 49.17 0 01.376 5.452.657.657 0 01-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 00-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.224.600.531a49.37 49.37 0 01.376 5.452.75.75 0 01-.059.297C20.963 20.862 19.47 22.5 17.25 22.5c-2.25 0-3-.622-3-1.875 0-1.036-1.007-1.875-2.25-1.875S9.75 19.589 9.75 20.625c0 1.253-.75 1.875-3 1.875-2.22 0-3.713-1.638-3.713-3.75v-.001a49.37 49.37 0 01.376-5.45c.043-.308.29-.532.6-.532.355 0 .676.186.96.401.29.221.634.349 1.003.349 1.035 0 1.875-1.007 1.875-2.25s-.84-2.25-1.875-2.25c-.37 0-.713.128-1.003.349-.284.215-.605.401-.96.401a.657.657 0 01-.66-.664c.011-1.83.137-3.636.376-5.452a.75.75 0 01.878-.645c1.843.334 3.722.562 5.632.676.332.02.61-.246.61-.578z" />
      </svg>
    ),
  },
  {
    href: "/login",
    label: "Login",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clipRule="evenodd" />
      </svg>
    ),
  },
];


// ── Componente Principal ─────────────────────────────────────
export function Sidebar() {
  // Estado que controla se a sidebar está expandida ou recolhida
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Hook do Next.js que retorna a rota atual para marcar o item ativo
  const pathname = usePathname();

  // ── Sincroniza a largura da sidebar como CSS variable no :root ───
  // Isso permite que layout.tsx use padding-left: var(--sidebar-width)
  // e anime suavemente junto com a sidebar sem precisar de Context API
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      isCollapsed ? "72px" : "240px"
    );
  }, [isCollapsed]);

  return (
    <aside
      className={`
        fixed top-0 left-0 z-40
        hidden md:flex flex-col h-screen overflow-y-auto
        bg-[#1f2320] border-r border-[#384138]
        transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-[72px]" : "w-[240px]"}
      `}
    >
      {/* ── Cabeçalho / Branding ─────────────────────────── */}
      <div className="flex items-center h-16 px-5 border-b border-[#384138] overflow-hidden">
        {/*
          Removido o logo roxo chamativo.
          Mantido apenas um indicador discreto ou apenas o texto.
        */}
        <div className="flex-shrink-0 w-2 h-6 bg-[#4d6a2f] rounded-full mr-3" />

        {/* Nome do app em branco/cinza claro — visual mais empresarial */}
        <span
          className={`
            font-bold text-zinc-100 text-sm tracking-widest uppercase whitespace-nowrap
            transition-all duration-200
            ${isCollapsed ? "opacity-0 w-0" : "opacity-100"}
          `}
        >
          TrackIt
        </span>
      </div>

      {/* ── Itens de Navegação ────────────────────────────── */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
        {navItems.map((item) => {
          // Verifica se este item é a rota atual para aplicar o estilo ativo
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined} // tooltip ao passar o mouse quando collapsed
              className={`
                flex items-center rounded-lg
                text-sm font-medium whitespace-nowrap
                transition-all duration-150 group
                ${isActive
                  // Verde militar sóbrio para o item ativo
                  ? "bg-[#4d6a2f]/15 text-[#a8bc94] border border-[#4d6a2f]/20"
                   : "text-[#b7beb6] hover:bg-[#2a302a] hover:text-white"
                }
                ${isCollapsed
                  // Collapsed: quadrado simétrico, sem gap, sem padding lateral assimétrico
                  // w-10 h-10 garante o mesmo espaço em todos os lados, mx-auto centraliza no eixo X
                  ? "w-10 h-10 justify-center mx-auto gap-0 p-0"
                  // Expandido: layout normal com padding e gap entre ícone e label
                  : "gap-3 px-2 py-2.5"
                }
              `}
            >
              {/* Ícone do item — a cor muda conforme ativo/inativo */}
              <span className={`flex-shrink-0 ${isActive ? "text-[#a8bc94]" : "text-[#879186] group-hover:text-white"}`}>
                {item.icon}
              </span>

              {/* Label — usa hidden (display:none) ao colapsar para não deixar resíduo de largura */}
              {!isCollapsed && (
                <span className="transition-all duration-200">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Botão de Colapso ──────────────────────────────── */}
      {/* Fica no rodapé da sidebar */}
      <div className={`pb-4 border-t border-[#384138] pt-4 ${isCollapsed ? "px-0 flex justify-center" : "px-2"}`}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          className={`
            flex items-center rounded-lg
            text-[#b7beb6] hover:bg-[#2a302a] hover:text-white
            transition-all duration-150 text-sm font-medium
            ${isCollapsed
              // Collapsed: mesmo padrão dos itens de nav — quadrado centralizado
              ? "w-10 h-10 justify-center p-0"
              // Expandido: largura total com padding e gap normais
              : "gap-3 w-full px-2 py-2.5"
            }
          `}
        >
          {/* Ícone de seta — rotaciona 180° quando collapsed para indicar "expandir" */}
          <span className={`flex-shrink-0 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
            </svg>
          </span>

          {/* Texto — usa renderização condicional (não w-0) para evitar resíduo de espaço */}
          {!isCollapsed && (
            <span className="whitespace-nowrap">Recolher menu</span>
          )}
        </button>
      </div>
    </aside>
  );
}
