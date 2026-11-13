import { m, AnimatePresence, motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const imageModules = import.meta.glob('/src/assets/Hero_images/*.webp', {
  eager: true,
  import: 'default',
});

const heroImages = Object.values(imageModules) as string[];

export function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const slideVariants = {
    hidden: { opacity: 1, scale: 1 },
    visible: { opacity: 0, scale: 1.1, transition: { duration: 9 } },
    exit: { opacity: 1, transition: { duration: 9 } },
  };

  return (
    <section
      id="inicio"
      className="relative flex min-h-[90vh] flex-col overflow-hidden bg-background pt-12"
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {heroImages.map((img, i) => (
            <motion.div
              key={img}
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${img})` }}
              variants={slideVariants}
              initial="hidden"
              animate={i === currentSlide ? 'visible' : 'hidden'}
              exit="hidden"
            />
          ))}
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col items-center justify-center px-4 py-24 text-center sm:px-6 lg:px-8">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-secondary sm:text-4xl lg:text-5xl font-serif">
            Engenharia de Impermeabilização
          </h1>
        </m.div>

        <m.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mt-12 text-2xl font-bold sm:text-3xl lg:text-4xl font-serif"
        >
          <span className="text-secondary text-3xl">Qualidade e Confiança</span> há mais de
          30 anos
        </m.h2>


        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/contato"
            className="rounded-xl border border-border px-8 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:bg-base/90 hover:text-base hover:shadow-lg hover:shadow-base/25 active:scale-[0.98]"
          >
            Entrar em Contato
          </Link>
          <Link
            to="/servicos"
            className="rounded-xl border border-border px-8 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Nossos Serviços
          </Link>
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-auto pt-24 flex flex-wrap items-center justify-center gap-6 sm:gap-10"
        >
          <span className="flex items-center gap-2 text-secondary">
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="secondary"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            30+ Anos de Experiência
          </span>
          <span className="flex items-center gap-2 text-secondary">
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="secondary"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            </svg>
            CNPJ 71.189.955/0001-87
          </span>
          <span className="flex items-center gap-2 text-secondary">
            <svg
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="secondary"
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
          className="pt-6"
        >
          <Link
            to="/servicos"
            className="flex flex-col items-center gap-1 font-medium text-secondary transition-colors hover:text-primary font-serif"
          >
            Saiba mais
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="secondary"
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
