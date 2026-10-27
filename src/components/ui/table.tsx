import { forwardRef, type HTMLAttributes, type ThHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

const TableWrapper = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'w-full overflow-x-auto rounded-xl border bg-card shadow-sm',
        className,
      )}
      {...props}
    />
  ),
);
TableWrapper.displayName = 'TableWrapper';

const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={cn('w-full border-collapse text-sm', className)}
      {...props}
    />
  ),
);
Table.displayName = 'Table';

const Th = forwardRef<HTMLTableCellElement, ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      scope="col"
      className={cn(
        'whitespace-nowrap border-b bg-muted/50 px-4 py-3 text-left text-xs font-semibold text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
);
Th.displayName = 'Th';

export { Table, TableWrapper, Th };
