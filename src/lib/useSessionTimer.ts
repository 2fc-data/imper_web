import { useEffect, useRef, useState } from 'react';

export function useSessionTimer(
  durationSeconds: number,
  onExpire: () => void,
): number {
  const [segundosRestantes, setSegundosRestantes] = useState(durationSeconds);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    let ultimaAtividade = Date.now();
    let ultimoMovimento = 0;

    const resetar = (_forcar?: Event | boolean) => {
      const agora = Date.now();
      const semThrottle = _forcar === true;
      if (!semThrottle && agora - ultimaAtividade < 1000) return;
      ultimaAtividade = agora;
      setSegundosRestantes(durationSeconds);
    };

    const aoMover = () => {
      const agora = Date.now();
      if (agora - ultimoMovimento < 2000) return;
      ultimoMovimento = agora;
      setSegundosRestantes(durationSeconds);
    };

    const eventos = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;
    eventos.forEach((e) =>
      window.addEventListener(e, resetar, { passive: true }),
    );
    window.addEventListener('mousemove', aoMover, { passive: true });

    const intervalo = window.setInterval(() => {
      setSegundosRestantes((s) => {
        if (s <= 1) {
          window.clearInterval(intervalo);
          expireRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalo);
      eventos.forEach((e) => window.removeEventListener(e, resetar));
      window.removeEventListener('mousemove', aoMover);
    };
  }, [durationSeconds]);

  return segundosRestantes;
}
