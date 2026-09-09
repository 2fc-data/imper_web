import type { Variants } from 'framer-motion';

export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
};

export const stagger = (
  staggerChildren = 0.08,
  delayChildren = 0.1,
): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

export const VIEWPORT = { once: true, amount: 0.2 } as const;
