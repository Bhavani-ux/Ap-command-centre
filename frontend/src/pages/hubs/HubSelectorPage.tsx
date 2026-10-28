import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Hub {
  id: string;
  name: string;
  description: string;
  icon: string;
  path: string;
  color: string;
  badge?: string;
}

export const HubSelectorPage: React.FC = () => {
  const navigate = useNavigate();

  const hubs: Hub[] = [
    {
      id: 'system-admin',
      name: 'System Admin',
      description: 'Full access - approves L1-L5',
      icon: 'AM',
      path: '/hub/ap/dashboard',
      color: 'bg-purple-500',
      badge: 'Active',
    },
    {
      id: 'cfo',
      name: 'CFO',
      description: 'Approves ₹25L–₹1Cr - CFO cockpit',
      icon: 'DN',
      path: '/hub/ap/dashboard',
      color: 'bg-orange-500',
      badge: 'Active',
    },
    {
      id: 'finance-controller',
      name: 'Finance Controller',
      description: 'Approves ₹5L–₹25L',
      icon: 'RP',
      path: '/hub/ap/dashboard',
      color: 'bg-purple-600',
      badge: 'Active',
    },
    {
      id: 'functional-head',
      name: 'Functional Head — Network',
      description: 'Approves ₹50K–₹5L',
      icon: 'SK',
      path: '/hub/ap/dashboard',
      color: 'bg-blue-500',
      badge: 'Active',
    },
    {
      id: 'branch-manager',
      name: 'Branch Manager — Kochi',
      description: 'Approves ≤ ₹50K',
      icon: 'LV',
      path: '/hub/ap/dashboard',
      color: 'bg-teal-500',
      badge: 'Active',
    },
    {
      id: 'ap-clerk',
      name: 'AP Clerk',
      description: 'Mailbox ingestion - no approvals',
      icon: 'AT',
      path: '/hub/ap/dashboard',
      color: 'bg-cyan-500',
      badge: 'Active',
    },
    {
      id: 'auditor',
      name: 'Auditor (Read-only)',
      description: 'Read-only audit access',
      icon: 'VI',
      path: '/hub/ap/dashboard',
      color: 'bg-gray-500',
      badge: 'Active',
    },
  ];

  const handleHubClick = (hub: Hub) => {
    navigate(hub.path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Enterprise Command Center</h1>
              <p className="text-gray-600 mt-1">Select a hub to get started</p>
            </div>
            <button
              onClick={() => navigate('/logout')}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Hub Grid */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {hubs.map((hub) => (
            <button
              key={hub.id}
              onClick={() => handleHubClick(hub)}
              className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 p-6 text-left"
            >
              {/* Badge */}
              {hub.badge && (
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      hub.badge === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {hub.badge}
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`${hub.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className="text-2xl font-bold text-white">{hub.icon}</span>
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{hub.name}</h3>
              <p className="text-gray-600 text-sm">{hub.description}</p>

              {/* Arrow */}
              <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700">
                <span className="text-sm font-medium">Open Hub</span>
                <svg
                  className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Total Roles</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">7</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Active Users</div>
            <div className="text-3xl font-bold text-green-600 mt-2">7</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Approval Levels</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">6</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600">Your Access</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">Full</div>
          </div>
        </div>
      </div>
    </div>
  );
};
