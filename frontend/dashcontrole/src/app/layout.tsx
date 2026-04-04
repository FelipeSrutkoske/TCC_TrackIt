import "./globals.css";
import { Sidebar } from "./components/Sidebar";
import { ToastProvider } from "../contexts/ToastContext";

export const metadata = {
  title: "TrackIt",
  description: "Sistema de Gerenciamento de Rotas e Entregas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full text-zinc-900 antialiased">

        {/* Sidebar fixa na esquerda */}
        <Sidebar />

        {/* Área principal — ocupa o espaço restante após a sidebar */}
        <div className="with-sidebar-offset h-screen overflow-hidden flex flex-col transition-all duration-300 bg-[#1f2320]">

          {/* Wrapper com padding para dar a moldura */}
          <div className="flex flex-col flex-1 sm:p-3 md:p-4 min-h-0">

            {/*
              Container principal — a "moldura branca".
              Flex column com altura total disponível.
              Header fica sticky no topo via CSS.
              O scroll acontece só no page-body (div filho de cada página).
            */}
            <div className="route-frame flex flex-col flex-1 min-h-0">
              <ToastProvider>
                {/*
                  `children` renderiza cada página.
                  Cada página tem:
                    - <Header /> com sticky top-0
                    - <div className="page-body"> com o conteúdo scrollável
                */}
                {children}
              </ToastProvider>

              {/* Footer fixo fora do scroll, mas DENTRO da moldura visual */}
              <footer className="shrink-0 px-6 py-3 flex justify-between items-center text-[10px] text-[#6f786d] uppercase tracking-widest font-medium bg-[var(--surface-2)] border-t border-[var(--border)] rounded-b-xl">
                <span>© 2026 Sistema TrackIt • Logística com Entregadores e Colaboradores</span>
                <span>Versão 1.0.0-Beta</span>
              </footer>

            </div>
          </div>

        </div>

      </body>
    </html>
  );
}
