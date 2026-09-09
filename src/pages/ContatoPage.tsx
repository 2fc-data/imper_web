import { m, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FacebookIconButton,
  InstagramIconButton,
  WhatsAppIconButton,
} from '../components/landing/SocialIconButtons';
import { WHATSAPP_TEXT, WHATSAPP_URL } from '../lib/landing';
import { fadeUp, stagger, VIEWPORT } from '../lib/motion';
import { cn } from '../lib/utils';

export default function ContatoPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, VIEWPORT);

  return (
    <section
      id="contato"
      className="bg-background py-12 my-16 sm:py-16 sm:my-24 dark:bg-card/60"
    >
      <div className="mx-auto w-full max-w-[1400px] px-4">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Canais de atendimento
        </h2>
        <p className="mt-2 text-muted-foreground">
          Saiba qual o melhor sistema impermeabilizante para a sua obra.
        </p>
        <m.div
          ref={cardRef}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={fadeUp}
          className="mt-8 overflow-hidden rounded-2xl bg-foreground text-primary-foreground"
        >
          <div className="p-6 sm:p-10">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Solicite uma visita técnica
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
              Peça orçamentos ou tire dúvidas sobre nossos serviços.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/60">
                  WhatsApp
                </p>
                <a
                  href={`${WHATSAPP_URL}?text=${encodeURIComponent(WHATSAPP_TEXT)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block rounded px-1 font-semibold text-secondary transition-colors hover:text-primary"
                >
                  (35) 99999-4663
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/60">
                  Telefone
                </p>
                <a
                  href="tel:+553537211674"
                  className="mt-1 block rounded px-1 font-semibold text-secondary transition-colors hover:text-primary"
                >
                  (35) 3721-1674
                </a>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/60">
                  E-mail
                </p>
                <a
                  href="mailto:impershop@imperpocos.com.br"
                  className="mt-1 block break-all rounded px-1 font-semibold text-secondary transition-colors hover:text-primary"
                >
                  impershop@imperpocos.com.br
                </a>
              </div>
            </div>
          </div>
        </m.div>

        <m.div
          className="mt-8 grid gap-4 sm:grid-cols-3"
          variants={stagger()}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <m.div variants={fadeUp} className="rounded-xl border bg-card p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              >
                <path d="M12 21s7-6.3 7-11a7 7 0 10-14 0c0 4.7 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              Endereço
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Rua+S%C3%A3o+Paulo,+511+-+Centro,+Po%C3%A7os+de+Caldas/MG"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded transition-colors hover:text-primary px-0 py-0.5 text-sm font-medium"
              >
                Rua São Paulo, 511 — Centro
              </a>
              <br />
              Poços de Caldas/MG
            </p>
          </m.div>
          <m.div variants={fadeUp} className="rounded-xl border bg-card p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              Horário de atendimento
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Segunda a sexta-feira
              <br />
              07h15 às 12h e 13h às 17h
            </p>
          </m.div>
          <m.div variants={fadeUp} className="rounded-xl border bg-card p-5">
            <h3 className="flex items-center gap-2 font-semibold">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-primary"
                aria-hidden="true"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Canais online
            </h3>
            <div className="mt-4 flex flex-col items-stretch gap-3">
              <div className="grid grid-cols-4 justify-items-center gap-3">
                <Link
                  to="/orcamento"
                  aria-label="Solicitar orçamento"
                  title="Solicitar orçamento"
                  className={cn(
                    'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-transparent text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground',
                  )}
                >
                  SO
                </Link>

                <WhatsAppIconButton className="h-10 w-10 rounded-xl" />
                <InstagramIconButton className="h-10 w-10 rounded-xl" />
                <FacebookIconButton className="h-10 w-10 rounded-xl" />
              </div>
            </div>
          </m.div>
        </m.div>
      </div>
    </section>
  );
}
