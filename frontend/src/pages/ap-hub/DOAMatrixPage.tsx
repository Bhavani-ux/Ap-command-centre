import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api.client';

interface DOARule {
  id: string;
  level: number;
  minAmount: number;
  maxAmount: number;
  roleCode: string;
  roleName?: string;
  autoApprove: boolean;
}

export const DOAMatrixPage: React.FC = () => {
  const [doaRules, setDoaRules] = useState<DOARule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<DOARule | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    level: 1,
    minAmount: 0,
    maxAmount: 50000,
    roleCode: 'BRANCH_MANAGER',
    roleName: 'Branch Manager',
    autoApprove: false,
  });
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    fetchDOARules();
  }, []);

  const fetchDOARules = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/doa-matrix');
      const rules = response.data.data?.rules || response.data.rules || [];
      setDoaRules(rules.sort((a: DOARule, b: DOARule) => a.level - b.level));
    } catch (error) {
      console.error('Failed to fetch DOA rules:', error);
      setDoaRules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingRule) {
        // Update existing rule
        await apiClient.put(`/doa-matrix/${editingRule.id}`, formData);
        alert('DOA rule updated successfully');
      } else {
        // Create new rule
        await apiClient.post('/doa-matrix', formData);
        alert('DOA rule created successfully');
      }
      setEditingRule(null);
      setIsAddingNew(false);
      fetchDOARules();
    } catch (error: any) {
      alert(`Failed to save DOA rule: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this DOA rule?')) return;

    try {
      await apiClient.delete(`/doa-matrix/${id}`);
      alert('DOA rule deleted successfully');
      fetchDOARules();
    } catch (error: any) {
      alert(`Failed to delete DOA rule: ${error.response?.data?.message || error.message}`);
    }
  };

  const startEdit = (rule: DOARule) => {
    setEditingRule(rule);
    setFormData({
      level: rule.level,
      minAmount: rule.minAmount,
      maxAmount: rule.maxAmount,
      roleCode: rule.roleCode,
      roleName: rule.roleName || '',
      autoApprove: rule.autoApprove,
    });
    setIsAddingNew(false);
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setEditingRule(null);
    setFormData({
      level: (doaRules.length > 0 ? Math.max(...doaRules.map(r => r.level)) + 1 : 1),
      minAmount: 0,
      maxAmount: 50000,
      roleCode: 'BRANCH_MANAGER',
      roleName: 'Branch Manager',
      autoApprove: false,
    });
  };

  const cancelEdit = () => {
    setEditingRule(null);
    setIsAddingNew(false);
  };

  const handleReassignAll = async () => {
    if (!window.confirm('This will reassign ALL pending invoices based on the current DOA Matrix. Continue?')) {
      return;
    }

    setReassigning(true);
    try {
      const response = await apiClient.post('/doa-matrix/reassign-all');
      alert(response.data.message);
      window.location.reload();
    } catch (error: any) {
      alert(`Failed to reassign invoices: ${error.response?.data?.message || error.message}`);
    } finally {
      setReassigning(false);
    }
  };

  const getLevelColor = (level: number) => {
    const colors: Record<number, string> = {
      1: 'bg-green-500',
      2: 'bg-blue-500',
      3: 'bg-purple-500',
      4: 'bg-orange-500',
      5: 'bg-red-500',
    };
    return colors[level] || 'bg-gray-500';
  };

  const formatCurrency = (amount: number) => {
    const lakhs = amount / 100000;
    const crores = amount / 10000000;
    if (crores >= 1) {
      return `₹${crores.toFixed(2)} Cr`;
    } else if (lakhs >= 1) {
      return `₹${lakhs.toFixed(2)} L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DOA Matrix</h1>
          <p className="text-gray-600 mt-1">Delegation of Authority · {doaRules.length} approval bands</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReassignAll}
            disabled={reassigning}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {reassigning ? 'Reassigning...' : 'Reassign All Invoices'}
          </button>
          <button
            onClick={startAddNew}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Band
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAddingNew || editingRule) && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-purple-500">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {editingRule ? 'Edit DOA Band' : 'Add New DOA Band'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Level</label>
              <input
                type="number"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                min="1"
                max="10"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role Name</label>
              <input
                type="text"
                value={formData.roleName}
                onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
                placeholder="e.g., Branch Manager"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Min Amount (₹)</label>
              <input
                type="number"
                value={formData.minAmount}
                onChange={(e) => setFormData({ ...formData, minAmount: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Amount (₹)</label>
              <input
                type="number"
                value={formData.maxAmount}
                onChange={(e) => setFormData({ ...formData, maxAmount: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role Code</label>
              <select
                value={formData.roleCode}
                onChange={(e) => setFormData({ ...formData, roleCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="BRANCH_MANAGER">Branch Manager</option>
                <option value="FUNCTIONAL_HEAD">Functional Head</option>
                <option value="FINANCE_CONTROLLER">Finance Controller</option>
                <option value="CFO">CFO</option>
                <option value="SYSTEM_ADMIN">MD / Board</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoApprove}
                  onChange={(e) => setFormData({ ...formData, autoApprove: e.target.checked })}
                  className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-sm font-semibold text-gray-700">Auto-approve within band</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* DOA Bands List */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-purple-900 mb-6 flex items-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Approval Bands
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : doaRules.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No DOA rules configured. Click "Add New Band" to create one.
          </div>
        ) : (
          <div className="space-y-4">
            {doaRules.map((rule) => (
              <div
                key={rule.id}
                className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`${getLevelColor(rule.level)} w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <span className="text-2xl font-bold text-white">L{rule.level}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {formatCurrency(rule.minAmount)} – {formatCurrency(rule.maxAmount)}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {rule.roleName || rule.roleCode}
                      {rule.autoApprove && (
                        <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Auto-approve</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(rule)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
        <p className="text-sm text-cyan-900 flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>How it works:</strong> When an invoice is received, the system automatically assigns it to the appropriate approval level based on its amount. The invoice will route through the defined approval chain until it reaches the required DOA level for that amount range.
          </span>
        </p>
      </div>
    </div>
  );
};
