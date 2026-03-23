import "./globals.css";
import { Sidebar } from "./components/Sidebar";

export const metadata = {
  title: "DashControle",
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

        {/* 
          1. Sidebar fixa:
          Controla a largura do conteúdo via CSS Variable --sidebar-width
        */}
        <Sidebar />

        {/* 
          2. Área principal de conteúdo:
          Usa o padding-left dinâmico para não sobrepor a sidebar.
        */}
        <div className="with-sidebar-offset min-h-screen flex flex-col transition-all duration-300 bg-[#1f2320]">
          
          {/* 
            3. O "Container" do TCC:
            Envolve toda a página dentro de uma moldura,
            dando o aspecto de bloco empresarial.
          */}
          <div className="flex flex-1 flex-col overflow-hidden sm:p-3 md:p-4">
            <div className="route-frame flex-1 overflow-y-auto sm:rounded-3xl rounded-none shadow-2xl relative bg-[var(--background)]">
              {/* O conteúdo das páginas (children) será renderizado aqui dentro */}
              {children}
            
              {/* Rodapé discreto dentro do container no final */}
              <footer className="mt-8 mb-4 px-6 flex justify-between items-center text-[10px] text-[#6f786d] uppercase tracking-widest font-medium">
                <span>© 2026 Sistema DashControle • Logística com Entregadores e Colaboradores</span>
                <span>Versão 1.0.0-Beta</span>
              </footer>
            </div>
          </div>

        </div>

      </body>
    </html>
  );
}
