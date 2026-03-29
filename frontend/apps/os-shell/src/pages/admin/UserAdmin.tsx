// TFT-159: User Administration Page
// User list with search/filter, role assignment, account status management,
// and audit log of user actions.
//
// DATA POSTURE: INITIAL_USERS and AUDIT_LOG are hardcoded sample fixtures
// scoped to Benton County. No backend connection. All mutations (edit, suspend,
// activate) operate on in-memory state only and do not persist.

import React, { useState, useMemo, useCallback } from 'react';
import { DemoDataBanner } from '@/components/governance/DemoDataBanner';

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

// ── Sample data ─────────────────────────────────────────────────────────────

const INITIAL_USERS: User[] = [
  { id: '1', email: 'admin@benton.wa.gov', displayName: 'County Admin', role: 'Admin', status: 'active', lastLogin: '2026-03-15T09:32:00Z', createdAt: '2025-06-01T00:00:00Z', countyId: 'benton' },
  { id: '2', email: 'dev@benton.wa.gov', displayName: 'Dev User', role: 'Developer', status: 'active', lastLogin: '2026-03-14T16:45:00Z', createdAt: '2025-08-15T00:00:00Z', countyId: 'benton' },
  { id: '3', email: 'viewer@benton.wa.gov', displayName: 'Staff Viewer', role: 'Viewer', status: 'active', lastLogin: '2026-03-15T08:10:00Z', createdAt: '2025-09-20T00:00:00Z', countyId: 'benton' },
  { id: '4', email: 'suspended@benton.wa.gov', displayName: 'Former Staff', role: 'Viewer', status: 'suspended', lastLogin: '2026-02-28T10:00:00Z', createdAt: '2025-03-01T00:00:00Z', countyId: 'benton' },
  { id: '5', email: 'appraiser@benton.wa.gov', displayName: 'Field Appraiser', role: 'Viewer', status: 'active', lastLogin: '2026-03-13T14:20:00Z', createdAt: '2025-11-01T00:00:00Z', countyId: 'benton' },
  { id: '6', email: 'newuser@benton.wa.gov', displayName: 'New Hire', role: 'Viewer', status: 'pending', lastLogin: null, createdAt: '2026-03-10T00:00:00Z', countyId: 'benton' },
];

const AUDIT_LOG: UserAuditEntry[] = [
  { id: '1', userId: '1', userName: 'County Admin', action: 'LOGIN', detail: 'Successful login from 10.0.1.45', timestamp: '2026-03-15T09:32:00Z', performedBy: 'system' },
  { id: '2', userId: '4', userName: 'Former Staff', action: 'STATUS_CHANGE', detail: 'Account suspended by admin', timestamp: '2026-03-10T11:00:00Z', performedBy: 'admin@benton.wa.gov' },
  { id: '3', userId: '6', userName: 'New Hire', action: 'ACCOUNT_CREATED', detail: 'Account created with Viewer role', timestamp: '2026-03-10T09:00:00Z', performedBy: 'admin@benton.wa.gov' },
  { id: '4', userId: '2', userName: 'Dev User', action: 'ROLE_CHANGE', detail: 'Role changed from Viewer to Developer', timestamp: '2026-03-05T14:30:00Z', performedBy: 'admin@benton.wa.gov' },
  { id: '5', userId: '3', userName: 'Staff Viewer', action: 'PASSWORD_RESET', detail: 'Password reset requested', timestamp: '2026-03-01T10:15:00Z', performedBy: 'viewer@benton.wa.gov' },
  { id: '6', userId: '5', userName: 'Field Appraiser', action: 'DATA_EXPORT', detail: 'Exported 1,200 property records', timestamp: '2026-02-28T16:00:00Z', performedBy: 'appraiser@benton.wa.gov' },
];

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
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState<'users' | 'audit'>('users');

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

  const handleSaveUser = useCallback((updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setEditingUser(null);
  }, []);

  const handleToggleStatus = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' }
          : u,
      ),
    );
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Card 50D: INITIAL_USERS and AUDIT_LOG are sample fixtures — always disclose */}
      <DemoDataBanner module="User Administration" />

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
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          No users match the current filters.
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
                              onClick={() => handleToggleStatus(user.id)}
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
                    {AUDIT_LOG.map((entry) => (
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
                    ))}
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
