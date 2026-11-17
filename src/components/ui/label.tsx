import { forwardRef, type LabelHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      {required && (
        <span
          className="text-destructive/80 font-bold ml-0.5 select-none"
          title="Campo obrigatório"
          aria-hidden="true"
        >
          *
        </span>
      )}
    </label>
  ),
);
Label.displayName = 'Label';

export { Label };
