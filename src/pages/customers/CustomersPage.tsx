import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2, Search, X, Contact } from 'lucide-react';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type CustomerDto,
} from '../../api/customerApi';
import { StaffHeader } from '../../components/StaffHeader';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState<CustomerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerDto | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error cargando clientes:', err);
      setError('No se pudieron cargar los clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.toLowerCase().includes(q) ?? false) ||
        (c.documentNumber?.toLowerCase().includes(q) ?? false) ||
        String(c.customerId).includes(q),
    );
  }, [customers, searchTerm]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setEmail('');
    setPhone('');
    setDocumentNumber('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (customer: CustomerDto) => {
    setEditing(customer);
    setName(customer.name);
    setEmail(customer.email ?? '');
    setPhone(customer.phone ?? '');
    setDocumentNumber(customer.documentNumber ?? '');
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleDelete = async (customer: CustomerDto) => {
    if (
      !window.confirm(
        `¿Eliminar al cliente "${customer.name}"?\nSi tiene ventas asociadas, el backend puede rechazar la operación (FK Restrict).`,
      )
    ) {
      return;
    }

    try {
      await deleteCustomer(customer.customerId);
      setCustomers((prev) => prev.filter((c) => c.customerId !== customer.customerId));
    } catch (err: unknown) {
      console.error('Error eliminando cliente:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'No se pudo eliminar el cliente. Puede tener ventas asociadas.';
      setError(message);
    }
  };

  const handleSave = async () => {
    if (saving) return;

    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('El nombre es obligatorio.');
      return;
    }

    setSaving(true);
    setFormError(null);

    const payload = {
      name: trimmed,
      email,
      phone,
      documentNumber,
    };

    try {
      if (editing) {
        await updateCustomer(editing.customerId, payload);
      } else {
        await createCustomer(payload);
      }
      await loadData();
      setModalOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      console.error('Error guardando cliente:', err);
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      if (status === 401 || status === 403) {
        setFormError('Sin permiso. Cierra sesión e inicia de nuevo.');
      } else {
        setFormError(message || 'No se pudo guardar el cliente.');
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
            Clientes <span className="text-[#00ece0]">//</span> CRM
          </>
        }
        subtitle="Gestión de clientes"
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
            <Contact className="w-4 h-4 text-[#00ece0]" />
            Lista de Clientes
          </h2>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-[#00ece0] hover:bg-[#00d4ce] text-[#0d1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </button>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono, documento o ID..."
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
                <th className="text-left pb-3 font-mono">Email</th>
                <th className="text-left pb-3 font-mono">Teléfono</th>
                <th className="text-left pb-3 font-mono">Documento</th>
                <th className="text-center pb-3 font-mono">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => (
                  <tr
                    key={customer.customerId}
                    className="border-b border-gray-800/50 hover:bg-[#0d1117]/50 transition-colors"
                  >
                    <td className="py-3 font-mono text-[#00ece0]">{customer.customerId}</td>
                    <td className="py-3 font-semibold">{customer.name}</td>
                    <td className="py-3 text-gray-400">{customer.email || '—'}</td>
                    <td className="py-3 text-gray-400">{customer.phone || '—'}</td>
                    <td className="py-3 text-gray-400">{customer.documentNumber || '—'}</td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(customer)}
                          className="p-1.5 text-gray-500 hover:text-[#00ece0] transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
                          className="p-1.5 text-gray-500 hover:text-[#ff4655] transition-colors"
                          title="Eliminar"
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
            No se encontraron clientes.
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
                {editing ? 'Editar Cliente' : 'Nuevo Cliente'}
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
                <label className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
                  placeholder="Nombre completo"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
                  placeholder="correo@ejemplo.com"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
                  placeholder="Teléfono"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-gray-500 text-[10px] uppercase tracking-wider mb-1">
                  Documento
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
                  placeholder="Número de documento"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
              <button
                onClick={closeModal}
                disabled={saving}
                className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#00ece0] hover:bg-[#00d4ce] text-[#0d1117] text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;