import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { EASE } from '../../lib/motion';

const imageModules = import.meta.glob('/src/assets/Hero_images/*.webp', {
  eager: true,
  import: 'default',
});

const slideNumber = (path: string) => {
  const file = path.split('/').pop() ?? '';
  const match = file.match(/^(\d+)/);
  return match ? Number(match[1]) : 0;
};

export const heroImages = Object.entries(imageModules)
  .sort(([a], [b]) => slideNumber(a) - slideNumber(b))
  .map(([, src]) => src as string);

export const SLIDE_INTERVAL = 9000;
export const CROSSFADE = 1.2;
export const KEN_BURNS = SLIDE_INTERVAL / 1000 + CROSSFADE;

const PAUSE_AFTER_VIEWPORT = 0.8;

const HeroSlideshowContext = createContext<{ currentSlide: number } | null>(
  null,
);

export function HeroSlideshowProvider({ children }: { children: ReactNode }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const updatePaused = () => {
      setPaused(window.scrollY > window.innerHeight * PAUSE_AFTER_VIEWPORT);
    };
    updatePaused();
    window.addEventListener('scroll', updatePaused, { passive: true });
    window.addEventListener('resize', updatePaused);
    return () => {
      window.removeEventListener('scroll', updatePaused);
      window.removeEventListener('resize', updatePaused);
    };
  }, []);

  useEffect(() => {
    if (heroImages.length < 2 || paused) return;

    const advance = () =>
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);

    let interval = window.setInterval(advance, SLIDE_INTERVAL);

    const onVisibilityChange = () => {
      window.clearInterval(interval);
      if (!document.hidden) {
        interval = window.setInterval(advance, SLIDE_INTERVAL);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [paused]);

  useEffect(() => {
    if (heroImages.length < 2) return;
    const next = heroImages[(currentSlide + 1) % heroImages.length];
    const preload = new Image();
    preload.src = next;
  }, [currentSlide]);

  return (
    <HeroSlideshowContext.Provider value={{ currentSlide }}>
      {children}
    </HeroSlideshowContext.Provider>
  );
}

export function useHeroSlideshow() {
  const ctx = useContext(HeroSlideshowContext);
  if (!ctx) {
    throw new Error(
      'useHeroSlideshow deve ser usado dentro de HeroSlideshowProvider',
    );
  }
  return ctx;
}

export function HeroBackground({
  variant = 'hero',
}: {
  variant?: 'hero' | 'header';
}) {
  const { currentSlide } = useHeroSlideshow();
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <AnimatePresence initial={false}>
        <m.div
          key={heroImages[currentSlide]}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImages[currentSlide]})` }}
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.04 }}
          animate={{ opacity: 1, scale: reduceMotion ? 1 : 1.1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: reduceMotion ? 0.2 : CROSSFADE, ease: EASE },
            scale: { duration: KEN_BURNS, ease: 'linear' },
          }}
        />
      </AnimatePresence>

      {variant === 'hero' ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0.16)_55%,transparent_78%)]" />
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/40 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/15 to-transparent" />
        </>
      )}
    </div>
  );
}
