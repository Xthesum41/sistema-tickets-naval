import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useVessel } from '../contexts/VesselContext';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { selectedVessel, selectVessel, clearVesselSelection } = useVessel();
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [showVesselMenu, setShowVesselMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const vessels = [
    {
      id: 'almirante-oliveira-v',
      name: 'B/M Almirante Oliveira V',
      icon: '🚢',
    },
    {
      id: 'comandante-oliveira-ii',
      name: 'N/M Comandante Oliveira II',
      icon: '⛵',
    }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleChangeVessel = () => {
    clearVesselSelection();
    setShowVesselMenu(false);
  };

  const handleSwitchToVessel = (vessel) => {
    selectVessel(vessel);
    setShowVesselMenu(false);
  };

  const getOtherVessel = () => {
    if (!selectedVessel) return null;
    return vessels.find(v => v.id !== selectedVessel.id);
  };

  const getVesselIcon = (vesselName) => {
    return vesselName?.includes('Almirante') ? '🚢' : '⛵';
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                <span className="hidden sm:block">Sistema de Frete</span>
                <span className="sm:hidden"></span>
              </h1>
            </div>
            {/* Vessel Display */}
            {selectedVessel && (
              <div className="ml-6 relative">
                <button
                  onClick={() => setShowVesselMenu(!showVesselMenu)}
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <span className="mr-2">{getVesselIcon(selectedVessel.name)}</span>
                  <span className="hidden sm:block">{selectedVessel.name}</span>
                  <span className="sm:hidden">Embarcação</span>
                  <span className="ml-2">⌄</span>
                </button>
                
                {showVesselMenu && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-50">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Embarcação Atual:</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                        <span className="mr-2">{getVesselIcon(selectedVessel.name)}</span>
                        {selectedVessel.name}
                      </div>
                    </div>
                    <div className="p-2">
                      {getOtherVessel() && (
                        <button
                          onClick={() => handleSwitchToVessel(getOtherVessel())}
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors mb-1 flex items-center"
                        >
                          <span className="mr-2">{getOtherVessel().icon}</span>
                          <span className="flex-1">{getOtherVessel().name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">→</span>
                        </button>
                      )}
                      <hr className="my-2 border-gray-200 dark:border-gray-600" />
                      <button
                        onClick={handleChangeVessel}
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        🔄 Trocar Embarcação
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link
                  to="/tickets"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/tickets')
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  🎫 Bilhetes
                </Link>
                <Link
                  to="/freight-notes"
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/freight-notes')
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  📋 Notas de Frete
                </Link>
                {isAdmin() && (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/dashboard')
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      📊 Dashboard
                    </Link>
                    <Link
                      to="/reports"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/reports')
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      📈 Relatórios
                    </Link>
                    <Link
                      to="/users"
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive('/users')
                          ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300'
                          : 'text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      👥 Usuários
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? '🌞' : '🌙'}
            </button>

            {/* Desktop User Menu */}
            <div className="hidden md:block relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="mr-2">{user?.role === 'admin' ? '👑' : '⚙️'}</span>
                <span className="hidden lg:block">{user?.name}</span>
                <span className="lg:hidden">{user?.role === 'admin' ? 'Admin' : 'Operador'}</span>
                <span className="ml-2">⌄</span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-50">
                  <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Logado como:</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <span className="mr-2">{user?.role === 'admin' ? '👑' : '⚙️'}</span>
                      {user?.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      @{user?.username} • {user?.role === 'admin' ? 'Administrador' : 'Operador'}
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-colors flex items-center"
                    >
                      🚪 Sair do Sistema
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Toggle mobile menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={`md:hidden transition-all duration-300 ease-in-out relative z-50 ${showMobileMenu ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-4 pt-2 pb-3 space-y-1 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          {/* User Info Mobile */}
          <div className="px-3 py-3 mb-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <span className="text-sm">{user?.role === 'admin' ? '👑' : '⚙️'}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    @{user?.username} • {user?.role === 'admin' ? 'Admin' : 'Operador'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  setShowMobileMenu(false);
                }}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-md transition-colors"
                title="Sair do sistema"
              >
                🚪
              </button>
            </div>
          </div>
          
          {/* Vessel Info Mobile */}
          {selectedVessel && (
            <div className="px-3 py-2 mb-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getVesselIcon(selectedVessel.name)}</span>
                  <div>
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Embarcação Atual
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 truncate">
                      {selectedVessel.name}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleChangeVessel();
                    setShowMobileMenu(false);
                  }}
                  className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md transition-colors text-sm"
                  title="Trocar embarcação"
                >
                  🔄
                </button>
              </div>
            </div>
          )}
          
          {/* Navigation Links */}
          <div className="space-y-1">
            <Link
              to="/tickets"
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                isActive('/tickets')
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-l-4 border-indigo-500'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <span className="mr-3 text-lg">🎫</span>
              <span>Bilhetes</span>
              {isActive('/tickets') && (
                <span className="ml-auto text-indigo-500 dark:text-indigo-400">•</span>
              )}
            </Link>
            
            <Link
              to="/freight-notes"
              onClick={() => setShowMobileMenu(false)}
              className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                isActive('/freight-notes')
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-l-4 border-indigo-500'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <span className="mr-3 text-lg">📋</span>
              <span>Notas de Frete</span>
              {isActive('/freight-notes') && (
                <span className="ml-auto text-indigo-500 dark:text-indigo-400">•</span>
              )}
            </Link>
            
            {isAdmin() && (
              <>
                <div className="pt-2 pb-1">
                  <div className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Administração
                  </div>
                </div>
                
                <Link
                  to="/dashboard"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-l-4 border-indigo-500'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  <span className="mr-3 text-lg">📊</span>
                  <span>Dashboard</span>
                  {isActive('/dashboard') && (
                    <span className="ml-auto text-indigo-500 dark:text-indigo-400">•</span>
                  )}
                </Link>
                
                <Link
                  to="/reports"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive('/reports')
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-l-4 border-indigo-500'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  <span className="mr-3 text-lg">📈</span>
                  <span>Relatórios</span>
                  {isActive('/reports') && (
                    <span className="ml-auto text-indigo-500 dark:text-indigo-400">•</span>
                  )}
                </Link>
                
                <Link
                  to="/users"
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive('/users')
                      ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border-l-4 border-indigo-500'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-indigo-600 dark:hover:text-indigo-400'
                  }`}
                >
                  <span className="mr-3 text-lg">👥</span>
                  <span>Usuários</span>
                  {isActive('/users') && (
                    <span className="ml-auto text-indigo-500 dark:text-indigo-400">•</span>
                  )}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Overlays para fechar menus */}
      {(showVesselMenu || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowVesselMenu(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;
