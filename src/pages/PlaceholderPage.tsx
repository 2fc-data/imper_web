import { Button } from '../components/ui/button';

interface PlaceholderProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      <Button variant="outline" size="sm" onClick={() => window.history.back()}>
        Voltar
      </Button>
    </div>
  );
}
