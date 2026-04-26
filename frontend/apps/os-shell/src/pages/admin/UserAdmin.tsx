// TFT-159: User Administration Page
// User list with search/filter, role assignment, account status management,
// and audit log of user actions.
//
// DATA POSTURE: API-only. No local users or audit entries are fabricated when
// the backend is unavailable.

import React, { useState, useMemo, useCallback, useEffect } from 'react';

// ── Types ───────────────────────────────────────────────────────────────────

type UserRole = 'Admin' | 'Developer' | 'Viewer';
type UserStatus = 'active' | 'suspended' | 'pending';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  lastLogin: string | null;
  createdAt: string;
  countyId: string;
}

interface UserAuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  detail: string;
  timestamp: string;
  performedBy: string;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function unwrapArray<T>(payload: T[] | { items?: T[]; data?: T[] }): T[] {
  if (Array.isArray(payload)) return payload;
  return payload.items ?? payload.data ?? [];
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ value, variant }: { value: string; variant?: 'role' | 'status' }) {
  const colorMap: Record<string, string> = {
    // Roles
    admin: 'bg-purple-100 text-purple-800',
    developer: 'bg-blue-100 text-blue-800',
    viewer: 'bg-gray-100 text-gray-700',
    // Statuses
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  const key = value.toLowerCase();
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[key] ?? 'bg-gray-100 text-gray-800'}`}
    >
      {value}
    </span>
  );
}

interface EditUserModalProps {
  user: User;
  onSave: (updated: User) => void;
  onCancel: () => void;
}

function EditUserModal({ user, onSave, onCancel }: EditUserModalProps) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);

  const handleSave = () => {
    onSave({ ...user, role, status });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
            <p className="text-gray-900">{user.displayName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <p className="text-gray-700">{user.email}</p>
          </div>

          <div>
            <label htmlFor="edit-role" className="block text-sm font-medium text-gray-600 mb-1">
              Role
            </label>
            <select
              id="edit-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="Admin">Admin</option>
              <option value="Developer">Developer</option>
              <option value="Viewer">Viewer</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Admin &gt; Developer &gt; Viewer (role hierarchy)
            </p>
          </div>

          <div>
            <label htmlFor="edit-status" className="block text-sm font-medium text-gray-600 mb-1">
              Status
            </label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              className="block w-full rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

const UserAdmin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLog, setAuditLog] = useState<UserAuditEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<'users' | 'audit'>('users');
  const [loading, setLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchJson<User[] | { items?: User[]; data?: User[] }>('/api/admin/users')
      .then((payload) => {
        if (cancelled) return;
        setUsers(unwrapArray(payload));
        setError(null);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setUsers([]);
        setError(loadError instanceof Error ? loadError.message : 'User API unavailable.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    fetchJson<UserAuditEntry[] | { items?: UserAuditEntry[]; data?: UserAuditEntry[] }>('/api/admin/users/audit')
      .then((payload) => {
        if (cancelled) return;
        setAuditLog(unwrapArray(payload));
        setAuditError(null);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setAuditLog([]);
        setAuditError(loadError instanceof Error ? loadError.message : 'User audit API unavailable.');
      })
      .finally(() => {
        if (!cancelled) setAuditLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        searchQuery === '' ||
        u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Counts
  const counts = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === 'active').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    pending: users.filter((u) => u.status === 'pending').length,
    admins: users.filter((u) => u.role === 'Admin').length,
    developers: users.filter((u) => u.role === 'Developer').length,
    viewers: users.filter((u) => u.role === 'Viewer').length,
  }), [users]);

  const handleSaveUser = useCallback(async (updated: User) => {
    try {
      const saved = await fetchJson<User>(`/api/admin/users/${encodeURIComponent(updated.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: updated.role, status: updated.status }),
      });
      setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
      setEditingUser(null);
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save user changes.');
    }
  }, []);

  const handleToggleStatus = useCallback(async (user: User) => {
    const status: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const saved = await fetchJson<User>(`/api/admin/users/${encodeURIComponent(user.id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)));
      setError(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update user status.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">User Administration</h1>
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Add User
          </button>
        </div>

        {/* Section toggle */}
        <div className="flex gap-2 mt-4">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'users'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveSection('users')}
          >
            Users ({counts.total})
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeSection === 'audit'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setActiveSection('audit')}
          >
            Audit Log
          </button>
        </div>
      </div>

      <div className="p-6">
        {error && activeSection === 'users' && (
          <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            User administration API unavailable: {error}
          </div>
        )}
        {auditError && activeSection === 'audit' && (
          <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            User audit API unavailable: {auditError}
          </div>
        )}
        {activeSection === 'users' ? (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
              {[
                { label: 'Total', value: counts.total, color: 'bg-gray-50 text-gray-900' },
                { label: 'Active', value: counts.active, color: 'bg-green-50 text-green-800' },
                { label: 'Suspended', value: counts.suspended, color: 'bg-red-50 text-red-800' },
                { label: 'Pending', value: counts.pending, color: 'bg-yellow-50 text-yellow-800' },
                { label: 'Admins', value: counts.admins, color: 'bg-purple-50 text-purple-800' },
                { label: 'Developers', value: counts.developers, color: 'bg-blue-50 text-blue-800' },
                { label: 'Viewers', value: counts.viewers, color: 'bg-gray-50 text-gray-700' },
              ].map((card) => (
                <div key={card.label} className={`rounded-lg p-3 text-center ${card.color}`}>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs font-medium">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 min-w-[200px] rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
                aria-label="Search users"
              />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                aria-label="Filter by role"
              >
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Developer">Developer</option>
                <option value="Viewer">Viewer</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
                className="rounded-md border-gray-300 shadow-sm text-sm focus:border-blue-500 focus:ring-blue-500"
                aria-label="Filter by status"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* User table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          Loading users from the admin API...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          {error ? 'No users loaded from the admin API.' : 'No users match the current filters.'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {user.displayName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 py-3">
                            <StatusBadge value={user.role} variant="role" />
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge value={user.status} variant="status" />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString()
                              : 'Never'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm space-x-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => void handleToggleStatus(user)}
                              className={`font-medium ${
                                user.status === 'active'
                                  ? 'text-red-600 hover:text-red-800'
                                  : 'text-green-600 hover:text-green-800'
                              }`}
                            >
                              {user.status === 'active' ? 'Suspend' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-sm text-gray-500">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>
          </>
        ) : (
          /* Audit Log */
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">User Action Audit Log</h3>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detail</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {auditLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          Loading audit events from the admin API...
                        </td>
                      </tr>
                    ) : auditLog.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          {auditError ? 'No audit events loaded from the admin API.' : 'No user audit events returned.'}
                        </td>
                      </tr>
                    ) : (
                      auditLog.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {entry.userName}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {entry.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{entry.detail}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{entry.performedBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={handleSaveUser}
          onCancel={() => setEditingUser(null)}
        />
      )}
    </div>
  );
};

export default UserAdmin;
