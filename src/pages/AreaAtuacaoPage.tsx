import { m, useInView } from 'framer-motion';
import L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import heroBg from '../assets/Hero_Imper_optimized.webp';
import { fadeUp, stagger, VIEWPORT } from '../lib/motion';
import { useCidades } from '../lib/useCidades';
import 'leaflet/dist/leaflet.css';

function createMarcador() {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:9999px;background:${COR_MARCADOR};border:3px solid var(--marker-ring);box-shadow:0 2px 6px rgb(0 0 0 / 0.35)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

interface Ponto {
  id: number;
  nome: string;
  uf: string;
  lat: number;
  lng: number;
}

function LeafletMap({ pontos }: { pontos: Ponto[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || pontos.length === 0) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = L.map(el, {
      center: [pontos[0]!.lat, pontos[0]!.lng],
      zoom: 11,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const marcadorIcon = createMarcador();
    pontos.forEach((p) => {
      const popup = document.createElement('span');
      popup.className = 'font-medium';
      popup.textContent = `${p.nome} - ${p.uf}`;
      L.marker([p.lat, p.lng], { icon: marcadorIcon })
        .addTo(map)
        .bindPopup(popup);
    });

    const coords: L.LatLngExpression[] = pontos.map((p) => [p.lat, p.lng]);
    const b =
      coords.length === 1
        ? L.latLngBounds(coords[0], coords[0])
        : L.latLngBounds(coords);
    map.fitBounds(b, { padding: [40, 40] });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [pontos]);

  return <div ref={containerRef} className="z-0 h-[360px] w-full rounded-lg" />;
}

const COR_MARCADOR = 'oklch(48% 0.10 252)';

export default function AreaAtuacaoPage() {
  const { cidades, loading, error, retry } = useCidades();
  const listRef = useRef<HTMLDivElement>(null);
  const inView = useInView(listRef, VIEWPORT);

  const pontos = useMemo<Ponto[]>(
    () =>
      cidades.map((c) => ({
        id: c.id,
        nome: c.nome,
        uf: c.uf,
        lat: Number(c.lat),
        lng: Number(c.lng),
      })),
    [cidades],
  );

  return (
    <section id="area-de-atuacao" className="py-12 my-16 sm:py-16 sm:my-24">
      <div className="mx-auto w-full max-w-[1400px] px-4">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl font-serif text-foreground">
          Área de atuação
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Atendemos Poços de Caldas e Região.
        </p>
        <m.div
          ref={listRef}
          className="mt-6"
          variants={stagger(0.03)}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {loading && (
            <div className="flex h-[360px] items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">
              Carregando mapa...
            </div>
          )}
          {!loading && error && (
            <div className="flex h-[360px] flex-col items-center justify-center rounded-xl border bg-card text-sm text-destructive">
              <p>{error}</p>
              <button
                type="button"
                onClick={retry}
                className="mt-2 text-xs underline underline-offset-2 hover:text-primary"
              >
                Tentar novamente
              </button>
            </div>
          )}
          {!loading && !error && pontos.length === 0 && (
            <div className="flex h-[360px] items-center justify-center rounded-xl border bg-card text-sm text-muted-foreground">
              Nenhuma cidade cadastrada ainda.
            </div>
          )}
          {!loading && !error && pontos.length > 0 && (
            <m.div
              variants={fadeUp}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div className="relative rounded-xl border bg-card p-3">
                <LeafletMap pontos={pontos} />
              </div>
              <div className="hidden sm:flex items-center justify-center rounded-xl border bg-card overflow-hidden p-3">
                <img
                  src={heroBg}
                  alt="Imper Pinturas"
                  className="h-full w-full object-cover rounded-lg"
                />
              </div>
            </m.div>
          )}
        </m.div>
      </div>
    </section>
  );
}
