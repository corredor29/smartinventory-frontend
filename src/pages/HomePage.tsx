import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockProducts } from '../api/productApi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ClientNavbar } from '../components/ClientNavbar';
import { SupportFab } from '../components/SupportFab';
import type { Product } from '../types/product';

// Paleta: #0f1923 · #ff4655 · #00ece0 · #1f2326

const CLIP_CARD = 'polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%)';
const CLIP_BTN = 'polygon(10px 0, 100% 0, 100% 100%, 0 100%, 0 10px)';

function tierFor(price: number): { label: string; color: string } {
  if (price >= 700) return { label: 'ELITE', color: '#c084fc' };
  if (price >= 200) return { label: 'PREMIUM', color: '#fbbf24' };
  if (price >= 80) return { label: 'SELECT', color: '#00ece0' };
  return { label: 'STANDARD', color: '#94a3b8' };
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function stockLevel(stock: number): { label: string; pct: number; color: string } {
  if (stock <= 0) return { label: 'AGOTADO', pct: 0, color: '#ff4655' };
  if (stock <= 5) return { label: 'CRÍTICO', pct: 15, color: '#ff4655' };
  if (stock <= 15) return { label: 'BAJO', pct: 40, color: '#fbbf24' };
  if (stock <= 40) return { label: 'DISPONIBLE', pct: 70, color: '#00ece0' };
  return { label: 'FULL STOCK', pct: 100, color: '#34d399' };
}

// ─── Hero ────────────────────────────────────────────────────────────────────

const heroSlides = [
  {
    tag: 'ACTO 01 // SUMINISTROS',
    title: 'EQUIPA TU BASE',
    subtitle: 'Electrodomésticos y tecnología del hogar con entrega táctica a domicilio.',
    accent: '#ff4655',
  },
  {
    tag: 'LOGÍSTICA // SPIKE RUSH',
    title: 'ENVÍO EN 24H',
    subtitle: 'Despliegue rápido sin complicaciones. Tu hogar, siempre operativo.',
    accent: '#00ece0',
  },
  {
    tag: 'ALERTA // STOCK',
    title: 'ÚLTIMAS UNIDADES',
    subtitle: 'Equipos premium con inventario limitado. No dejes pasar la oportunidad.',
    accent: '#fbbf24',
  },
];

function HeroBanner() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % heroSlides.length), 5000);
    return () => clearInterval(t);
  }, []);

  const s = heroSlides[slide];

  return (
    <div className="relative h-72 sm:h-96 bg-[#0f1923] overflow-hidden border-b border-[#ff4655]/20">
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: 'repeating-linear-gradient(-45deg, #ff4655 0 1px, transparent 1px 36px)' }}
      />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#ff4655]/5 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-[#00ece0]/5 to-transparent pointer-events-none" />

      <div className="relative h-full flex flex-col items-start justify-center px-6 sm:px-10 max-w-7xl mx-auto">
        <div key={slide}>
          <span
            className="text-xs font-bold uppercase tracking-[0.35em] mb-3 font-mono block"
            style={{ color: s.accent }}
          >
            {s.tag}
          </span>
          <h2 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight mb-4 leading-[0.95] max-w-2xl">
            {s.title}
          </h2>
          <p className="text-gray-400 text-sm sm:text-base max-w-lg leading-relaxed">{s.subtitle}</p>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-5 py-2.5 bg-[#ff4655] hover:bg-[#e63e4c] text-white text-xs font-bold uppercase tracking-widest transition-colors"
            style={{ clipPath: CLIP_BTN }}
          >
            Ver catálogo
          </button>
          <span className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-wider px-3 border border-gray-800">
            <span className="text-[#00ece0]">◆</span> +120 equipos activos
          </span>
        </div>
      </div>

      <div className="absolute bottom-5 left-6 sm:left-10 flex gap-1.5">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1 transition-all duration-300 ${i === slide ? 'w-10 bg-[#ff4655]' : 'w-4 bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>

      <div className="absolute top-5 right-6 sm:right-10 text-right hidden sm:block">
        <div className="text-[10px] font-mono text-gray-600 uppercase tracking-[0.3em]">Smart//Inv Store</div>
        <div className="text-[10px] font-mono text-[#00ece0] uppercase tracking-widest mt-1">Ep. Hogar 2026</div>
      </div>
    </div>
  );
}

// ─── Ventajas ────────────────────────────────────────────────────────────────

const perks = [
  { icon: '⚡', title: 'Despliegue Rápido', desc: 'Entrega express en zona metropolitana.' },
  { icon: '🛡', title: 'Garantía Táctica', desc: 'Cobertura extendida en todos los equipos.' },
  { icon: '◈', title: 'Soporte Agente', desc: 'Asesoría personalizada antes y después de comprar.' },
];

function PerksStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-800/60 border border-gray-800 mb-12">
      {perks.map((p) => (
        <div key={p.title} className="bg-[#1f2326] p-5 flex gap-4 items-start">
          <span className="text-xl opacity-80">{p.icon}</span>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white font-mono">{p.title}</div>
            <div className="text-[11px] text-gray-500 mt-1 leading-relaxed">{p.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tarjeta de producto ─────────────────────────────────────────────────────

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const tier = tierFor(product.price);
  const stock = stockLevel(product.stock);

  return (
    <button
      onClick={onClick}
      className="shrink-0 basis-[calc(25%-12px)] min-w-[280px] bg-[#1f2326] border border-gray-800 p-4 text-left hover:border-[#ff4655]/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#ff4655]/5 transition-all group relative"
      style={{ clipPath: CLIP_CARD }}
    >
      <div className="absolute top-0 left-0 text-[8px] font-mono text-gray-600 px-2 py-1 uppercase tracking-wider">
        {product.id}
      </div>
      <div
        className="absolute top-0 right-0 text-[9px] font-bold uppercase tracking-wider px-2 py-1"
        style={{ color: tier.color, background: `${tier.color}1a` }}
      >
        {tier.label}
      </div>

      <div className="w-full h-36 bg-[#0f1923]/60 flex items-center justify-center mb-3 mt-4 border border-gray-800/50 group-hover:border-[#00ece0]/20 transition-colors">
        <img
          src={product.image}
          alt={product.name}
          className="max-w-full max-h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      <div className="text-sm font-semibold text-white truncate group-hover:text-[#00ece0] transition-colors">
        {product.name}
      </div>
      <div className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-widest font-mono">{product.category}</div>

      <div className="mt-3 mb-2">
        <div className="flex justify-between text-[9px] font-mono uppercase tracking-wider mb-1">
          <span className="text-gray-600">Inventario</span>
          <span style={{ color: stock.color }}>{stock.label}</span>
        </div>
        <div className="h-0.5 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full transition-all" style={{ width: `${stock.pct}%`, background: stock.color }} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wider">Créditos</div>
          <span className="text-sm font-bold text-white font-mono">{fmt(product.price)}</span>
        </div>
        <span className={`text-[10px] font-bold uppercase font-mono ${product.stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {product.stock > 0 ? `${product.stock} uds` : 'Agotado'}
        </span>
      </div>
    </button>
  );
}

// ─── Fila de productos ───────────────────────────────────────────────────────

function ProductRow({
  title,
  subtitle,
  products,
  onSelect,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
  onSelect: (p: Product) => void;
}) {
  const [index, setIndex] = useState(0);
  const perView = 4;
  const maxIndex = Math.max(0, products.length - perView);

  if (products.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 bg-[#ff4655] rotate-45" />
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white font-mono">{title}</h3>
            <span className="text-[10px] font-mono text-gray-600 ml-1">[{products.length}]</span>
          </div>
          {subtitle && <p className="text-[11px] text-gray-500 ml-4 font-mono">{subtitle}</p>}
        </div>
        {products.length > perView && (
          <span className="text-[10px] font-mono text-gray-600 uppercase hidden sm:block">
            {index + 1}–{Math.min(index + perView, products.length)} de {products.length}
          </span>
        )}
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
            aria-label="Anterior"
            className="absolute -left-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#1f2326] border border-gray-700 flex items-center justify-center hover:border-[#ff4655]/50 transition-colors text-white text-lg"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}
          >
            ‹
          </button>
        )}
        {index < maxIndex && (
          <button
            onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
            aria-label="Siguiente"
            className="absolute -right-4 top-1/2 -translate-y-1/2 w-9 h-9 bg-[#1f2326] border border-gray-700 flex items-center justify-center hover:border-[#ff4655]/50 transition-colors text-white text-lg"
            style={{ clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)' }}
          >
            ›
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Home Page ───────────────────────────────────────────────────────────────

export const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('Todos');
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  const handleBuy = (product: Product) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/' }, intent: 'buy', productId: product.id } });
      return;
    }
    if (product.stock <= 0) return;
    addToCart(product);
    setAddedFeedback(product.id);
    setTimeout(() => setAddedFeedback(null), 2000);
  };

  useEffect(() => {
    setProducts(mockProducts);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const active = useMemo(() => products.filter((p) => p.active), [products]);

  const categories = useMemo(
    () => ['Todos', ...Array.from(new Set(active.map((p) => p.category))).sort()],
    [active],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return active.filter((p) => {
      const matchCat = category === 'Todos' || p.category === category;
      const matchSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [active, category, search]);

  const topSellers = filtered.slice(0, 6);
  const newArrivals = [...filtered].reverse().slice(0, 6);
  const lastUnits = [...filtered].filter((p) => p.stock <= 15).sort((a, b) => a.stock - b.stock);

  const totalStock = active.reduce((s, p) => s + p.stock, 0);
  const lowStockCount = active.filter((p) => p.stock <= 15).length;

  return (
    <div className="min-h-screen bg-[#0f1923] font-sans">
      <ClientNavbar />

      <HeroBanner />

      {/* Stats rápidos */}
      <div className="border-b border-gray-800 bg-[#16191b]/50">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Equipos activos', value: active.length, color: '#00ece0' },
            { label: 'Unidades en stock', value: totalStock, color: '#ff4655' },
            { label: 'Alertas de stock', value: lowStockCount, color: '#fbbf24' },
            { label: 'Categorías', value: categories.length - 1, color: '#c084fc' },
          ].map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <div className="text-xl sm:text-2xl font-black font-mono" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <main className="px-6 sm:px-10 py-12 max-w-7xl mx-auto" id="catalogo">
        {/* Buscador y filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs font-mono">⌕</span>
            <input
              type="search"
              placeholder="Buscar equipo en el inventario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1f2326] border border-gray-800 pl-8 pr-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#00ece0]/40 font-mono"
              style={{ clipPath: CLIP_BTN }}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest font-mono border transition-colors ${
                  category === cat
                    ? 'bg-[#ff4655]/15 border-[#ff4655]/50 text-[#ff4655]'
                    : 'bg-[#1f2326] border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div id="ventajas">
          <PerksStrip />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 border border-gray-800 bg-[#1f2326]/50">
            <div className="text-[#ff4655] font-mono text-xs uppercase tracking-[0.3em] mb-2">Sin resultados</div>
            <p className="text-gray-500 text-sm">No hay equipos que coincidan con tu búsqueda.</p>
          </div>
        ) : (
          <>
            <ProductRow
              title="Top del loadout"
              subtitle="Los más solicitados por nuestros agentes"
              products={topSellers}
              onSelect={setSelected}
            />
            <ProductRow
              title="Recién desplegados"
              subtitle="Nuevo ingreso al almacén táctico"
              products={newArrivals}
              onSelect={setSelected}
            />
            <ProductRow
              title="Stock crítico"
              subtitle="Últimas unidades — actúa rápido"
              products={lastUnits}
              onSelect={setSelected}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#1f2326] mt-8">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-[#ff4655] rotate-45 flex items-center justify-center">
              <div className="w-2 h-2 bg-[#0f1923] -rotate-45" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white tracking-widest">SMART//INV</div>
              <div className="text-[10px] text-gray-600 font-mono uppercase tracking-wider">Tu base, siempre equipada</div>
            </div>
          </div>
          <p className="text-[10px] text-gray-600 font-mono uppercase tracking-wider text-center">
            © 2026 Smart Inventory · Electrodomésticos con estilo táctico
          </p>
          <button
            onClick={() => navigate(isAuthenticated ? '/carrito' : '/login')}
            className="text-[10px] font-mono uppercase tracking-widest text-[#00ece0] hover:text-white transition-colors"
          >
            {isAuthenticated ? 'Ver carrito →' : 'Panel de agente →'}
          </button>
        </div>
      </footer>

      {/* Modal detalle */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#1f2326] border border-gray-800 w-full max-w-md relative"
            style={{ clipPath: 'polygon(16px 0, 100% 0, 100% 100%, 0 100%, 0 16px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 bg-gradient-to-r from-[#ff4655] via-[#00ece0] to-transparent" />

            <div className="flex items-center justify-between px-6 pt-5">
              <div>
                <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">{selected.id}</span>
                <span
                  className="ml-3 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: tierFor(selected.price).color }}
                >
                  {tierFor(selected.price).label}
                </span>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center">
                ×
              </button>
            </div>

            <div className="px-6 pt-3 pb-6">
              <div className="w-full h-52 bg-[#0f1923]/60 flex items-center justify-center mb-4 border border-gray-800/50">
                <img
                  src={selected.image}
                  alt={selected.name}
                  className="max-w-full max-h-full object-contain p-3"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              </div>

              <div className="text-base font-semibold text-white">{selected.name}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono mt-1">{selected.category}</div>

              <div className="mt-4 p-3 bg-[#0f1923]/50 border border-gray-800/60">
                <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest mb-1">Ficha del equipo</div>
                <p className="text-gray-400 text-xs leading-relaxed">{selected.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 border border-gray-800 bg-[#0f1923]/30">
                  <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Créditos</div>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">{fmt(selected.price)}</div>
                </div>
                <div className="p-3 border border-gray-800 bg-[#0f1923]/30">
                  <div className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Inventario</div>
                  <div className={`text-lg font-bold font-mono mt-0.5 ${selected.stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selected.stock > 0 ? `${selected.stock} uds` : 'Agotado'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleBuy(selected)}
                disabled={selected.stock <= 0}
                className="w-full mt-5 py-3 bg-[#ff4655] hover:bg-[#e63e4c] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold uppercase tracking-widest transition-colors"
                style={{ clipPath: CLIP_BTN }}
              >
                {selected.stock <= 0
                  ? 'Agotado'
                  : !isAuthenticated
                    ? 'Iniciar sesión para comprar'
                    : addedFeedback === selected.id
                      ? '✓ Agregado al carrito'
                      : 'Agregar al carrito'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SupportFab />
    </div>
  );
};

export default HomePage;
