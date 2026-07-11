import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Search, Lock, X, Tags } from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CategoryDto,
} from '../../api/categoryApi';
import { StaffHeader } from '../../components/StaffHeader';

export const CategoriesPage = () => {
  const { user } = useAuth();

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const userRoleLower = user?.role?.toLowerCase();
  const isAdmin = userRoleLower === 'admin';
  const isReadOnly = !isAdmin;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error cargando categorías:', err);
      setError('No se pudieron cargar las categorías.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        String(c.categoryId).includes(q),
    );
  }, [categories, searchTerm]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (category: CategoryDto) => {
    setEditing(category);
    setName(category.name);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleDelete = async (category: CategoryDto) => {
    if (isReadOnly) return;
    if (
      !window.confirm(
        `¿Eliminar la categoría "${category.name}"?\nSi tiene productos asociados, el backend puede rechazar la operación.`,
      )
    ) {
      return;
    }

    try {
      await deleteCategory(category.categoryId);
      setCategories((prev) => prev.filter((c) => c.categoryId !== category.categoryId));
    } catch (err: unknown) {
      console.error('Error eliminando categoría:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'No se pudo eliminar la categoría. Puede tener productos asociados.';
      setError(message);
    }
  };

  const handleSave = async () => {
    if (isReadOnly || saving) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    if (trimmed.length > 100) {
      setFormError('El nombre no puede superar 100 caracteres.');
      return;
    }

    const duplicate = categories.some(
      (c) =>
        c.name.toLowerCase() === trimmed.toLowerCase() &&
        c.categoryId !== editing?.categoryId,
    );
    if (duplicate) {
      setFormError('Ya existe una categoría con ese nombre.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editing) {
        await updateCategory(editing.categoryId, trimmed);
      } else {
        await createCategory(trimmed);
      }
      await loadData();
      setModalOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      console.error('Error guardando categoría:', err);
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      if (status === 401 || status === 403) {
        setFormError('Sin permiso. Cierra sesión e inicia de nuevo como administrador.');
      } else {
        setFormError(message || 'No se pudo guardar la categoría.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] p-6 font-mono">
      <StaffHeader
        title={
          <>
            Categorías <span className="text-[#00ece0]">//</span> Catálogo
          </>
        }
        subtitle="Clasificación de productos"
        showReadOnly
      >
        {error && (
          <div className="mt-2 px-3 py-2 bg-[#ff4655]/10 border border-[#ff4655]/30 text-[#ff4655] text-xs">
            {error}
          </div>
        )}
      </StaffHeader>

      <div className="bg-[#16191b] border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Tags className="w-4 h-4 text-[#00ece0]" />
            Lista de Categorías
          </h2>
          {!isReadOnly ? (
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-[#00ece0] hover:bg-[#00d4ce] text-[#0d1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nueva Categoría
            </button>
          ) : (
            <button
              disabled
              className="px-4 py-2 bg-gray-700 text-gray-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Nueva Categoría
            </button>
          )}
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] font-mono"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-mono">ID</th>
                <th className="text-left pb-3 font-mono">Nombre</th>
                <th className="text-center pb-3 font-mono">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : (
                filtered.map((category) => (
                  <tr
                    key={category.categoryId}
                    className="border-b border-gray-800/50 hover:bg-[#0d1117]/50 transition-colors"
                  >
                    <td className="py-3 font-mono text-[#00ece0]">{category.categoryId}</td>
                    <td className="py-3 font-semibold">{category.name}</td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(category)}
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
                          onClick={() => handleDelete(category)}
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

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            No se encontraron categorías.
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-md bg-[#16191b] border border-gray-700 p-6 relative"
            style={{
              clipPath:
                'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
            }}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
              <h2 className="text-white font-bold font-mono uppercase tracking-wider">
                {editing ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-white transition-colors"
                disabled={saving}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 px-3 py-2 bg-[#ff4655]/10 border border-[#ff4655]/30 text-[#ff4655] text-xs">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
                className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
                placeholder="Ej: Laptops"
                autoFocus
              />
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-800">
              <button
                onClick={closeModal}
                disabled={saving}
                className="flex-1 py-2 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 bg-[#00ece0] hover:bg-[#00d4ce] text-[#0d1117] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Categoría'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
