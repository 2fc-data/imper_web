interface RecordsFilterProps {
  value: number;
  onChange: (value: number) => void;
  total: number;
}

const selectClasses =
  'rounded-lg border border-input bg-background px-2 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export function RecordsFilter({ value, onChange, total }: RecordsFilterProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <label className="sr-only" htmlFor="records-per-page">
        Exibir registros por página
      </label>
      <span aria-hidden="true">Exibir</span>
      <select
        id="records-per-page"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={selectClasses}
      >
        <option value={25}>25</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
        <option value={150}>150</option>
        <option value={0}>Todos</option>
      </select>
      <span>
        de <span className="font-medium text-foreground">{total}</span> registro
        {total !== 1 ? 's' : ''}
      </span>
    </div>
  );
}
