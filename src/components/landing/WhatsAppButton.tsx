import type { ReactNode } from 'react';
import { WHATSAPP_TEXT, WHATSAPP_URL } from '../../lib/landing';
import { cn } from '../../lib/utils';

export function WhatsAppButton({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={`${WHATSAPP_URL}?text=${encodeURIComponent(WHATSAPP_TEXT)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg bg-transparent px-5 py-3 text-base font-semibold text-whatsapp transition-colors hover:bg-whatsapp-hover hover:text-white',
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5 shrink-0"
        aria-hidden="true"
      >
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.1 4.49.71.3 1.27.49 1.7.62.72.23 1.37.2 1.88.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12.04 21.5a9.4 9.4 0 01-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.42 9.42 0 01-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.37 9.37 0 016.67 2.77 9.37 9.37 0 012.76 6.67c0 5.2-4.23 9.43-9.45 9.43zm8.2-17.63A11.27 11.27 0 0012.04.98C5.8.98.7 6.08.7 12.32c0 2 .53 3.95 1.53 5.67L.62 23.4l5.53-1.45a11.3 11.3 0 005.88 1.67h.01c6.24 0 11.34-5.1 11.34-11.35a11.28 11.28 0 00-3.14-8.02z" />
      </svg>
      {children}
    </a>
  );
}
