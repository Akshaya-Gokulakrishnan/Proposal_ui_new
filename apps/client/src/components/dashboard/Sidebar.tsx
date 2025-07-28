import React, { useState } from 'react';
import {
  FiChevronLeft,
  FiChevronRight,
  FiFolder,
  FiLayers,
  FiLogOut,
  FiSettings,
  FiUpload,
  FiZap,
} from 'react-icons/fi';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/HexawareBlueLogo 2.png';
import { useAuth } from '../../hooks/useAuth';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiLayers },
    { path: '/dashboard/workspaces', label: 'Workspaces', icon: FiFolder },
    { path: '/dashboard/content-ingestion', label: 'Content Hub', icon: FiUpload },
    { path: '/dashboard/prompt-templates', label: 'Templates', icon: FiSettings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-64'} h-full bg-white border-r border-gray-200 flex flex-col shadow-sm transition-all duration-300 ease-in-out`}
    >
      <div
        className={`flex items-center justify-between p-6 border-b border-gray-200 ${collapsed ? 'justify-center p-4' : ''}`}
      >
        {!collapsed && (
          <div className="flex flex-col items-center space-y-2 w-full">
            <img src={logo} alt="Logo" className="h-6 w-auto transition-all duration-200" />
            <span className="text-sm font-bold text-gray-800 tracking-wide">PROPOSAL CRAFT</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${collapsed ? '' : 'ml-2'}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => {
                    const isWorkspaceActive =
                      item.path === '/dashboard/workspaces' &&
                      (location.pathname.startsWith('/dashboard/workspaces') ||
                        location.pathname.startsWith('/dashboard/proposal-authoring'));
                    const active = isActive || isWorkspaceActive;
                    return `flex items-center ${collapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-3 rounded-xl transition-all duration-200 ${
                      active 
                        ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
                    }`;
                  }}
                  end={item.path === '/dashboard'}
                >
                  {({ isActive }) => {
                    const isWorkspaceActive =
                      item.path === '/dashboard/workspaces' &&
                      (location.pathname.startsWith('/dashboard/workspaces') ||
                        location.pathname.startsWith('/dashboard/proposal-authoring'));
                    const active = isActive || isWorkspaceActive;
                    return (
                      <>
                        <IconComponent
                          className={`w-5 h-5 ${
                            collapsed
                              ? active
                                ? 'mx-auto text-white'
                                : 'mx-auto text-gray-700'
                              : active
                                ? 'text-white'
                                : 'text-gray-700'
                          }`}
                        />
                        {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
                      </>
                    );
                  }}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/dashboard/workspaces?create=1')}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl font-medium hover:from-primary/90 hover:to-primary/80 transition-all duration-200 shadow-lg shadow-primary/25 mb-3"
          >
            <FiZap className="w-4 h-4" />
            <span className="text-sm">New Workspace</span>
          </button>
        </div>
      )}

      {user && !collapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-semibold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:bg-white hover:text-gray-900 rounded-lg transition-all duration-200 border border-gray-200"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;