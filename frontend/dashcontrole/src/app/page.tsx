import { Header } from "./components/Header";

export default function Home() {
  return (
    <>
      {/* Header comum do sistema */}
      <Header
        title="Visão Geral de Operações"
        breadcrumb={["Home", "Operações"]}
        userName="João Silva"
      />

      {/*
        Home de protótipo:
        - Estrutura em blocos empresariais (cards)
        - Dados estáticos para visual inicial
        - Responsivo para desktop e mobile
      */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Bloco de abertura */}
        <section className="rounded-2xl border border-[#c8cec8] bg-[linear-gradient(135deg,#f2f5f2_0%,#e8eee8_100%)] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-[#6f786d] font-bold">
                Painel de Operações
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl text-[#1f2320] font-bold leading-tight">
                Gestão de Frota e Colaboradores
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5f695d]">
                Visão rápida da operação diária, acompanhamento de despachos e 
                certificação de entregas validadas com <span className="font-semibold text-[#3e523a]">registro na maquininha (POS)</span>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full xl:w-auto mt-4 xl:mt-0">
              <div className="rounded-xl border border-[#bfc6bf] bg-white/80 px-4 py-3 shadow-sm flex flex-col justify-center">
                <p className="text-[11px] uppercase tracking-wider text-[#758172] font-semibold">Data</p>
                <p className="text-sm font-bold text-[#253126]">22 Mar 2026</p>
              </div>
              <div className="rounded-xl border border-[#bfc6bf] bg-white/80 px-4 py-3 shadow-sm flex flex-col justify-center">
                <p className="text-[11px] uppercase tracking-wider text-[#758172] font-semibold">Turno</p>
                <p className="text-sm font-bold text-[#253126]">Manhã</p>
              </div>
            </div>
          </div>
        </section>

        {/* Indicadores principais */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: "Entregas do dia", value: "148", detail: "+12 em relação a ontem" },
            { label: "Baixadas na Maquininha", value: "123", detail: "83% do total de entregas" },
            { label: "Colaboradores em Rota", value: "18", detail: "3 aguardando pedidos" },
            { label: "Ocorrências", value: "4", detail: "Menos de 3% das entregas" },
          ].map((item) => (
            <article key={item.label} className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm transition-all hover:shadow-md hover:border-[#a8b3a7]">
              <p className="text-[13px] font-bold uppercase tracking-wider text-[#748071]">{item.label}</p>
              <p className="mt-3 text-4xl font-bold text-[#1f2320] tracking-tight">{item.value}</p>
              <p className="mt-2 text-xs font-medium text-[#667062]">{item.detail}</p>
            </article>
          ))}
        </section>

        {/* Linha com prioridades e atividades */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <article className="lg:col-span-2 rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#e1e6e1] pb-4 mb-4">
              <h3 className="text-lg font-bold text-[#1f2320]">Prioridades do dia</h3>
              <span className="rounded-full border border-[#9eb198] bg-[#dfe8dc] px-3 py-1.5 text-[11px] uppercase tracking-wider text-[#3f533b] font-bold shadow-sm">
                Operação ativa
              </span>
            </div>

            <div className="space-y-3">
              {[
                {
                  title: "Verificar extratos da maquininha",
                  context: "2 colaboradores pendentes de validação de entregas no retorno",
                  status: "Alta",
                },
                {
                  title: "Enviar maquina do colaborador para manutenção",
                  context: "Colaborador João com problema na maquininha",
                  status: "Alta",
                },
                {
                  title: "Auditoria de registros de entrega",
                  context: "Bater o relatório de confirmações na POS das entregas da noite anterior",
                  status: "Baixa",
                },
              ].map((task) => (
                <div key={task.title} className="rounded-xl border border-[#d3d8d3] bg-white p-4 flex items-start justify-between gap-4 shadow-sm hover:border-[#b8c2b7] transition-colors">
                  <div>
                    <p className="text-[15px] font-bold text-[#2b3429] mb-1">{task.title}</p>
                    <p className="text-[13px] text-[#677063] leading-relaxed">{task.context}</p>
                  </div>
                  <span className={`text-[11px] uppercase tracking-wider font-bold bg-[#e6ece5] border border-[#c4d0c1] rounded-md px-2.5 py-1.5 shadow-sm
                    ${task.status === 'Alta' ? 'text-[#8c3a3a] bg-[#faeaea] border-[#e8c8c8]' : 
                      task.status === 'Média' ? 'text-[#876527] bg-[#fdf6e7] border-[#eedeba]' : 
                      'text-[#4f654b] bg-[#e6ece5] border-[#c4d0c1]'}`}>
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-6 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-[#1f2320] border-b border-[#e1e6e1] pb-4 mb-5">Atividade recente</h3>
            <ul className="space-y-5 flex-1">
              {[
                "João Colaborador confirmou a entrega #3409 via maquininha POS.",
                "Pedro Entregador iniciou a rota de 5 pedidos na Zona Norte.",
                "Ocorrência registrada: Cliente ausente na Entrega #3412.",
                "Validação diária de maquininhas da equipe tarde concluída.",
              ].map((event, i) => (
                <li key={i} className="text-sm text-[#4f584d] leading-relaxed border-l-[3px] border-[#8a9988] pl-4 relative">
                  <span className="absolute -left-[7px] top-1.5 w-2.5 h-2.5 bg-[#8a9988] rounded-full border-2 border-[#f8faf8]"></span>
                  {event}
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </>
  );
}
