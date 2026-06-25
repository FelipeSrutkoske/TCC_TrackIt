// ============================================================
// MODAL COMPONENT
// ============================================================
// Modal acessível com animações de entrada/saída, backdrop,
// múltiplos tamanhos e suporte a conteúdo customizável.
//
// Como usar:
//   const [open, setOpen] = useState(false);
//
//   <Button onClick={() => setOpen(true)}>Abrir modal</Button>
//
//   <Modal
//     isOpen={open}
//     onClose={() => setOpen(false)}
//     title="Título do Modal"
//     description="Descrição opcional abaixo do título."
//     footer={
//       <>
//         <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
//         <Button variant="danger">Confirmar</Button>
//       </>
//     }
//   >
//     <p>Conteúdo do modal aqui</p>
//   </Modal>
//
// Props:
//   isOpen       — controla a visibilidade do modal
//   onClose      — função chamada ao fechar (ESC, backdrop, botão X)
//   title        — título do modal
//   description  — subtítulo/descrição abaixo do título (opcional)
//   size         — largura: "sm" | "md" | "lg" | "xl" | "full"
//   footer       — conteúdo do rodapé (geralmente botões)
//   closeOnBackdrop — fecha ao clicar no backdrop (padrão true)
//   showCloseButton — exibe o botão X (padrão true)
//   children     — corpo do modal
// ============================================================

"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// ── Tipos das props ──────────────────────────────────────────
type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  size?: ModalSize;
  footer?: React.ReactNode;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  children?: React.ReactNode;
}

// ── Mapeamento de tamanhos ───────────────────────────────────
const sizeStyles: Record<ModalSize, string> = {
  sm:   "max-w-sm",
  md:   "max-w-md",
  lg:   "max-w-lg",
  xl:   "max-w-xl",
  full: "max-w-[95vw]",
};

// ── Ícone ✕ ─────────────────────────────────────────────────
function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  );
}

// ── Componente Principal ─────────────────────────────────────
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  size = "md",
  footer,
  closeOnBackdrop = true,
  showCloseButton = true,
  children,
}: ModalProps) {
  // Ref para o container do modal — usado para gerenciar foco
  const modalRef = useRef<HTMLDivElement>(null);

  // ── Efeito: fechar com a tecla ESC ───────────────────────
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // ── Efeito: trava o scroll do body quando o modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // ── Efeito: foca o modal ao abrir (acessibilidade) ────────
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  // Não renderiza nada quando fechado
  if (!isOpen) return null;

  // ── Renderiza via portal para evitar problemas de z-index ─
  // O modal é inserido diretamente no <body> usando createPortal
  return createPortal(
    // Backdrop (fundo escurecido)
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      className="
        fixed inset-0 z-50 flex items-center justify-center p-4
        animate-in fade-in duration-200
      "
    >
      {/* ── Fundo escurecido (backdrop) ──────────────────── */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* ── Painel do modal ──────────────────────────────── */}
      {/*
        A animação de entrada usa as classes do Tailwind:
        - animate-in: ativa a animação
        - fade-in: opacidade 0 → 1
        - zoom-in-95: escala 95% → 100%
        - slide-in-from-bottom-4: sobe 16px ao entrar
      */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative w-full ${sizeStyles[size]}
          bg-[#fbfdf8] border border-[#c8d7c0] rounded-2xl shadow-2xl
          flex flex-col max-h-[90vh]
          animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200
          focus:outline-none
        `}
      >
        {/* ── Cabeçalho ──────────────────────────────────── */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-5 border-b border-[#c8d7c0] flex-shrink-0">
            <div>
              {title && (
                <h2 id="modal-title" className="text-[#18231c] font-semibold text-lg leading-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-[#5d6f63]">{description}</p>
              )}
            </div>

            {/* Botão de fechar (✕) */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-4 flex-shrink-0 p-1 rounded-lg text-[#5d6f63] hover:text-[#18231c] hover:bg-[#e0eadd] transition-colors"
                aria-label="Fechar modal"
              >
                <CloseIcon />
              </button>
            )}
          </div>
        )}

        {/* ── Corpo (scrollável se o conteúdo for longo) ─── */}
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>

        {/* ── Rodapé com botões de ação ──────────────────── */}
        {footer && (
          <div className="flex items-center justify-end gap-2 p-4 border-t border-[#c8d7c0] flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    // Alvo do portal — monta no <body> para garantir z-index correto
    document.body
  );
}
