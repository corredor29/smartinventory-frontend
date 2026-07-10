import React, { useState, useMemo } from 'react';

import { useAuth } from '../../context/AuthContext';

import { useNavigate } from 'react-router-dom';

import { Plus, Edit, Trash2, Search, AlertTriangle, Package, DollarSign, Clock, Lock, TrendingUp, ShoppingCart, FileText, LogOut } from 'lucide-react';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';



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

}



interface Alert {

  id: string;

  type: 'critical' | 'warning' | 'info';

  message: string;

  productId?: string;

  timestamp: string;

}



interface Report {

  id: string;

  type: 'sale' | 'restock' | 'adjustment';

  description: string;

  amount: number;

  timestamp: string;

}



// ─── Datos Mock Iniciales ───────────────────────────────────────────────────────



const initialProducts: Product[] = [

  {

    id: 'PRD-001',

    name: 'NVIDIA RTX 4090 Founders Edition',

    category: 'GPU',

    price: 1599,

    stock: 3,

    minStock: 5,

    status: 'critical',

    lastUpdated: '2024-01-15',

  },

  {

    id: 'PRD-002',

    name: 'AMD Ryzen 9 7950X',

    category: 'CPU',

    price: 699,

    stock: 12,

    minStock: 10,

    status: 'active',

    lastUpdated: '2024-01-14',

  },

  {

    id: 'PRD-003',

    name: 'Samsung 990 Pro 2TB NVMe',

    category: 'Storage',

    price: 189,

    stock: 25,

    minStock: 15,

    status: 'active',

    lastUpdated: '2024-01-13',

  },

  {

    id: 'PRD-004',

    name: 'Corsair DDR5 32GB 6000MHz',

    category: 'RAM',

    price: 149,

    stock: 4,

    minStock: 8,

    status: 'critical',

    lastUpdated: '2024-01-15',

  },

  {

    id: 'PRD-005',

    name: 'ASUS ROG Strix RTX 4080',

    category: 'GPU',

    price: 1199,

    stock: 0,

    minStock: 5,

    status: 'out_of_stock',

    lastUpdated: '2024-01-12',

  },

  {

    id: 'PRD-006',

    name: 'Intel Core i9-14900K',

    category: 'CPU',

    price: 589,

    stock: 18,

    minStock: 10,

    status: 'active',

    lastUpdated: '2024-01-14',

  },

];



const initialAlerts: Alert[] = [

  {

    id: 'ALT-001',

    type: 'critical',

    message: 'Stock crítico: NVIDIA RTX 4090 (3 unidades)',

    productId: 'PRD-001',

    timestamp: '2024-01-15 09:30',

  },

  {

    id: 'ALT-002',

    type: 'critical',

    message: 'Producto agotado: ASUS ROG Strix RTX 4080',

    productId: 'PRD-005',

    timestamp: '2024-01-15 08:15',

  },

  {

    id: 'ALT-003',

    type: 'warning',

    message: 'Stock bajo: Corsair DDR5 32GB (4 unidades)',

    productId: 'PRD-004',

    timestamp: '2024-01-15 07:45',

  },

];



const initialReports: Report[] = [

  {

    id: 'RPT-001',

    type: 'sale',

    description: 'Venta: NVIDIA RTX 4090 x2',

    amount: 3198,

    timestamp: '2024-01-15 14:30',

  },

  {

    id: 'RPT-002',

    type: 'restock',

    description: 'Reposición: AMD Ryzen 9 7950X x10',

    amount: -6990,

    timestamp: '2024-01-15 10:00',

  },

  {

    id: 'RPT-003',

    type: 'sale',

    description: 'Venta: Samsung 990 Pro 2TB x5',

    amount: 945,

    timestamp: '2024-01-15 09:15',

  },

];



// Datos para gráficos

const weeklySalesData = [

  { day: 'Lun', manual: 4500, chatbot: 1200 },

  { day: 'Mar', manual: 5200, chatbot: 1800 },

  { day: 'Mié', manual: 4800, chatbot: 2100 },

  { day: 'Jue', manual: 6100, chatbot: 2400 },

  { day: 'Vie', manual: 7200, chatbot: 3200 },

  { day: 'Sáb', manual: 5800, chatbot: 2800 },

  { day: 'Dom', manual: 4200, chatbot: 1500 },

];



const categorySalesData = [

  { name: 'Electrónicos', value: 35, color: '#00ece0' },

  { name: 'Periféricos', value: 25, color: '#ff4655' },

  { name: 'Accesorios', value: 20, color: '#fbbf24' },

  { name: 'Almacenamiento', value: 15, color: '#c084fc' },

  { name: 'Audio', value: 5, color: '#34d399' },

];



const recentInvoices = [

  { id: 'INV-001', client: 'Carlos Vega', date: '2024-01-15', amount: 3198 },

  { id: 'INV-002', client: 'María González', date: '2024-01-15', amount: 945 },

  { id: 'INV-003', client: 'Juan Pérez', date: '2024-01-14', amount: 1890 },

  { id: 'INV-004', client: 'Ana López', date: '2024-01-14', amount: 699 },

  { id: 'INV-005', client: 'Pedro Sánchez', date: '2024-01-13', amount: 2598 },

];



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

  onSave: (product: Omit<Product, 'id' | 'lastUpdated'>) => void;

  isReadOnly: boolean;

}> = ({ isOpen, onClose, product, onSave, isReadOnly }) => {

  const [formData, setFormData] = useState(

    product || {

      name: '',

      category: '',

      price: 0,

      stock: 0,

      minStock: 5,

      status: 'active' as const,

    }

  );

  const isNewProduct = !product;



  if (!isOpen) return null;



  const CLIP_MODAL = 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)';



  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">

      <div

        className="w-full max-w-lg bg-[#16191b] border border-gray-700 p-6 relative"

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

              <option value="GPU">GPU</option>

              <option value="CPU">CPU</option>

              <option value="RAM">RAM</option>

              <option value="Storage">Storage</option>

              <option value="Motherboard">Motherboard</option>

              <option value="PSU">PSU</option>

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

                Stock Actual

              </label>

              <input

                type="number"

                value={formData.stock}

                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}

                disabled={isReadOnly || isNewProduct}

                className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] disabled:opacity-50 disabled:cursor-not-allowed font-mono"

                placeholder="0"

              />

              {isNewProduct && (

                <p className="text-[10px] text-[#ff4655] mt-1 uppercase tracking-wider">

                  Stock inicial: 0 // Ajustar manualmente en Inventario

                </p>

              )}

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

        </div>



        {/* Actions */}

        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">

          <button

            onClick={onClose}

            className="flex-1 py-2 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"

          >

            Cancelar

          </button>

          {!isReadOnly && (

            <button

              onClick={() => onSave(formData)}

              className="flex-1 py-2 bg-[#00ece0] hover:bg-[#00d4ce] text-[#0d1117] text-xs font-bold uppercase tracking-wider transition-colors"

            >

              {product ? 'Guardar Cambios' : 'Agregar Producto'}

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

  const { user, logout } = useAuth();

  const navigate = useNavigate();



  const handleLogout = () => {

    logout();

    navigate('/', { replace: true });

  };

  const [products, setProducts] = useState<Product[]>(initialProducts);

  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);

  const [searchTerm, setSearchTerm] = useState('');

  const [categoryFilter, setCategoryFilter] = useState('all');

  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  const [isModalOpen, setIsModalOpen] = useState(false);



  const isAdmin = user?.role === 'admin';

  const isReadOnly = user?.role === 'asesor';



  // ─── Cálculos de Métricas ────────────────────────────────────────────────────



  const metrics = useMemo(() => {

    const totalProducts = products.length;

    const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

    const criticalStock = products.filter((p) => p.status === 'critical').length;

    const outOfStock = products.filter((p) => p.status === 'out_of_stock').length;

    const dailySales = 12450;

    const chatbotSales = 37;



    return {

      totalProducts,

      totalValue,

      criticalStock,

      outOfStock,

      dailySales,

      chatbotSales,

    };

  }, [products]);



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



  const handleDeleteProduct = (productId: string) => {

    if (isReadOnly) return;

    if (window.confirm('¿Estás seguro de eliminar este producto?')) {

      setProducts(products.filter((p) => p.id !== productId));

      setAlerts(alerts.filter((a) => a.productId !== productId));

    }

  };



  const handleSaveProduct = (productData: Omit<Product, 'id' | 'lastUpdated'>) => {

    if (isReadOnly) return;



    if (selectedProduct) {

      // Editar producto existente

      setProducts(

        products.map((p) =>

          p.id === selectedProduct.id

            ? {

                ...p,

                ...productData,

                status:

                  productData.stock === 0

                    ? 'out_of_stock'

                    : productData.stock <= productData.minStock

                    ? 'critical'

                    : 'active',

                lastUpdated: new Date().toISOString().split('T')[0],

              }

            : p

        )

      );

    } else {

      // Agregar nuevo producto

      const newProduct: Product = {

        ...productData,

        id: `PRD-${String(products.length + 1).padStart(3, '0')}`,

        status:

          productData.stock === 0

            ? 'out_of_stock'

            : productData.stock <= productData.minStock

            ? 'critical'

            : 'active',

        lastUpdated: new Date().toISOString().split('T')[0],

      };

      setProducts([...products, newProduct]);

    }

    setIsModalOpen(false);

  };



  // ─── Render ─────────────────────────────────────────────────────────────────



  const CLIP_BTN = 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)';



  return (

    <div className="min-h-screen bg-[#0d1117] p-6 font-mono">

      {/* Header */}

      <div className="mb-8">

        <div className="flex items-center justify-between mb-4">

          <div>

            <h1 className="text-2xl font-bold text-white uppercase tracking-wider">

              Panel de Control <span className="text-[#00ece0]">//</span> Dashboard

            </h1>

            <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">

              Sistema de Gestión de Inventario v2.4.1

            </p>

          </div>

          <div className="flex items-center gap-3">

            <div className="px-3 py-1.5 bg-[#16191b] border border-gray-800">

              <span className="text-gray-500 text-xs uppercase tracking-wider">Rol:</span>

              <span className={`ml-2 text-xs font-bold uppercase ${

                isAdmin ? 'text-[#ff4655]' : 'text-[#00ece0]'

              }`}>

                {user?.role === 'admin' ? 'Admin' : 'Asesor'}

              </span>

            </div>

            {isReadOnly && (

              <div className="px-3 py-1.5 bg-[#ff4655]/10 border border-[#ff4655]/30 flex items-center gap-2">

                <Lock className="w-3 h-3 text-[#ff4655]" />

                <span className="text-[#ff4655] text-xs font-bold uppercase tracking-wider">

                  Solo Lectura

                </span>

              </div>

            )}

            <button

              onClick={handleLogout}

              className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 text-[10px] font-mono uppercase tracking-wider transition-all rounded"

            >

              <LogOut className="w-4 h-4" />

              Cerrar Sesión

            </button>

          </div>

        </div>

      </div>



      {/* Métricas Tácticas */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

        <MetricCard

          title="Total Productos"

          value={metrics.totalProducts}

          icon={<Package className="w-5 h-5" />}

          color="#00ece0"

          trend="+12.5%"

        />

        <MetricCard

          title="Ventas del Día"

          value={`$${metrics.dailySales.toLocaleString()}`}

          icon={<DollarSign className="w-5 h-5" />}

          color="#ff4655"

        />

        <MetricCard

          title="Bajo Stock"

          value={metrics.criticalStock}

          icon={<AlertTriangle className="w-5 h-5" />}

          color="#fbbf24"

        />

        <MetricCard

          title="Ventas Chatbot"

          value={metrics.chatbotSales}

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

          <ResponsiveContainer width="100%" height={250}>

            <LineChart data={weeklySalesData}>

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

        </div>



        {/* Gráfico de Ventas por Categoría */}

        <div className="bg-[#16191b] border border-gray-800 p-6">

          <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">

            <ShoppingCart className="w-4 h-4 text-[#ff4655]" />

            Ventas por Categoría

          </h3>

          <ResponsiveContainer width="100%" height={250}>

            <PieChart>

              <Pie

                data={categorySalesData}

                cx="50%"

                cy="50%"

                innerRadius={60}

                outerRadius={80}

                paddingAngle={5}

                dataKey="value"

              >

                {categorySalesData.map((entry, index) => (

                  <Cell key={`cell-${index}`} fill={entry.color} />

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

            {categorySalesData.map((item) => (

              <div key={item.name} className="flex items-center gap-2">

                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />

                <span className="text-xs text-gray-400">{item.name}</span>

              </div>

            ))}

          </div>

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

                <th className="text-left pb-3 font-mono">ID</th>

                <th className="text-left pb-3 font-mono">Cliente</th>

                <th className="text-left pb-3 font-mono">Fecha</th>

                <th className="text-right pb-3 font-mono">Monto</th>

              </tr>

            </thead>

            <tbody className="text-gray-300">

              {recentInvoices.map((invoice) => (

                <tr key={invoice.id} className="border-b border-gray-800/50 hover:bg-[#0d1117]/50 transition-colors">

                  <td className="py-3 font-mono text-[#00ece0]">{invoice.id}</td>

                  <td className="py-3 font-semibold">{invoice.client}</td>

                  <td className="py-3 font-mono">{invoice.date}</td>

                  <td className="py-3 text-right font-mono">${invoice.amount.toLocaleString()}</td>

                </tr>

              ))}

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

            <option value="GPU">GPU</option>

            <option value="CPU">CPU</option>

            <option value="RAM">RAM</option>

            <option value="Storage">Storage</option>

            <option value="Motherboard">Motherboard</option>

            <option value="PSU">PSU</option>

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

              {filteredProducts.map((product) => (

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

              ))}

            </tbody>

          </table>

        </div>



        {filteredProducts.length === 0 && (

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

      />

    </div>

  );

};



export default DashboardPage;