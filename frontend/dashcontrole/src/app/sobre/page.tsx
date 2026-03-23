import { Header } from "../components/Header";

export default function Sobre() {
  return (
    <>
      <Header
        title="Sobre o Sistema"
        breadcrumb={["Home", "Sobre"]}
        userName="João Silva"
      />

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
        
        <section className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-6 sm:p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-[#1f2320] mb-4">
            Projeto de Conclusão de Curso (TCC)
          </h2>
          <div className="space-y-4 text-[15px] leading-relaxed text-[#4f584d]">
            <p>
              O <strong>DashControle</strong> é uma plataforma logística desenvolvida com foco no rastreamento e
              certificação de entregas utilizando uma abordagem inovadora: a integração com{" "}
              <strong className="text-[#3e523a]">maquininhas POS (Point of Sale)</strong>.
            </p>
            <p>
              Diferente de sistemas convencionais onde o colaborador apenas assinala a entrega no aplicativo de celular,
              este sistema utiliza o terminal POS não para realizar transações financeiras, mas sim
              como uma ferramenta de auditoria e <strong>garantia de entrega</strong> altamente confiável.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-[#c8cec8] bg-white p-6 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#f2f5f2] border border-[#d3d8d3] flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#4f654b]">
                <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198c.03-.028.061-.056.091-.086L12 5.43z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#1f2320] mb-2">Objetivo do Sistema</h3>
            <p className="text-sm text-[#5f695d] leading-relaxed">
              Reduzir perdas, extravios e fraudes durante a ponta final da logística (last-mile delivery). 
              A maquininha gera um log com GPS, horário preciso e criptografia do hardware para validar que
              o colaborador encontrou o destinatário no local correto.
            </p>
          </section>

          <section className="rounded-2xl border border-[#c8cec8] bg-white p-6 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-[#faeaea] border border-[#e8c8c8] flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#8c3a3a]">
                <path fillRule="evenodd" d="M11.484 2.17a.75.75 0 011.032 0 11.209 11.209 0 007.877 3.08.75.75 0 01.722.515 12.74 12.74 0 01.222 2.365c0 5.474-3.551 10.155-8.835 12.001-.448.157-.962.157-1.41 0-5.284-1.846-8.835-6.527-8.835-12.001 0-.8.079-1.583.222-2.365a.75.75 0 01.722-.515 11.21 11.21 0 007.877-3.08zM12 11.625a1.875 1.875 0 100-3.75 1.875 1.875 0 000 3.75z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[#1f2320] mb-2">Sem Transação Financeira</h3>
            <p className="text-sm text-[#5f695d] leading-relaxed">
              Importante destacar que as entregas validadas pela máquina não configuram transações financeiras.
              Não há cobrança ao cliente; apenas o uso da infraestrutura segura do terminal (POS) como 
              comprovante irreversível de entrega.
            </p>
          </section>
        </div>

      </div>
    </>
  );
}
