import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, Lock, LogOut } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'Activo' | 'Inactivo';
}

const initialProducts: Product[] = [
  { id: 'PRD-001', name: 'Laptop Dell XPS 15', category: 'Electrónicos', price: 1299, stock: 23, status: 'Activo' },
  { id: 'PRD-002', name: 'Mouse Logitech MX Master 3', category: 'Periféricos', price: 89, stock: 67, status: 'Activo' },
  { id: 'PRD-003', name: 'Monitor LG UltraWide 27"', category: 'Electrónicos', price: 399, stock: 8, status: 'Activo' },
  { id: 'PRD-004', name: 'Teclado Mecánico Keychron K2', category: 'Periféricos', price: 145, stock: 3, status: 'Activo' },
  { id: 'PRD-005', name: 'Webcam Logitech C920 HD', category: 'Accesorios', price: 79, stock: 0, status: 'Inactivo' },
  { id: 'PRD-006', name: 'Hub USB-C 7 puertos', category: 'Accesorios', price: 45, stock: 42, status: 'Activo' },
  { id: 'PRD-007', name: 'SSD Samsung 870 EVO 1TB', category: 'Almacenamiento', price: 119, stock: 56, status: 'Activo' },
];

export const ProductsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const isAdmin = user?.role === 'admin';
  const isReadOnly = user?.role === 'asesor';

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const handleDelete = (id: string) => {
    if (isReadOnly) return;
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 font-mono">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
              Productos <span className="text-[#00ece0]">//</span> Catálogo
            </h1>
            <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">
              Gestión de Inventario
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

      {/* Contenido Principal */}
      <div className="bg-[#16191b] border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-sm font-bold uppercase tracking-wider">
            Lista de Productos
          </h2>
          {!isReadOnly && (
            <button className="px-4 py-2 bg-[#00ece0] hover:bg-[#00d4ce] text-[#0d1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </button>
          )}
          {isReadOnly && (
            <button disabled className="px-4 py-2 bg-gray-700 text-gray-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Nuevo Producto
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
            <option value="Electrónicos">Electrónicos</option>
            <option value="Periféricos">Periféricos</option>
            <option value="Accesorios">Accesorios</option>
            <option value="Almacenamiento">Almacenamiento</option>
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
                        product.status === 'Activo'
                          ? 'bg-[#00ece0]/10 text-[#00ece0] border border-[#00ece0]/30'
                          : 'bg-[#ff4655]/10 text-[#ff4655] border border-[#ff4655]/30'
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
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
                        onClick={() => handleDelete(product.id)}
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
    </div>
  );
};

export default ProductsPage;
