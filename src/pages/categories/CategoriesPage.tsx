import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Lock, LogOut } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
}

const initialCategories: Category[] = [
  { id: 'CAT-001', name: 'Electrónicos', description: 'Componentes electrónicos y dispositivos', productCount: 45 },
  { id: 'CAT-002', name: 'Periféricos', description: 'Ratones, teclados y accesorios de entrada', productCount: 32 },
  { id: 'CAT-003', name: 'Almacenamiento', description: 'Discos duros, SSD y unidades de memoria', productCount: 28 },
  { id: 'CAT-004', name: 'Accesorios', description: 'Cables, adaptadores y componentes varios', productCount: 56 },
  { id: 'CAT-005', name: 'Audio', description: 'Altavoces, auriculares y sistemas de sonido', productCount: 18 },
  { id: 'CAT-006', name: 'Monitores', description: 'Pantallas y displays', productCount: 12 },
];

export const CategoriesPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isAdmin = user?.role === 'admin';
  const isReadOnly = user?.role === 'asesor';

  const handleDelete = (id: string) => {
    if (isReadOnly) return;
    if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      setCategories(categories.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 font-mono">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
              Categorías <span className="text-[#00ece0]">//</span> Gestión
            </h1>
            <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">
              Tipos de Productos
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
            Lista de Categorías
          </h2>
          {!isReadOnly && (
            <button className="px-4 py-2 bg-[#00ece0] hover:bg-[#00d4ce] text-[#0d1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </button>
          )}
          {isReadOnly && (
            <button disabled className="px-4 py-2 bg-gray-700 text-gray-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Nueva Categoría
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-mono">ID</th>
                <th className="text-left pb-3 font-mono">Nombre</th>
                <th className="text-left pb-3 font-mono">Descripción</th>
                <th className="text-center pb-3 font-mono">Productos</th>
                <th className="text-center pb-3 font-mono">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-gray-800/50 hover:bg-[#0d1117]/50 transition-colors">
                  <td className="py-3 font-mono text-[#00ece0]">{category.id}</td>
                  <td className="py-3 font-semibold">{category.name}</td>
                  <td className="py-3 text-gray-400">{category.description}</td>
                  <td className="py-3 text-center font-mono">{category.productCount}</td>
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
                        onClick={() => handleDelete(category.id)}
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

        {categories.length === 0 && (
          <div className="text-center py- text-gray-500 text-sm">
            No hay categorías registradas.
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;
