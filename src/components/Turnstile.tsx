import { useEffect, useRef } from 'react';

const SITE_KEY =
  (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) || '';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string;
    };
  }
}

export default function Turnstile({
  onChange,
}: {
  onChange: (token: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const devMode = !SITE_KEY;

  useEffect(() => {
    if (!SITE_KEY) {
      onChange('dev-bypass');
      return;
    }

    function render() {
      if (!ref.current || !window.turnstile) return;
      window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: onChange,
        'expired-callback': () => onChange(''),
        'error-callback': () => onChange(''),
      });
    }

    if (window.turnstile) {
      render();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange]);

  return (
    <>
      {devMode && (
        <p className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
          Turnstile em modo de desenvolvimento (verificação de humano
          desativada). Configure <code>VITE_TURNSTILE_SITE_KEY</code> para
          ativar a verificação real.
        </p>
      )}
      <div ref={ref} />
    </>
  );
}
