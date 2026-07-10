import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Lock, LogOut, Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
}

const initialProducts: Product[] = [
  { id: 'PRD-001', name: 'NVIDIA RTX 4090 Founders Edition', category: 'GPU', stock: 3 },
  { id: 'PRD-002', name: 'AMD Ryzen 9 7950X', category: 'CPU', stock: 12 },
  { id: 'PRD-003', name: 'Samsung 990 Pro 2TB NVMe', category: 'Storage', stock: 25 },
  { id: 'PRD-004', name: 'Corsair DDR5 32GB 6000MHz', category: 'RAM', stock: 4 },
  { id: 'PRD-005', name: 'ASUS ROG Strix RTX 4080', category: 'GPU', stock: 0 },
  { id: 'PRD-006', name: 'Intel Core i9-14900K', category: 'CPU', stock: 18 },
];

export const InventoryPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isAdmin = user?.role === 'admin';
  const isReadOnly = user?.role === 'asesor';

  const adjustStock = (id: string, delta: number) => {
    if (isReadOnly) return;
    setProducts(products.map(p => 
      p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
    ));
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 font-mono">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
              Inventario <span className="text-[#00ece0]">//</span> Ajustes
            </h1>
            <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">
              Gestión Rápida de Stock
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
            Ajustes de Stock (+1 / -1)
          </h2>
          <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
            Sin registro de motivos
          </div>
        </div>

        {/* Búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] font-mono"
            />
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-mono">ID</th>
                <th className="text-left pb-3 font-mono">Producto</th>
                <th className="text-left pb-3 font-mono">Categoría</th>
                <th className="text-center pb-3 font-mono">Stock</th>
                <th className="text-center pb-3 font-mono">Ajustes</th>
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
                  <td className="py-3 text-center font-mono font-bold text-lg">{product.stock}</td>
                  <td className="py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => adjustStock(product.id, -1)}
                        disabled={isReadOnly || product.stock === 0}
                        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                          isReadOnly || product.stock === 0
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            : 'bg-[#ff4655]/10 text-[#ff4655] hover:bg-[#ff4655] hover:text-white'
                        }`}
                        title={isReadOnly ? 'Acceso restringido' : 'Reducir stock'}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => adjustStock(product.id, 1)}
                        disabled={isReadOnly}
                        className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                          isReadOnly
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                            : 'bg-[#00ece0]/10 text-[#00ece0] hover:bg-[#00ece0] hover:text-[#0d1117]'
                        }`}
                        title={isReadOnly ? 'Acceso restringido' : 'Aumentar stock'}
                      >
                        <Plus className="w-4 h-4" />
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
            No se encontraron productos que coincidan con la búsqueda.
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
