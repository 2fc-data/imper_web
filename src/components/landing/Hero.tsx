import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HeroBackground } from './HeroBackground';

export function Hero() {
  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-[90vh] flex-col overflow-hidden bg-background pt-12"
    >
      <HeroBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col items-start justify-center pt-24 pb-16 pr-4 pl-8 text-left sm:pr-6 sm:pl-14 lg:pr-8 lg:pl-24">
        <div className="my-auto w-full">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display w-fit max-w-3xl rounded-lg bg-black/25 px-4 py-2 text-2xl font-semibold leading-[1.05] tracking-[-0.02em] text-white drop-shadow-sm backdrop-blur-sm sm:text-3xl lg:text-4xl">
            Imperpoços
          </h1>
        </m.div>

        <m.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-8 font-display w-fit max-w-2xl rounded-lg bg-black/25 px-4 py-2 text-xl font-semibold leading-[1.15] tracking-[-0.015em] text-white/90 drop-shadow-sm backdrop-blur-sm sm:text-2xl lg:text-3xl"
        >
          Engenharia de Impermeabilização
        </m.h2>


        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-start gap-4"
        >
          <Link
            to="/contato"
            className="rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-black/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-black/25 active:scale-[0.98]"
          >
            Entrar em Contato
          </Link>
          <Link
            to="/servicos"
            className="rounded-xl border border-white/30 bg-black/20 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/30"
          >
            Nossos Serviços
          </Link>
        </m.div>
        </div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mx-auto mt-12 flex w-fit max-w-full flex-wrap items-center justify-center gap-6 rounded-xl bg-black/25 px-5 py-3 text-sm backdrop-blur-sm sm:gap-10 sm:text-base"
        >
          <span className="flex items-center gap-2 text-white">
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            30+ Anos de Experiência
          </span>
          <span className="flex items-center gap-2 text-white">
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            </svg>
            CNPJ 71.189.955/0001-87
          </span>
          <span className="flex items-center gap-2 text-white">
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Poços de Caldas - MG
          </span>
        </m.div>

        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex w-full justify-center pt-6"
        >
          <Link
            to="/servicos"
            className="flex flex-col items-center gap-1 rounded-full bg-black/25 px-4 py-2 font-medium text-white/85 backdrop-blur-sm transition-colors hover:text-white"
          >
            Saiba mais
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="m19 12-7 7-7-7" />
            </svg>
          </Link>
        </m.div>
      </div>
    </section>
  );
}
