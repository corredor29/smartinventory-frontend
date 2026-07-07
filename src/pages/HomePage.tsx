import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockProducts } from '../api/productApi';
import type { Product } from '../types/product';

// ─── Paleta del proyecto (ya usada en AppRoutes / layouts) ───────────────────
// Fondo: #0f1923 · Acento primario: #ff4655 · Acento secundario: #00ece0

function tierFor(price: number): { label: string; color: string } {
  if (price >= 700) return { label: 'EDICIÓN LIMITADA', color: '#c084fc' };
  if (price >= 200) return { label: 'PREMIUM', color: '#fbbf24' };
  if (price >= 80) return { label: 'SELECTA', color: '#00ece0' };
  return { label: 'ESTÁNDAR', color: '#94a3b8' };
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

// ─── Hero (banner rotativo) ───────────────────────────────────────────────────

const heroSlides = [
  { tag: 'TEMPORADA 03', title: 'ARSENAL ACTUALIZADO', subtitle: 'Nuevo stock disponible cada semana en nuestro inventario.' },
  { tag: 'LOGÍSTICA TÁCTICA', title: 'ENVÍO MODO RÁFAGA', subtitle: 'Recibe tu equipo en tiempo récord, sin bajas en el camino.' },
  { tag: 'ALERTA DE STOCK', title: 'ÚLTIMAS UNIDADES', subtitle: 'Aprovecha antes de que el inventario quede en ceros.' },
];

function HeroBanner() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 4500);
    return () => clearInterval(t);
  }, []);

  const s = heroSlides[slide];

  return (
    <div className="relative h-64 sm:h-80 bg-[#0f1923] overflow-hidden border-b border-[#ff4655]/20">
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #ff4655 0 2px, transparent 2px 42px)' }}
      />
      <div className="relative h-full flex flex-col items-start justify-center px-6 sm:px-10 max-w-6xl mx-auto">
        <span className="text-[#ff4655] text-xs font-bold uppercase tracking-[0.3em] mb-3 font-mono">{s.tag}</span>
        <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight mb-3 leading-none">
          {s.title}
        </h2>
        <p className="text-gray-400 text-sm sm:text-base max-w-md">{s.subtitle}</p>
      </div>
      <div className="absolute bottom-5 left-6 sm:left-10 flex gap-1.5">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            className={`h-1 transition-all ${i === slide ? 'w-8 bg-[#ff4655]' : 'w-4 bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Tarjeta de producto ──────────────────────────────────────────────────────

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const tier = tierFor(product.price);
  return (
    <button
      onClick={onClick}
      className="shrink-0 basis-[calc(25%-12px)] min-w-[220px] bg-[#1f2326] border border-gray-800 p-4 text-left hover:border-[#ff4655]/50 hover:-translate-y-0.5 transition-all group relative"
      style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)' }}
    >
      <div className="absolute top-0 right-0 text-[9px] font-bold uppercase tracking-wider px-2 py-1" style={{ color: tier.color, background: `${tier.color}1a` }}>
        {tier.label}
      </div>
      <div className="w-full h-28 bg-black/20 flex items-center justify-center mb-3 mt-3">
        <div className="w-8 h-8 border-2 border-gray-700 rotate-45 group-hover:border-[#ff4655] transition-colors" />
      </div>
      <div className="text-sm font-semibold text-white truncate">{product.name}</div>
      <div className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-wide">{product.category}</div>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-sm font-bold text-white font-mono">{fmt(product.price)}</span>
        <span className={`text-[11px] font-bold uppercase ${product.stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {product.stock > 0 ? `${product.stock} uds` : 'Agotado'}
        </span>
      </div>
    </button>
  );
}

// ─── Fila de productos con mini-carrusel ─────────────────────────────────────

function ProductRow({ title, products, onSelect }: { title: string; products: Product[]; onSelect: (p: Product) => void }) {
  const [index, setIndex] = useState(0);
  const perView = 4;
  const maxIndex = Math.max(0, products.length - perView);

  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-1.5 bg-[#ff4655] rotate-45" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-white font-mono">{title}</h3>
      </div>
      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-out gap-4"
            style={{ transform: `translateX(-${index * (100 / perView)}%)` }}
          >
            {products.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => onSelect(p)} />
            ))}
          </div>
        </div>
        {index > 0 && (
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#1f2326] border border-gray-700 rounded-full flex items-center justify-center hover:border-[#ff4655]/50 transition-colors text-white"
          >
            ‹
          </button>
        )}
        {index < maxIndex && (
          <button
            onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#1f2326] border border-gray-700 rounded-full flex items-center justify-center hover:border-[#ff4655]/50 transition-colors text-white"
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Home Page (pública) ──────────────────────────────────────────────────────

export const HomePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    mockProducts && setProducts(mockProducts);
  }, []);

  const active = products.filter((p) => p.active);
  const topSellers = active.slice(0, 6);
  const newArrivals = [...active].reverse().slice(0, 6);
  const lastUnits = [...active].filter((p) => p.stock <= 15).sort((a, b) => a.stock - b.stock);

  return (
    <div className="min-h-screen bg-[#0f1923] font-sans">
      {/* Barra superior */}
      <div className="bg-[#1f2326] border-b border-gray-800 px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#ff4655] rotate-45 flex items-center justify-center flex-shrink-0">
            <div className="w-3 h-3 bg-[#0f1923] -rotate-45" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight font-mono">
            SMART<span className="text-[#ff4655]">//INV</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 px-4 py-2 bg-[#ff4655] hover:bg-[#e63e4c] text-white text-xs font-bold uppercase tracking-wide transition-colors"
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}
        >
          Iniciar sesión
        </button>
      </div>

      <HeroBanner />

      <div className="px-6 sm:px-10 py-12 max-w-6xl mx-auto">
        <ProductRow title="Más vendidos" products={topSellers} onSelect={setSelected} />
        <ProductRow title="Recién agregados" products={newArrivals} onSelect={setSelected} />
        <ProductRow title="Últimas unidades" products={lastUnits} onSelect={setSelected} />
      </div>

      {/* Modal de detalle de producto */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1f2326] border border-gray-800 w-full max-w-sm relative" style={{ clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px)' }}>
            <div className="flex items-center justify-between px-6 pt-6">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: tierFor(selected.price).color }}>
                {tierFor(selected.price).label}
              </span>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-lg leading-none">
                ×
              </button>
            </div>
            <div className="px-6 pt-3 pb-6">
              <div className="w-full h-32 bg-black/20 flex items-center justify-center mb-4">
                <div className="w-10 h-10 border-2 border-gray-700 rotate-45" />
              </div>
              <div className="text-sm font-semibold text-white">{selected.name}</div>
              <div className="text-[11px] text-gray-500 uppercase tracking-wide mt-0.5">{selected.category}</div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xl font-bold text-white font-mono">{fmt(selected.price)}</span>
                <span className={`text-xs font-bold uppercase ${selected.stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selected.stock > 0 ? `${selected.stock} unidades disponibles` : 'Sin stock'}
                </span>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="w-full mt-5 py-2.5 bg-[#ff4655] hover:bg-[#e63e4c] text-white text-sm font-bold uppercase tracking-wide transition-colors"
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)' }}
              >
                Inicia sesión para comprar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
