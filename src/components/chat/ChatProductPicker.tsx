import { useEffect, useState } from 'react';
import { Package, Minus, Plus } from 'lucide-react';
import { getPublicProducts, searchProducts } from '../../api/productApi';
import type { ChatUiProduct } from '../../utils/chatHistory';
import { fmtCurrency } from '../../utils/currency';

interface ChatProductPickerProps {
  /** Si viene del bot, se muestran estos en vez de cargar todo el catálogo */
  initialProducts?: ChatUiProduct[];
  cartCount?: number;
  onAdd: (product: ChatUiProduct, quantity: number) => void;
  onCheckout?: () => void;
  onCancel?: () => void;
}

export function ChatProductPicker({
  initialProducts,
  cartCount = 0,
  onAdd,
  onCheckout,
  onCancel,
}: ChatProductPickerProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(!initialProducts?.length);
  const [products, setProducts] = useState<ChatUiProduct[]>(initialProducts ?? []);
  const [error, setError] = useState<string | null>(null);
  const [qtyById, setQtyById] = useState<Record<string, number>>({});
  const [justAdded, setJustAdded] = useState<string | null>(null);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        setLoading(true);
        const list = await getPublicProducts();
        if (!active) return;
        setProducts(
          list
            .filter((p) => p.active && p.stock > 0)
            .map((p) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              stock: p.stock,
              image: p.image,
              category: p.category,
            }))
        );
        setError(null);
      } catch {
        if (active) setError('No se pudieron cargar los productos.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [initialProducts]);

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    try {
      setLoading(true);
      const list = await searchProducts(q);
      setProducts(
        list.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          image: p.image,
          category: p.category,
        }))
      );
      setError(list.length === 0 ? 'Sin resultados para esa búsqueda.' : null);
    } catch {
      setError('Error buscando productos.');
    } finally {
      setLoading(false);
    }
  };

  const qty = (id: string) => qtyById[id] ?? 1;
  const setQty = (id: string, value: number, max: number) => {
    setQtyById((prev) => ({ ...prev, [id]: Math.max(1, Math.min(max, value)) }));
  };

  const handleAdd = (p: ChatUiProduct) => {
    onAdd(p, qty(p.id));
    setJustAdded(p.id);
    window.setTimeout(() => setJustAdded(null), 1200);
  };

  return (
    <div className="w-full max-w-[100%] bg-[#16191b] border border-[#00ece0]/30 p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#00ece0]">
          {initialProducts?.length ? 'Productos sugeridos' : 'Elige productos'}
          {cartCount > 0 ? ` · Carrito (${cartCount})` : ''}
        </p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[9px] font-mono uppercase text-gray-500 hover:text-white"
          >
            Cerrar
          </button>
        )}
      </div>

      <div className="flex gap-1.5">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar..."
          className="flex-1 px-2 py-1.5 bg-[#0d1117] border border-gray-700 text-white text-[10px] font-mono focus:outline-none focus:border-[#00ece0]"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="px-2 py-1.5 text-[9px] font-mono uppercase bg-[#00ece0]/15 text-[#00ece0] border border-[#00ece0]/40"
        >
          Buscar
        </button>
      </div>

      {loading ? (
        <p className="text-[10px] text-gray-500 font-mono py-4 text-center">Cargando...</p>
      ) : error && products.length === 0 ? (
        <p className="text-[10px] text-red-400 font-mono py-2">{error}</p>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {products.slice(0, 12).map((p) => (
            <div
              key={p.id}
              className="flex gap-2 p-2 bg-[#0d1117] border border-gray-800 hover:border-gray-600 transition-colors"
            >
              <div className="w-12 h-12 bg-[#1f2326] border border-gray-800 shrink-0 overflow-hidden flex items-center justify-center">
                {p.image ? (
                  <img src={p.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-4 h-4 text-gray-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-white font-bold truncate">{p.name}</p>
                <p className="text-[9px] text-gray-500 font-mono uppercase">{p.category}</p>
                <p className="text-[10px] text-[#00ece0] font-mono mt-0.5">
                  {fmtCurrency(p.price)} · Stock {p.stock}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex items-center border border-gray-700">
                    <button
                      type="button"
                      onClick={() => setQty(p.id, qty(p.id) - 1, Math.max(1, p.stock))}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 text-[10px] font-mono text-white w-6 text-center">
                      {qty(p.id)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQty(p.id, qty(p.id) + 1, Math.max(1, p.stock))}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdd(p)}
                    className="flex-1 px-2 py-1 text-[9px] font-mono uppercase tracking-wider bg-[#ff4655] text-white hover:bg-[#e63e4c]"
                  >
                    {justAdded === p.id ? 'Agregado' : 'Agregar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {onCheckout && cartCount > 0 && (
        <button
          type="button"
          onClick={onCheckout}
          className="w-full px-2 py-2 text-[10px] font-bold font-mono uppercase tracking-wider bg-[#00ece0] text-[#0f1923] hover:bg-[#00d4ce]"
        >
          Ir a pagar ({cartCount})
        </button>
      )}
    </div>
  );
}

export default ChatProductPicker;
