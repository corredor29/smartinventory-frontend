import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, AlertTriangle, Package, DollarSign, Clock, Lock, TrendingUp, ShoppingCart, FileText, ImagePlus, History } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDashboardMetrics, type DashboardMetrics } from '../../api/dashboardApi';
import {
  getPublicProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  resolveProductImageUrl,
} from '../../api/productApi';
import { getCategories, type CategoryDto } from '../../api/categoryApi';
import { adjustStock } from '../../api/inventoryApi';
import {
  getAllMovements,
  type InventoryMovementDto,
} from '../../api/inventoryMovementApi';
import { StaffHeader } from '../../components/StaffHeader';
import type { Product as ApiProduct } from '../../types/product';

// ─── Tipos de Datos ────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStock: number;
  status: 'active' | 'critical' | 'out_of_stock';
  lastUpdated: string;
  imageUrl?: string;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  productId?: string;
  timestamp: string;
}

const DEFAULT_MIN_STOCK = 5;

function mapApiProductToDashboard(p: ApiProduct): Product {
  const status: Product['status'] =
    p.stock === 0 ? 'out_of_stock' : p.stock <= DEFAULT_MIN_STOCK ? 'critical' : 'active';
  const raw = p.image || '';
  const imageUrl =
    !raw || raw.includes('placeholder')
      ? ''
      : raw.includes('/uploads/')
        ? raw.slice(raw.indexOf('/uploads/'))
        : raw;
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    stock: p.stock,
    minStock: DEFAULT_MIN_STOCK,
    status,
    lastUpdated: new Date().toISOString().split('T')[0],
    imageUrl,
  };
}

function buildAlertsFromProducts(products: Product[]): Alert[] {
  return products
    .filter((p) => p.status === 'critical' || p.status === 'out_of_stock')
    .map((p) => ({
      id: `ALT-${p.id}`,
      type: (p.status === 'out_of_stock' ? 'critical' : 'warning') as Alert['type'],
      message:
        p.status === 'out_of_stock'
          ? `Producto agotado: ${p.name}`
          : `Stock crítico: ${p.name} (${p.stock} unidades)`,
      productId: p.id,
      timestamp: new Date().toLocaleString('es-CO'),
    }));
}

// Colores asignados por índice para el gráfico de categorías (el backend no envía color)
const CATEGORY_COLORS = ['#00ece0', '#ff4655', '#fbbf24', '#c084fc', '#34d399'];

// ─── Componentes del Dashboard ────────────────────────────────────────────────────

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}> = ({ title, value, icon, color, trend }) => {
  const CLIP_CARD = 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)';

  return (
    <div
      className="bg-[#16191b] border border-gray-800 p-6 relative overflow-hidden"
      style={{ clipPath: CLIP_CARD }}
    >
      <div className="absolute top-0 right-0 w-20 h-20 opacity-5" style={{ backgroundColor: color }} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2" style={{ backgroundColor: `${color}20` }}>
            <div style={{ color }}>{icon}</div>
          </div>
          {trend && (
            <span className="text-xs font-mono" style={{ color }}>
              {trend}
            </span>
          )}
        </div>
        <h3 className="text-gray-500 text-xs font-mono uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-white text-2xl font-bold font-mono">{value}</p>
      </div>
    </div>
  );
};

const ProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  onSave: (product: Omit<Product, 'id' | 'lastUpdated'>) => void | Promise<void>;
  isReadOnly: boolean;
  categories: string[];
}> = ({ isOpen, onClose, product, onSave, isReadOnly, categories }) => {
  const [formData, setFormData] = useState(
    product || {
      name: '',
      category: '',
      price: 0,
      stock: 0,
      minStock: 5,
      status: 'active' as const,
      imageUrl: '',
    }
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setFormData(
      product || {
        name: '',
        category: '',
        price: 0,
        stock: 0,
        minStock: 5,
        status: 'active' as const,
        imageUrl: '',
      },
    );
    setImageFile(null);
    setImagePreview(product?.imageUrl || null);
    setFormError(null);
  }, [isOpen, product]);

  if (!isOpen) return null;

  const CLIP_MODAL = 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)';

  const handleImagePick = (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setImagePreview(formData.imageUrl || null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setFormError('El archivo debe ser una imagen (JPG, PNG, WEBP o GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError('La imagen no puede superar 5 MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormError(null);
  };

  const handleSaveClick = async () => {
    if (isReadOnly || saving) return;
    setSaving(true);
    setFormError(null);
    try {
      let imageUrl = formData.imageUrl?.trim() || '';
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }
      await onSave({ ...formData, imageUrl });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as { message?: string })?.message ||
        'No se pudo guardar el producto.';
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-lg bg-[#16191b] border border-gray-700 p-6 relative max-h-[90vh] overflow-y-auto"
        style={{ clipPath: CLIP_MODAL }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
          <h2 className="text-white font-bold font-mono uppercase tracking-wider">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          {isReadOnly && (
            <div className="flex items-center gap-2 text-[#ff4655] text-xs font-mono uppercase">
              <Lock className="w-3 h-3" />
              Solo lectura
            </div>
          )}
        </div>

        {formError && (
          <div className="mb-4 px-3 py-2 bg-[#ff4655]/10 border border-[#ff4655]/30 text-[#ff4655] text-xs">
            {formError}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Nombre del Producto
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              placeholder="Ej: NVIDIA RTX 4090"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={isReadOnly}
              className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] disabled:opacity-50 disabled:cursor-not-allowed font-mono"
            >
              <option value="">Seleccionar...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Precio (USD)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                disabled={isReadOnly}
                className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Stock Actual {product ? '(se ajusta al guardar)' : '(stock inicial)'}
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                disabled={isReadOnly}
                className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Stock Mínimo
            </label>
            <input
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
              disabled={isReadOnly}
              className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] disabled:opacity-50 disabled:cursor-not-allowed font-mono"
              placeholder="5"
            />
          </div>

          {!isReadOnly && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Imagen del producto
              </label>
              <div className="flex gap-4 items-start">
                <div className="w-24 h-24 border border-gray-700 bg-[#0d1117] flex items-center justify-center overflow-hidden shrink-0">
                  {imagePreview ? (
                    <img
                      src={
                        imagePreview.startsWith('/uploads/')
                          ? resolveProductImageUrl(imagePreview)
                          : imagePreview
                      }
                      alt="Vista previa"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImagePlus className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="inline-flex items-center gap-2 px-3 py-2 bg-[#0d1117] border border-gray-700 hover:border-[#00ece0] text-gray-300 hover:text-[#00ece0] text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors">
                    <ImagePlus className="w-3.5 h-3.5" />
                    {imageFile ? 'Cambiar archivo' : 'Subir imagen'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => handleImagePick(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  <p className="text-[10px] text-gray-600">JPG, PNG, WEBP o GIF · máx. 5 MB</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          {!isReadOnly && (
            <button
              onClick={handleSaveClick}
              disabled={saving}
              className="flex-1 py-2 bg-[#00ece0] hover:bg-[#00d4ce] text-[#0d1117] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : product ? 'Guardar Cambios' : 'Agregar Producto'}
            </button>
          )}
          {isReadOnly && (
            <button
              disabled
              className="flex-1 py-2 bg-gray-700 text-gray-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Lock className="w-3 h-3" />
              Acceso Restringido
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard Principal ────────────────────────────────────────────────────────

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryDtos, setCategoryDtos] = useState<CategoryDto[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // ─── Métricas reales del backend ────────────────────────────────────────────
  const [metricsData, setMetricsData] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [recentMovements, setRecentMovements] = useState<InventoryMovementDto[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(true);

  useEffect(() => {
    getDashboardMetrics()
      .then(setMetricsData)
      .catch((err) => {
        console.error('Error cargando métricas del dashboard:', err);
        setMetricsError('No se pudieron cargar las métricas del servidor.');
      })
      .finally(() => setLoadingMetrics(false));
  }, []);

  useEffect(() => {
    getAllMovements()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setRecentMovements(sorted.slice(0, 10));
      })
      .catch((err) => {
        console.error('Error cargando movimientos recientes:', err);
      })
      .finally(() => setLoadingMovements(false));
  }, []);

  useEffect(() => {
    Promise.all([getPublicProducts(), getCategories()])
      .then(([apiProducts, cats]) => {
        const mapped = apiProducts.map(mapApiProductToDashboard);
        setProducts(mapped);
        setAlerts(buildAlertsFromProducts(mapped));
        setCategoryDtos(cats);
      })
      .catch((err) => {
        console.error('Error cargando productos del dashboard:', err);
        setProductsError('No se pudieron cargar los productos.');
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  const categoryNames = useMemo(() => {
    const fromApi = categoryDtos.map((c) => c.name);
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    return Array.from(new Set([...fromApi, ...fromProducts])).sort();
  }, [categoryDtos, products]);

  const userRoleLower = user?.role?.toLowerCase();
  const isAdmin = userRoleLower === 'admin';
  const isReadOnly = userRoleLower === 'asesor' || userRoleLower === 'operator';

  // ─── Filtros ─────────────────────────────────────────────────────────────────

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  // ─── Handlers de Acciones ─────────────────────────────────────────────────────

  const handleAddProduct = () => {
    if (isReadOnly) return;
    setSelectedProduct(undefined);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    if (isReadOnly) return;
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (isReadOnly) return;
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await deleteProduct(productId);
      const next = products.filter((p) => p.id !== productId);
      setProducts(next);
      setAlerts(buildAlertsFromProducts(next));
    } catch (err) {
      console.error('Error eliminando producto:', err);
      setProductsError('No se pudo eliminar el producto.');
    }
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'lastUpdated'>) => {
    if (isReadOnly) return;

    const category = categoryDtos.find(
      (c) => c.name.toLowerCase() === productData.category.toLowerCase()
    );
    if (!category) {
      setProductsError('Selecciona una categoría válida existente en el sistema.');
      return;
    }

    try {
      if (selectedProduct) {
        const updated = await updateProduct(selectedProduct.id, {
          name: productData.name,
          price: productData.price,
          categoryId: category.categoryId,
          imageUrl: productData.imageUrl || undefined,
        });

        const stockDelta = productData.stock - selectedProduct.stock;
        if (stockDelta !== 0) {
          await adjustStock(
            Number(selectedProduct.id),
            stockDelta,
            stockDelta > 0
              ? 'Ajuste desde edición de producto'
              : 'Ajuste por reducción de stock',
          );
        }

        const mapped = mapApiProductToDashboard(updated);
        mapped.stock = productData.stock;
        mapped.minStock = productData.minStock;
        mapped.status =
          productData.stock === 0
            ? 'out_of_stock'
            : productData.stock <= mapped.minStock
              ? 'critical'
              : 'active';
        const next = products.map((p) => (p.id === selectedProduct.id ? mapped : p));
        setProducts(next);
        setAlerts(buildAlertsFromProducts(next));
      } else {
        const created = await createProduct({
          name: productData.name,
          price: productData.price,
          categoryId: category.categoryId,
          productStatusId: 1,
          initialStock: productData.stock,
          imageUrl: productData.imageUrl || undefined,
        });
        const mapped = mapApiProductToDashboard(created);
        mapped.stock = created.stock;
        mapped.minStock = productData.minStock;
        mapped.status =
          mapped.stock === 0
            ? 'out_of_stock'
            : mapped.stock <= mapped.minStock
              ? 'critical'
              : 'active';
        const next = [...products, mapped];
        setProducts(next);
        setAlerts(buildAlertsFromProducts(next));
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error guardando producto:', err);
      setProductsError('No se pudo guardar el producto.');
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const CLIP_BTN = 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)';

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 font-mono">
      <StaffHeader
        title={
          <>
            Panel de Control <span className="text-[#00ece0]">//</span> Dashboard
          </>
        }
        subtitle="Sistema de Gestión de Inventario v2.4.1"
        showReadOnly
      >
        {metricsError && (
          <div className="mt-2 px-3 py-2 bg-[#ff4655]/10 border border-[#ff4655]/30 text-[#ff4655] text-xs">
            {metricsError}
          </div>
        )}
        {productsError && (
          <div className="mt-2 px-3 py-2 bg-[#ff4655]/10 border border-[#ff4655]/30 text-[#ff4655] text-xs">
            {productsError}
          </div>
        )}
      </StaffHeader>

      {/* Métricas Tácticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          title="Total Productos"
          value={loadingMetrics ? '...' : metricsData?.totalProducts ?? 0}
          icon={<Package className="w-5 h-5" />}
          color="#00ece0"
        />
        <MetricCard
          title="Ventas del Día"
          value={loadingMetrics ? '...' : `$${(metricsData?.dailySalesTotal ?? 0).toLocaleString()}`}
          icon={<DollarSign className="w-5 h-5" />}
          color="#ff4655"
        />
        <MetricCard
          title="Bajo Stock"
          value={loadingMetrics ? '...' : metricsData?.lowStockCount ?? 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="#fbbf24"
        />
        <MetricCard
          title="Ventas Chatbot"
          value={loadingMetrics ? '...' : metricsData?.chatbotSalesCount ?? 0}
          icon={<Clock className="w-5 h-5" />}
          color="#c084fc"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de Ventas Semanales */}
        <div className="bg-[#16191b] border border-gray-800 p-6">
          <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00ece0]" />
            Ventas Semanales
          </h3>
          {loadingMetrics ? (
            <div className="h-[250px] flex items-center justify-center text-gray-500 text-xs">Cargando...</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={metricsData?.weeklySales ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="day" stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16191b',
                    border: '1px solid #21262d',
                    borderRadius: '8px',
                  }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Legend />
                <Line type="monotone" dataKey="manual" stroke="#00ece0" strokeWidth={2} name="Manual" />
                <Line type="monotone" dataKey="chatbot" stroke="#ff4655" strokeWidth={2} name="Chatbot" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Gráfico de Ventas por Categoría */}
        <div className="bg-[#16191b] border border-gray-800 p-6">
          <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#ff4655]" />
            Ventas por Categoría
          </h3>
          {loadingMetrics ? (
            <div className="h-[250px] flex items-center justify-center text-gray-500 text-xs">Cargando...</div>
          ) : (metricsData?.categorySales?.length ?? 0) === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-gray-500 text-xs">
              Aún no hay ventas registradas.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={metricsData!.categorySales}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {metricsData!.categorySales.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#16191b',
                      border: '1px solid #21262d',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                {metricsData!.categorySales.map((item, index) => (
                  <div key={item.categoryName} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}
                    />
                    <span className="text-xs text-gray-400">{item.categoryName}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Últimas Facturas */}
      <div className="bg-[#16191b] border border-gray-800 p-6 mb-8">
        <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#fbbf24]" />
          Últimas Facturas
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-mono">Factura</th>
                <th className="text-left pb-3 font-mono">Cliente</th>
                <th className="text-left pb-3 font-mono">Fecha</th>
                <th className="text-right pb-3 font-mono">Monto</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {loadingMetrics ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">Cargando...</td>
                </tr>
              ) : (metricsData?.recentInvoices?.length ?? 0) === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-500">Aún no hay facturas registradas.</td>
                </tr>
              ) : (
                metricsData!.recentInvoices.map((invoice) => (
                  <tr key={invoice.invoiceNumber} className="border-b border-gray-800/50 hover:bg-[#0d1117]/50 transition-colors">
                    <td className="py-3 font-mono text-[#00ece0]">{invoice.invoiceNumber}</td>
                    <td className="py-3 font-semibold">{invoice.customerName}</td>
                    <td className="py-3 font-mono">{new Date(invoice.issueDate).toLocaleDateString()}</td>
                    <td className="py-3 text-right font-mono">${invoice.total.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#ff4655]" />
            Alertas del Sistema
          </h2>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 border-l-4 ${
                  alert.type === 'critical'
                    ? 'bg-[#ff4655]/10 border-[#ff4655] text-[#ff4655]'
                    : alert.type === 'warning'
                    ? 'bg-[#fbbf24]/10 border-[#fbbf24] text-[#fbbf24]'
                    : 'bg-[#00ece0]/10 border-[#00ece0] text-[#00ece0]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono">{alert.message}</span>
                  <span className="text-[10px] opacity-60 font-mono">{alert.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Movimientos recientes */}
      <div className="mb-8 bg-[#16191b] border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-[#00ece0]" />
            Movimientos recientes
          </h2>
          <button
            onClick={() => navigate('/movimientos')}
            className="text-[10px] uppercase tracking-wider text-zinc-400 hover:text-[#00ece0] transition-colors"
          >
            Ver todos
          </button>
        </div>
        {loadingMovements ? (
          <p className="text-gray-500 text-xs">Cargando...</p>
        ) : recentMovements.length === 0 ? (
          <p className="text-gray-500 text-xs">Sin movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                  <th className="text-left pb-2 font-mono">Fecha</th>
                  <th className="text-left pb-2 font-mono">Producto</th>
                  <th className="text-left pb-2 font-mono">Tipo</th>
                  <th className="text-right pb-2 font-mono">Cant.</th>
                  <th className="text-left pb-2 font-mono">Motivo</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {recentMovements.map((m) => (
                  <tr key={m.movementId} className="border-b border-gray-800/40">
                    <td className="py-2 font-mono text-[10px] text-gray-400">
                      {new Date(m.createdAt).toLocaleString('es-CO', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-2">{m.productName || `Inv #${m.inventoryId}`}</td>
                    <td
                      className={`py-2 ${
                        m.movementTypeName.toLowerCase().includes('entrada')
                          ? 'text-[#00ece0]'
                          : m.movementTypeName.toLowerCase().includes('salida')
                            ? 'text-[#ff4655]'
                            : 'text-amber-400'
                      }`}
                    >
                      {m.movementTypeName || '—'}
                    </td>
                    <td className="py-2 text-right font-mono">{m.quantity}</td>
                    <td className="py-2 text-gray-400 truncate max-w-[200px]">
                      {m.reason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tabla de Inventario */}
      <div className="bg-[#16191b] border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Package className="w-4 h-4 text-[#00ece0]" />
            Inventario de Hardware
          </h2>
          {!isReadOnly && (
            <button
              onClick={handleAddProduct}
              className="px-4 py-2 bg-[#00ece0] hover:bg-[#00d4ce] text-[#0d1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
              style={{ clipPath: CLIP_BTN }}
            >
              <Plus className="w-4 h-4" />
              Agregar Producto
            </button>
          )}
          {isReadOnly && (
            <button
              disabled
              className="px-4 py-2 bg-gray-700 text-gray-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed flex items-center gap-2"
              style={{ clipPath: CLIP_BTN }}
            >
              <Lock className="w-4 h-4" />
              Agregar Producto
            </button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] font-mono"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
          >
            <option value="all">Todas las Categorías</option>
            {categoryNames.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-mono">ID</th>
                <th className="text-left pb-3 font-mono">Producto</th>
                <th className="text-left pb-3 font-mono">Categoría</th>
                <th className="text-right pb-3 font-mono">Precio</th>
                <th className="text-right pb-3 font-mono">Stock</th>
                <th className="text-center pb-3 font-mono">Estado</th>
                <th className="text-center pb-3 font-mono">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {loadingProducts ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">Cargando productos...</td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-gray-800/50 hover:bg-[#0d1117]/50 transition-colors">
                  <td className="py-3 font-mono text-[#00ece0]">{product.id}</td>
                  <td className="py-3 font-semibold">{product.name}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-[#0d1117] border border-gray-700 text-[10px] uppercase">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono">${product.price.toLocaleString()}</td>
                  <td className="py-3 text-right font-mono">{product.stock}</td>
                  <td className="py-3 text-center">
                    <span
                      className={`px-2 py-1 text-[10px] font-bold uppercase ${
                        product.status === 'active'
                          ? 'bg-[#00ece0]/10 text-[#00ece0] border border-[#00ece0]/30'
                          : product.status === 'critical'
                          ? 'bg-[#ff4655]/10 text-[#ff4655] border border-[#ff4655]/30'
                          : 'bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30'
                      }`}
                    >
                      {product.status === 'active'
                        ? 'Activo'
                        : product.status === 'critical'
                        ? 'Crítico'
                        : 'Agotado'}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        disabled={isReadOnly}
                        className={`p-1.5 transition-colors ${
                          isReadOnly
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-500 hover:text-[#00ece0]'
                        }`}
                        title={isReadOnly ? 'Acceso restringido' : 'Editar'}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={isReadOnly}
                        className={`p-1.5 transition-colors ${
                          isReadOnly
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-500 hover:text-[#ff4655]'
                        }`}
                        title={isReadOnly ? 'Acceso restringido' : 'Eliminar'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loadingProducts && filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            No se encontraron productos que coincidan con los filtros.
          </div>
        )}
      </div>

      {/* Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        onSave={handleSaveProduct}
        isReadOnly={isReadOnly}
        categories={categoryNames}
      />
    </div>
  );
};

export default DashboardPage;