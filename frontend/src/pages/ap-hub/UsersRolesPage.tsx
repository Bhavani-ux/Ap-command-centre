import React from 'react';

interface User {
  initials: string;
  name: string;
  email: string;
  role: string;
  roleColor: string;
  approvalLevels: string;
  approvalColor: string;
  pagesCount: number;
  passwordHint: string;
  avatarColor: string;
}

export const UsersRolesPage: React.FC = () => {
  const users: User[] = [
    {
      initials: 'AM',
      name: 'Arun Menon',
      email: 'arun.menon@cable.kerala.in',
      role: 'System Admin',
      roleColor: 'bg-purple-100 text-purple-800',
      approvalLevels: 'Approves L1-L5',
      approvalColor: 'bg-red-100 text-red-800',
      pagesCount: 10,
      passwordHint: 'admin2024!',
      avatarColor: 'bg-purple-600',
    },
    {
      initials: 'DN',
      name: 'Deepa Nair',
      email: 'deepa.nair@cable.kerala.in',
      role: 'CFO',
      roleColor: 'bg-blue-100 text-blue-800',
      approvalLevels: 'Approves L4',
      approvalColor: 'bg-orange-100 text-orange-800',
      pagesCount: 8,
      passwordHint: 'cfo2024!',
      avatarColor: 'bg-blue-600',
    },
    {
      initials: 'RP',
      name: 'Rajesh Pillai',
      email: 'rajesh.pillai@cable.kerala.in',
      role: 'Finance Controller',
      roleColor: 'bg-green-100 text-green-800',
      approvalLevels: 'Approves L3',
      approvalColor: 'bg-purple-100 text-purple-800',
      pagesCount: 7,
      passwordHint: 'controller2024!',
      avatarColor: 'bg-green-600',
    },
    {
      initials: 'SK',
      name: 'Suresh Kumar',
      email: 'suresh.kumar@cable.kerala.in',
      role: 'Functional Head Network',
      roleColor: 'bg-indigo-100 text-indigo-800',
      approvalLevels: 'Approves L2',
      approvalColor: 'bg-blue-100 text-blue-800',
      pagesCount: 6,
      passwordHint: 'network2024!',
      avatarColor: 'bg-indigo-600',
    },
    {
      initials: 'LV',
      name: 'Lakshmi Varma',
      email: 'lakshmi.varma@cable.kerala.in',
      role: 'Branch Manager Kochi',
      roleColor: 'bg-pink-100 text-pink-800',
      approvalLevels: 'Approves L1',
      approvalColor: 'bg-green-100 text-green-800',
      pagesCount: 5,
      passwordHint: 'kochi2024!',
      avatarColor: 'bg-pink-600',
    },
    {
      initials: 'AT',
      name: 'Anju Thomas',
      email: 'anju.thomas@cable.kerala.in',
      role: 'AP Clerk',
      roleColor: 'bg-yellow-100 text-yellow-800',
      approvalLevels: 'No approval authority',
      approvalColor: 'bg-gray-100 text-gray-600',
      pagesCount: 4,
      passwordHint: 'apclerk2024!',
      avatarColor: 'bg-yellow-600',
    },
    {
      initials: 'VI',
      name: 'Vikram Iyer',
      email: 'vikram.iyer@cable.kerala.in',
      role: 'Auditor (Read-only)',
      roleColor: 'bg-gray-100 text-gray-800',
      approvalLevels: 'No approval authority',
      approvalColor: 'bg-gray-100 text-gray-600',
      pagesCount: 3,
      passwordHint: 'audit2024!',
      avatarColor: 'bg-gray-600',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users & Roles</h1>
        <p className="text-gray-600 mt-1">RBAC directory</p>
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

      {/* User Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map((user, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-6">
            {/* Avatar */}
            <div className="flex justify-center mb-4">
              <div className={`${user.avatarColor} w-20 h-20 rounded-full flex items-center justify-center`}>
                <span className="text-2xl font-bold text-white">{user.initials}</span>
              </div>
            </div>

            {/* User Info */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{user.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{user.email}</p>

              {/* Role Badge */}
              <div className="flex justify-center mb-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.roleColor}`}>
                  {user.role}
                </span>
              </div>

              {/* Approval Levels Badge */}
              <div className="flex justify-center mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${user.approvalColor}`}>
                  {user.approvalLevels}
                </span>
              </div>

              {/* Pages Count */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{user.pagesCount} pages</span>
              </div>

              {/* Password Hint */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-500 mb-1">Password hint</p>
                <p className="text-sm font-mono text-gray-700">{user.passwordHint}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold transition-colors flex items-center justify-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-semibold transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New User Button */}
      <div className="flex justify-center">
        <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Add New User
        </button>
      </div>

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
