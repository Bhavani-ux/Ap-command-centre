import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';
import { getAccessibleTabs, getUserRoleConfig } from '../../config/roleConfig';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Get user's role configuration and accessible tabs
  const userRoleConfig = getUserRoleConfig(user?.roles || []);
  const accessibleTabs = getAccessibleTabs(user?.roles || []);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const getCardColor = (index: number) => {
    const colors = [
      'from-purple-500 to-purple-600',
      'from-blue-500 to-blue-600',
      'from-green-500 to-green-600',
      'from-orange-500 to-orange-600',
      'from-pink-500 to-pink-600',
      'from-indigo-500 to-indigo-600',
      'from-cyan-500 to-cyan-600',
      'from-yellow-500 to-yellow-600',
      'from-red-500 to-red-600',
    ];
    return colors[index % colors.length];
  };

  if (!userRoleConfig || accessibleTabs.length === 0) {
    return (
      <>
        {/* Mobile overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
            onClick={onClose}
          ></div>
        )}
        <div className="fixed inset-y-0 left-0 z-30 w-64 bg-gray-50 shadow-lg">
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No accessible tabs</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 bg-gradient-to-br from-gray-50 to-gray-100 shadow-xl transform transition-all duration-300 ease-in-out ${
          isOpen ? 'w-72 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo & Role Badge */}
          <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-purple-600 font-bold text-lg">A</span>
                </div>
                {isOpen && <span className="text-white text-lg font-bold">Asianet AP</span>}
              </div>
            </div>
            {isOpen && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 mt-2">
                <p className="text-xs text-purple-100 font-medium">{userRoleConfig.name}</p>
                {userRoleConfig.description && (
                  <p className="text-xs text-purple-200 mt-0.5">{userRoleConfig.description}</p>
                )}
              </div>
            )}
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${userRoleConfig.color || 'bg-blue-500'} flex items-center justify-center text-white font-bold shadow-md`}>
                {userRoleConfig.icon || `${user?.firstName?.[0]}${user?.lastName?.[0]}`}
              </div>
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Card-based Navigation */}
          <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
            {isOpen ? (
              // Expanded: Show card view
              <div className="grid grid-cols-1 gap-2">
                {accessibleTabs.map((tab, index) => (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`group relative overflow-hidden rounded-xl shadow-md transition-all duration-200 ${
                      isActive(tab.path)
                        ? 'ring-2 ring-purple-500 shadow-lg scale-[1.02]'
                        : 'hover:shadow-lg hover:scale-[1.02]'
                    }`}
                  >
                    <div className={`bg-gradient-to-br ${getCardColor(index)} p-4 text-white relative`}>
                      <div className="absolute top-0 right-0 opacity-20 text-6xl">
                        {tab.icon}
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{tab.icon}</span>
                          {isActive(tab.path) && (
                            <span className="ml-auto text-xs bg-white/30 backdrop-blur-sm px-2 py-0.5 rounded-full font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-sm leading-tight">{tab.name}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              // Collapsed: Show icon-only view
              <div className="flex flex-col items-center space-y-2">
                {accessibleTabs.map((tab) => (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 ${
                      isActive(tab.path)
                        ? 'bg-purple-500 text-white shadow-lg scale-110'
                        : 'bg-white text-gray-700 hover:bg-purple-50 hover:scale-105'
                    }`}
                    title={tab.name}
                  >
                    <span className="text-xl">{tab.icon}</span>
                  </Link>
                ))}
              </div>
            )}
          </nav>

          {/* Footer - Logout */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="flex items-center justify-center w-full px-3 py-2.5 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
            >
              <span className="text-xl">🚪</span>
              {isOpen && <span className="ml-2">Logout</span>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
