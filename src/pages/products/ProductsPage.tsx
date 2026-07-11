import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Search, Lock, X, ImagePlus } from 'lucide-react';
import {
  getPublicProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  changeProductStatus,
  uploadProductImage,
  resolveProductImageUrl,
} from '../../api/productApi';
import { getCategories, type CategoryDto } from '../../api/categoryApi';
import { adjustStock } from '../../api/inventoryApi';
import type { Product } from '../../types/product';
import { StaffHeader } from '../../components/StaffHeader';

const STATUS_ACTIVO = 1;
const STATUS_INACTIVO = 2;

type ProductFormData = {
  name: string;
  description: string;
  categoryId: number | '';
  price: number;
  stock: number;
  imageUrl: string;
  active: boolean;
};

const emptyForm = (): ProductFormData => ({
  name: '',
  description: '',
  categoryId: '',
  price: 0,
  stock: 0,
  imageUrl: '',
  active: true,
});

export const ProductsPage = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const userRoleLower = user?.role?.toLowerCase();
  const isReadOnly = userRoleLower === 'asesor' || userRoleLower === 'operator';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, categoriesData] = await Promise.all([
        getPublicProducts(),
        getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error cargando productos:', err);
      setError('No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const productCategories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const clearImageSelection = () => {
    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormError(null);
    clearImageSelection();
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    const category = categories.find(
      (c) => c.name.toLowerCase() === product.category.toLowerCase(),
    );
    // Guardar URL relativa si viene del API (/uploads/...), no la absoluta del front.
    const rawImage = product.image || '';
    const storedUrl =
      !rawImage || rawImage.includes('placeholder')
        ? ''
        : rawImage.includes('/uploads/')
          ? rawImage.slice(rawImage.indexOf('/uploads/'))
          : rawImage;

    setEditing(product);
    setForm({
      name: product.name,
      description: product.description || '',
      categoryId: category?.categoryId ?? '',
      price: product.price,
      stock: product.stock,
      imageUrl: storedUrl,
      active: product.active,
    });
    clearImageSelection();
    setImagePreview(storedUrl || null);
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
    clearImageSelection();
  };

  const handleImagePick = (file: File | null) => {
    if (!file) {
      clearImageSelection();
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

    if (imagePreview?.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormError(null);
  };

  const handleDelete = async (id: string) => {
    if (isReadOnly) return;
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error eliminando producto:', err);
      setError('No se pudo eliminar el producto.');
    }
  };

  const handleSave = async () => {
    if (isReadOnly || saving) return;

    const name = form.name.trim();
    if (!name) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    if (form.categoryId === '') {
      setFormError('Selecciona una categoría.');
      return;
    }
    if (form.price < 0 || Number.isNaN(form.price)) {
      setFormError('El precio no puede ser negativo.');
      return;
    }
    if (form.stock < 0 || Number.isNaN(form.stock)) {
      setFormError('El stock no puede ser negativo.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      let imageUrl = form.imageUrl.trim() || undefined;

      // Si el usuario eligió un archivo, subirlo primero y usar esa URL.
      if (imageFile) {
        try {
          imageUrl = await uploadProductImage(imageFile);
        } catch (uploadErr: unknown) {
          const uploadMessage = (uploadErr as { response?: { data?: { message?: string } }; message?: string })
            ?.response?.data?.message
            || (uploadErr as { message?: string })?.message
            || 'No se pudo subir la imagen.';
          setFormError(uploadMessage);
          setSaving(false);
          return;
        }
      }

      if (!imageUrl && imageFile) {
        setFormError('No se obtuvo la URL de la imagen. Intenta de nuevo.');
        setSaving(false);
        return;
      }

      const payload = {
        name,
        description: form.description.trim() || undefined,
        price: form.price,
        categoryId: Number(form.categoryId),
        imageUrl,
      };

      if (editing) {
        await updateProduct(editing.id, payload);

        if (form.active !== editing.active) {
          const statusId = form.active ? STATUS_ACTIVO : STATUS_INACTIVO;
          await changeProductStatus(editing.id, statusId);
        }

        const stockDelta = form.stock - editing.stock;
        if (stockDelta !== 0) {
          await adjustStock(
            Number(editing.id),
            stockDelta,
            stockDelta > 0 ? 'Ajuste desde edición de producto' : 'Ajuste por reducción de stock',
          );
        }
      } else {
        const created = await createProduct({
          ...payload,
          productStatusId: form.active ? STATUS_ACTIVO : STATUS_INACTIVO,
          initialStock: form.stock,
        });

        // Si por alguna razón el stock no quedó, forzar ajuste.
        if (form.stock > 0 && created.stock !== form.stock) {
          await adjustStock(
            Number(created.id),
            form.stock - created.stock,
            'Stock inicial al crear producto',
          );
        }
      }

      clearImageSelection();
      await loadData();
      setModalOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      console.error('Error guardando producto:', err);
      const status = (err as { response?: { status?: number; data?: { message?: string } } })
        ?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      if (status === 401 || status === 403) {
        setFormError('Sin permiso para guardar. Cierra sesión e inicia de nuevo como administrador.');
      } else {
        setFormError(message || 'No se pudo guardar el producto.');
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
            Productos <span className="text-[#00ece0]">//</span> Catálogo
          </>
        }
        subtitle="Gestión de Inventario"
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
          <h2 className="text-white text-sm font-bold uppercase tracking-wider">
            Lista de Productos
          </h2>
          {!isReadOnly ? (
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-[#00ece0] hover:bg-[#00d4ce] text-[#0d1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Producto
            </button>
          ) : (
            <button
              disabled
              className="px-4 py-2 bg-gray-700 text-gray-500 text-xs font-bold uppercase tracking-wider cursor-not-allowed flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Nuevo Producto
            </button>
          )}
        </div>

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
            {productCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

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
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-800/50 hover:bg-[#0d1117]/50 transition-colors"
                  >
                    <td className="py-3 font-mono text-[#00ece0]">{product.id}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt=""
                          className="w-9 h-9 object-cover border border-gray-700 bg-[#0d1117]"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/placeholder-product.png';
                          }}
                        />
                        <span className="font-semibold">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-[#0d1117] border border-gray-700 text-[10px] uppercase">
                        {product.category}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono">
                      ${product.price.toLocaleString()}
                    </td>
                    <td className="py-3 text-right font-mono">{product.stock}</td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-1 text-[10px] font-bold uppercase ${
                          product.active
                            ? 'bg-[#00ece0]/10 text-[#00ece0] border border-[#00ece0]/30'
                            : 'bg-[#ff4655]/10 text-[#ff4655] border border-[#ff4655]/30'
                        }`}
                      >
                        {product.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(product)}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">
            No se encontraron productos que coincidan con los filtros.
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-lg bg-[#16191b] border border-gray-700 p-6 relative max-h-[90vh] overflow-y-auto"
            style={{
              clipPath:
                'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
            }}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
              <h2 className="text-white font-bold font-mono uppercase tracking-wider">
                {editing ? 'Editar Producto' : 'Nuevo Producto'}
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

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
                  placeholder="Ej: Laptop HP Pavilion 15"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono resize-none"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Categoría
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      categoryId: e.target.value ? Number(e.target.value) : '',
                    })
                  }
                  className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
                >
                  <option value="">Seleccionar...</option>
                  {categories.map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="mt-1 text-[10px] text-[#ff4655]">
                    No hay categorías. Crea alguna en el sistema antes de agregar productos.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Precio
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Imagen del producto
                </label>

                <div className="flex gap-4 items-start">
                  <div className="w-24 h-24 border border-gray-700 bg-[#0d1117] flex items-center justify-center overflow-hidden shrink-0">
                    {imagePreview ? (
                      <img
                        src={imagePreview.startsWith('/uploads/')
                          ? resolveProductImageUrl(imagePreview)
                          : imagePreview}
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

                    {(imageFile || imagePreview) && (
                      <button
                        type="button"
                        onClick={() => {
                          clearImageSelection();
                          setForm({ ...form, imageUrl: '' });
                        }}
                        className="block text-[10px] uppercase tracking-wider text-gray-500 hover:text-[#ff4655] transition-colors"
                      >
                        Quitar imagen
                      </button>
                    )}

                    <p className="text-[10px] text-gray-600">
                      JPG, PNG, WEBP o GIF · máx. 5 MB
                    </p>

                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => {
                        setForm({ ...form, imageUrl: e.target.value });
                        if (!imageFile) {
                          setImagePreview(e.target.value.trim() || null);
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#0d1117] border border-gray-700 text-white text-xs focus:outline-none focus:border-[#00ece0] font-mono"
                      placeholder="O pega una URL: https://..."
                      disabled={!!imageFile}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-3 py-2 bg-[#0d1117] border border-gray-700">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Estado
                </span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                    form.active
                      ? 'bg-[#00ece0]/10 text-[#00ece0] border-[#00ece0]/30'
                      : 'bg-[#ff4655]/10 text-[#ff4655] border-[#ff4655]/30'
                  }`}
                >
                  {form.active ? 'Activo' : 'Inactivo'}
                </button>
              </div>
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
                {saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
