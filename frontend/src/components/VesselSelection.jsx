import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VesselSelection = ({ onVesselSelect }) => {
  const [selectedVessel, setSelectedVessel] = useState('');
  const navigate = useNavigate();

  const vessels = [
    {
      id: 'almirante-oliveira-v',
      name: 'B/M Almirante Oliveira V',
      icon: '🚢',
      description: 'Embarcação principal para transporte de cargas e passageiros'
    },
    {
      id: 'comandante-oliveira-ii',
      name: 'N/M Comandante Oliveira II',
      icon: '⛵',
      description: 'Embarcação secundária para rotas específicas'
    }
  ];

  const handleVesselSelect = (vessel) => {
    setSelectedVessel(vessel.id);
    // Armazenar a embarcação selecionada no localStorage
    localStorage.setItem('selectedVessel', JSON.stringify({
      id: vessel.id,
      name: vessel.name
    }));
    onVesselSelect(vessel);
  };

  const handleContinue = () => {
    if (selectedVessel) {
      navigate('/freight-notes');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <span className="text-6xl">🚢</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Sistema de Gestão Marítima
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Selecione a embarcação para gerenciar
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Escolha a embarcação que será utilizada para registrar fretes e passageiros
          </p>
        </div>

        {/* Vessel Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {vessels.map((vessel) => (
            <div
              key={vessel.id}
              onClick={() => handleVesselSelect(vessel)}
              className={`
                relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer transform hover:scale-105
                ${selectedVessel === vessel.id 
                  ? 'border-blue-500 ring-4 ring-blue-500 ring-opacity-20 shadow-xl' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl'
                }
              `}
            >
              {/* Selection Indicator */}
              {selectedVessel === vessel.id && (
                <div className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold">✓</span>
                </div>
              )}

              <div className="p-8 text-center">
                {/* Vessel Icon */}
                <div className="text-6xl mb-6">
                  {vessel.icon}
                </div>

                {/* Vessel Name */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {vessel.name}
                </h2>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  {vessel.description}
                </p>

                {/* Selection Status */}
                <div className={`
                  inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${selectedVessel === vessel.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }
                `}>
                  {selectedVessel === vessel.id ? (
                    <>
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Selecionado
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                      Clique para selecionar
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        {selectedVessel && (
          <div className="text-center animate-fadeIn">
            <button
              onClick={handleContinue}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20"
            >
              🚀 Continuar para o Sistema
            </button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
              Você poderá alterar a embarcação a qualquer momento
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 text-sm text-gray-400 dark:text-gray-600">
          <p>© 2025 Sistema de Gestão Marítima - Transporte & Frete</p>
        </div>
      </div>
    </div>
  );
};

export default VesselSelection;
