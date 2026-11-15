import { AnimatePresence, m, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { WhatsAppIconButton } from '../components/landing/SocialIconButtons';
import { EASE, fadeUp, stagger, VIEWPORT } from '../lib/motion';
import { useServicos } from '../lib/useServicos';
import { cn } from '../lib/utils';

const serviceImageModules = import.meta.glob('../assets/Services_images/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const serviceImages = new Map(
  Object.entries(serviceImageModules).map(([path, src]) => {
    const file = path.split('/').pop() ?? '';
    return [normalize(file.replace(/\.webp$/i, '')), src];
  }),
);

function getServiceImage(titulo: string) {
  return serviceImages.get(normalize(titulo));
}

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
        <h4 className="mt-2 text-muted-foreground">
          Soluções profissionais para proteger seu patrimônio
        </h4>

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
                className="flex flex-col h-full rounded-xl border bg-card p-5 shadow-sm min-h-[264px]"
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
              const image = getServiceImage(servico.titulo);
              const isOpen = openId === servico.id;
              return (
                <m.div
                  key={servico.id}
                  variants={fadeUp}
                  className={cn(
                    'relative flex h-full flex-col rounded-xl border bg-card shadow-sm transition-all hover:border-primary/40',
                    isOpen && 'z-30 border-primary/40 shadow-xl',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(servico.id)}
                    aria-expanded={isOpen}
                    className="group relative flex min-h-[264px] w-full items-center justify-between gap-4 overflow-hidden rounded-xl p-5 text-left focus-gold"
                  >
                    {image && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                      >
                        <img
                          src={image}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </div>
                    )}
                    <h3
                      className={cn(
                        'relative text-lg font-semibold text-foreground',
                        image &&
                          'rounded-lg bg-black/45 px-3 py-1.5 text-white backdrop-blur-sm drop-shadow-sm',
                      )}
                    >
                      {servico.titulo}
                    </h3>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <m.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ duration: 0.22, ease: EASE }}
                        className="absolute inset-0 z-20 flex flex-col overflow-hidden rounded-xl border border-primary/40 bg-white p-5 shadow-2xl"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-semibold text-foreground">
                            {servico.titulo}
                          </h3>
                          <m.button
                            type="button"
                            onClick={() => setOpenId(null)}
                            aria-label="Fechar descrição"
                            title="Fechar"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-gold"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              aria-hidden="true"
                            >
                              <path d="M6 6l12 12M18 6L6 18" />
                            </svg>
                          </m.button>
                        </div>
                        <p className="mt-3 min-h-0 flex-1 overflow-y-auto text-justify text-sm leading-relaxed text-gray-700">
                          {servico.descricao}
                        </p>
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <Link
                            to={`/contato?servico=${encodeURIComponent(servico.titulo)}`}
                            aria-label={`Solicitar atendimento/contato para ${servico.titulo}`}
                            title="Solicitar Contato"
                            className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-transparent text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
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
