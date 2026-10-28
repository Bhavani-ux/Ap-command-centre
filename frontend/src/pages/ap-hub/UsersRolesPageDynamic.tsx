import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api.client';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department?: {
    id: string;
    name: string;
    code: string;
  };
  roles: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface AzureUser {
  id: string;
  displayName: string;
  mail: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
}

export const UsersRolesPageDynamic: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEdit, setShowAddEdit] = useState(false);
  const [showAzureImport, setShowAzureImport] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [azureSearchEmail, setAzureSearchEmail] = useState('');
  const [azureResults, setAzureResults] = useState<AzureUser[]>([]);
  const [azureSearching, setAzureSearching] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    roleIds: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await apiClient.get('/roles');
      setRoles(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await apiClient.get('/departments');
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const startAddNew = () => {
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: '',
      roleIds: [],
      isActive: true,
    });
    setShowAddEdit(true);
    setShowAzureImport(false);
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      departmentId: user.department?.id || '',
      roleIds: user.roles.map(r => r.id),
      isActive: user.isActive,
    });
    setShowAddEdit(true);
    setShowAzureImport(false);
  };

  const cancelAddEdit = () => {
    setShowAddEdit(false);
    setEditingUser(null);
  };

  const handleSave = async () => {
    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        alert('First name, last name, and email are required');
        return;
      }

      if (editingUser) {
        // Update existing user
        await apiClient.put(`/users/${editingUser.id}`, formData);
        alert('User updated successfully');
      } else {
        // Create new user
        await apiClient.post('/users', formData);
        alert('User created successfully');
      }

      setShowAddEdit(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      alert(`Failed to save user: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action will deactivate their account.')) {
      return;
    }

    try {
      await apiClient.delete(`/users/${userId}`);
      alert('User deleted successfully');
      fetchUsers();
    } catch (error: any) {
      alert(`Failed to delete user: ${error.response?.data?.message || error.message}`);
    }
  };

  const toggleRoleSelection = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId],
    }));
  };

  const searchAzureAD = async () => {
    if (!azureSearchEmail) {
      alert('Please enter an email address to search');
      return;
    }

    try {
      setAzureSearching(true);
      const response = await apiClient.get('/users/azure-search', {
        params: { email: azureSearchEmail },
      });
      setAzureResults(response.data.data || []);
    } catch (error: any) {
      alert(`Azure search failed: ${error.response?.data?.message || error.message}`);
      setAzureResults([]);
    } finally {
      setAzureSearching(false);
    }
  };

  const importAzureUser = async (azureUser: AzureUser) => {
    try {
      const payload = {
        azureUserId: azureUser.id,
        email: azureUser.mail,
        displayName: azureUser.displayName,
        jobTitle: azureUser.jobTitle,
        department: azureUser.department,
        phone: azureUser.mobilePhone,
        roleIds: formData.roleIds, // Use selected roles from form
      };

      await apiClient.post('/users/azure-import', payload);
      alert('User imported from Azure AD successfully');
      setShowAzureImport(false);
      setAzureResults([]);
      setAzureSearchEmail('');
      fetchUsers();
    } catch (error: any) {
      alert(`Failed to import user: ${error.response?.data?.message || error.message}`);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-purple-600',
      'bg-blue-600',
      'bg-green-600',
      'bg-indigo-600',
      'bg-pink-600',
      'bg-yellow-600',
      'bg-gray-600',
      'bg-red-600',
      'bg-teal-600',
      'bg-orange-600',
    ];
    return colors[index % colors.length];
  };

  const getRoleColor = (roleCode: string) => {
    const colorMap: Record<string, string> = {
      SYSTEM_ADMIN: 'bg-purple-100 text-purple-800',
      CFO: 'bg-blue-100 text-blue-800',
      FINANCE_CONTROLLER: 'bg-green-100 text-green-800',
      FUNCTIONAL_HEAD: 'bg-indigo-100 text-indigo-800',
      BRANCH_MANAGER: 'bg-pink-100 text-pink-800',
      AP_CLERK: 'bg-yellow-100 text-yellow-800',
      AUDITOR: 'bg-gray-100 text-gray-800',
    };
    return colorMap[roleCode] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-gray-600 mt-1">RBAC directory · {users.length} users</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowAzureImport(true);
              setShowAddEdit(false);
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Import from Azure AD
          </button>
          <button
            onClick={startAddNew}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Add New User
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Role-Based Access Control</h3>
            <p className="text-sm text-blue-800">
              Each user has specific permissions tied to their role. Approval levels (L1-L5) determine invoice signing authority based on DOA bands.
              System Admin has full access across all modules. Read-only users can view but not modify data.
            </p>
          </div>
        </div>
      </div>

      {/* Azure AD Import Panel */}
      {showAzureImport && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-500">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Import from Azure AD
          </h2>

          <div className="space-y-4">
            {/* Search Box */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search by Email</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={azureSearchEmail}
                  onChange={(e) => setAzureSearchEmail(e.target.value)}
                  placeholder="user@cable.kerala.in"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && searchAzureAD()}
                />
                <button
                  onClick={searchAzureAD}
                  disabled={azureSearching}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
                >
                  {azureSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Role Selection for Import */}
            {azureResults.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Roles to Assign
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center gap-2 p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.roleIds.includes(role.id)}
                        onChange={() => toggleRoleSelection(role.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">{role.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Azure Results */}
            {azureResults.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Search Results</h3>
                <div className="space-y-2">
                  {azureResults.map((azureUser) => (
                    <div key={azureUser.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-900">{azureUser.displayName}</p>
                        <p className="text-sm text-gray-600">{azureUser.mail}</p>
                        {azureUser.jobTitle && (
                          <p className="text-xs text-gray-500">{azureUser.jobTitle} · {azureUser.department}</p>
                        )}
                      </div>
                      <button
                        onClick={() => importAzureUser(azureUser)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                      >
                        Import
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setShowAzureImport(false);
                setAzureResults([]);
                setAzureSearchEmail('');
              }}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit User Form */}
      {showAddEdit && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-500">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="John"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="john.doe@cable.kerala.in"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm font-semibold text-gray-700">Active</span>
              </label>
            </div>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Roles *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-center gap-2 p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.roleIds.includes(role.id)}
                    onChange={() => toggleRoleSelection(role.id)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">{role.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Save
            </button>
            <button
              onClick={cancelAddEdit}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No users found. Click "Add New User" to create one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {users.map((user, idx) => (
            <div
              key={user.id}
              className={`bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6 ${
                !user.isActive ? 'opacity-50' : ''
              }`}
            >
              {/* Avatar */}
              <div className="flex justify-center mb-4">
                <div className={`${getAvatarColor(idx)} w-20 h-20 rounded-full flex items-center justify-center`}>
                  <span className="text-2xl font-bold text-white">
                    {getInitials(user.firstName, user.lastName)}
                  </span>
                </div>
              </div>

              {/* User Info */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-gray-600 mb-3">{user.email}</p>

                {/* Department */}
                {user.department && (
                  <p className="text-xs text-gray-500 mb-2">{user.department.name}</p>
                )}

                {/* Roles Badges */}
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                  {user.roles.map((role) => (
                    <span
                      key={role.id}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(role.code)}`}
                    >
                      {role.name}
                    </span>
                  ))}
                </div>

                {/* Status Badge */}
                {!user.isActive && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(user)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors flex items-center justify-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-semibold transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Role Legend */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Approval Level Reference
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-green-500 w-8 h-8 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">L1</span>
              </div>
              <span className="font-semibold text-gray-900">Level 1</span>
            </div>
            <p className="text-xs text-gray-600">≤ ₹50,000</p>
            <p className="text-xs text-gray-500 mt-1">Branch Manager</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-500 w-8 h-8 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">L2</span>
              </div>
              <span className="font-semibold text-gray-900">Level 2</span>
            </div>
            <p className="text-xs text-gray-600">₹50,001 - ₹5,00,000</p>
            <p className="text-xs text-gray-500 mt-1">Functional Head</p>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-purple-500 w-8 h-8 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">L3</span>
              </div>
              <span className="font-semibold text-gray-900">Level 3</span>
            </div>
            <p className="text-xs text-gray-600">₹5,00,001 - ₹25,00,000</p>
            <p className="text-xs text-gray-500 mt-1">Finance Controller</p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-orange-500 w-8 h-8 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">L4</span>
              </div>
              <span className="font-semibold text-gray-900">Level 4</span>
            </div>
            <p className="text-xs text-gray-600">₹25,00,001 - ₹1,00,00,000</p>
            <p className="text-xs text-gray-500 mt-1">CFO</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-red-500 w-8 h-8 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">L5</span>
              </div>
              <span className="font-semibold text-gray-900">Level 5</span>
            </div>
            <p className="text-xs text-gray-600">&gt; ₹1,00,00,000</p>
            <p className="text-xs text-gray-500 mt-1">MD / Board</p>
          </div>
        </div>
      </div>
    </div>
  );
};
