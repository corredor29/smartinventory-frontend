import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Search, X, Users } from 'lucide-react';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type UserDto,
} from '../../api/userApi';
import { getRoles, type RoleDto } from '../../api/roleApi';
import { StaffHeader } from '../../components/StaffHeader';

type UserForm = {
  name: string;
  email: string;
  password: string;
  roleId: number | '';
};

const emptyForm = (): UserForm => ({
  name: '',
  email: '',
  password: '',
  roleId: '',
});

function roleBadgeClass(roleName: string): string {
  const n = roleName.toLowerCase();
  if (n.includes('admin')) return 'bg-[#ff4655]/10 text-[#ff4655] border-[#ff4655]/30';
  if (n.includes('asesor')) return 'bg-[#00ece0]/10 text-[#00ece0] border-[#00ece0]/30';
  return 'bg-gray-700/40 text-gray-300 border-gray-600';
}

export const UsersPage = () => {
  const { user } = useAuth();

  const [users, setUsers] = useState<UserDto[]>([]);
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserDto | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, rolesData] = await Promise.all([getUsers(), getRoles()]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        String(u.userId).includes(q) ||
        u.roleName.toLowerCase().includes(q);

      const matchesRole =
        roleFilter === 'all' || u.roleName.toLowerCase() === roleFilter.toLowerCase();

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const openCreate = () => {
    setEditing(null);
    const defaultRole =
      roles.find((r) => r.name.toLowerCase() === 'asesor')?.roleId ??
      roles[0]?.roleId ??
      '';
    setForm({ ...emptyForm(), roleId: defaultRole });
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (row: UserDto) => {
    setEditing(row);
    setForm({
      name: row.name,
      email: row.email,
      password: '',
      roleId: row.roleId || roles.find((r) => r.name === row.roleName)?.roleId || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleDelete = async (row: UserDto) => {
    if (user?.userId === row.userId || user?.email === row.email) {
      setError('No puedes eliminar tu propio usuario mientras estás en sesión.');
      return;
    }
    if (!window.confirm(`¿Eliminar al usuario "${row.name}" (${row.email})?`)) return;

    try {
      await deleteUser(row.userId);
      setUsers((prev) => prev.filter((u) => u.userId !== row.userId));
    } catch (err: unknown) {
      console.error('Error eliminando usuario:', err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'No se pudo eliminar el usuario.';
      setError(message);
    }
  };

  const handleSave = async () => {
    if (saving) return;

    const name = form.name.trim();
    const email = form.email.trim();
    if (!name) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    if (!email) {
      setFormError('El email es obligatorio.');
      return;
    }
    if (form.roleId === '') {
      setFormError('Selecciona un rol.');
      return;
    }
    if (!editing && form.password.length < 8) {
      setFormError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (editing && form.password && form.password.length < 8) {
      setFormError('Si cambias la contraseña, debe tener al menos 8 caracteres.');
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      if (editing) {
        await updateUser(editing.userId, {
          name,
          email,
          roleId: Number(form.roleId),
          ...(form.password ? { password: form.password } : {}),
        });
      } else {
        await createUser({
          name,
          email,
          password: form.password,
          roleId: Number(form.roleId),
        });
      }
      await loadData();
      setModalOpen(false);
      setEditing(null);
    } catch (err: unknown) {
      console.error('Error guardando usuario:', err);
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      if (status === 401 || status === 403) {
        setFormError('Sin permiso. Cierra sesión e inicia de nuevo como administrador.');
      } else {
        setFormError(message || 'No se pudo guardar el usuario.');
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
            Usuarios <span className="text-[#00ece0]">//</span> Asesores
          </>
        }
        subtitle="Gestión de cuentas y roles"
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
            <Users className="w-4 h-4 text-[#00ece0]" />
            Lista de Usuarios
          </h2>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-[#00ece0] hover:bg-[#00d4ce] text-[#0d1117] text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, email, rol o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-[#00ece0] font-mono"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
          >
            <option value="all">Todos los roles</option>
            {roles.map((r) => (
              <option key={r.roleId} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-mono">ID</th>
                <th className="text-left pb-3 font-mono">Nombre</th>
                <th className="text-left pb-3 font-mono">Email</th>
                <th className="text-center pb-3 font-mono">Rol</th>
                <th className="text-center pb-3 font-mono">Acciones</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.userId}
                    className="border-b border-gray-800/50 hover:bg-[#0d1117]/50 transition-colors"
                  >
                    <td className="py-3 font-mono text-[#00ece0]">{row.userId}</td>
                    <td className="py-3 font-semibold">{row.name}</td>
                    <td className="py-3 font-mono text-gray-400">{row.email}</td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-1 text-[10px] font-bold uppercase border ${roleBadgeClass(row.roleName)}`}
                      >
                        {row.roleName || '—'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(row)}
                          className="p-1.5 text-gray-500 hover:text-[#00ece0] transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
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
            No se encontraron usuarios.
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
                {editing ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                  placeholder="Ej: Ana Pérez"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
                  placeholder="ana@empresa.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Rol
                </label>
                <select
                  value={form.roleId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      roleId: e.target.value ? Number(e.target.value) : '',
                    })
                  }
                  className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
                >
                  <option value="">Seleccionar...</option>
                  {roles.map((r) => (
                    <option key={r.roleId} value={r.roleId}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  {editing ? 'Nueva contraseña (opcional)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0d1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-[#00ece0] font-mono"
                  placeholder={editing ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'}
                  autoComplete="new-password"
                />
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
                {saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
