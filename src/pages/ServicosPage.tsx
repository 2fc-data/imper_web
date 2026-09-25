import { AnimatePresence, m, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { WhatsAppIconButton } from '../components/landing/SocialIconButtons';
import { fadeUp, stagger, VIEWPORT } from '../lib/motion';
import { useServicos } from '../lib/useServicos';
import { cn } from '../lib/utils';

export default function ServicosPage() {
  const { servicos, loading, error, retry } = useServicos();
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, VIEWPORT);
  const [openId, setOpenId] = useState<number | null>(null);

  function toggleAccordion(id: number) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <section id="servicos" className="py-12 my-16 sm:py-16 sm:my-24">
      <div className="mx-auto w-full max-w-[1400px] px-4">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl font-serif text-foreground">
          Nossas especialidades
        </h2>
        <p className="mt-2 text-muted-foreground">
          Soluções de engenharia para cada tipo de exposição à água e à umidade.
          Clique em um serviço para ver os detalhes.
        </p>

        <m.div
          ref={gridRef}
          className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          variants={stagger()}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {loading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col h-full rounded-xl border bg-card p-5 shadow-sm min-h-[88px]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-primary/20" />
                  <div className="h-5 w-1/3 animate-pulse rounded bg-primary/20" />
                </div>
              </div>
            ))}
          {!loading && error && (
            <div className="col-span-full text-center">
              <p className="text-sm text-destructive">{error}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-2 text-sm text-primary underline underline-offset-2 hover:text-primary/80"
              >
                Tentar novamente
              </button>
            </div>
          )}
          {!loading && !error && servicos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum serviço disponível no momento.
            </p>
          )}
          {!loading &&
            servicos.map((servico) => {
              const isOpen = openId === servico.id;
              return (
                <m.div
                  key={servico.id}
                  variants={fadeUp}
                  className={cn(
                    'relative flex flex-col h-full rounded-xl border bg-card shadow-sm transition-all hover:border-primary/40',
                    isOpen && 'z-30 rounded-b-none border-primary/40 shadow-xl',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(servico.id)}
                    aria-expanded={isOpen}
                    className="flex w-full h-full items-center justify-between gap-4 p-5 text-left transition-colors group focus-gold min-h-[88px]"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-5 w-5"
                          aria-hidden="true"
                        >
                          <path d={servico.icone} />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                        {servico.titulo}
                      </h3>
                    </div>
                    <m.svg
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </m.svg>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <m.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                         className="absolute left-[-1px] right-[-1px] top-[calc(100%-1px)] z-30 rounded-b-xl border border-t-0 border-primary/40 bg-card p-5 shadow-2xl overflow-hidden"
                      >
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {servico.descricao}
                        </p>
                        <div className="mt-3 flex justify-end items-center gap-2">
                          <Link
                            to={`/contato?servico=${encodeURIComponent(servico.titulo)}`}
                            aria-label={`Solicitar atendimento/contato para ${servico.titulo}`}
                            title="Solicitar Contato"
                            className={cn(
                              'inline-flex h-6 w-6 items-center justify-center rounded-xl bg-transparent text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground',
                            )}
                          >
                            <span aria-hidden="true">SO</span>
                          </Link>
                          <WhatsAppIconButton
                            className="h-6 w-6 rounded-xl"
                            text={`Olá! Gostaria de um orçamento de impermeabilização para ${servico.titulo}.`}
                          />
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </m.div>
              );
            })}
        </m.div>
      </div>
    </section>
  );
}
