import React, { createContext, useContext, useState, useEffect } from 'react';

const VesselContext = createContext();

export const useVessel = () => {
  const context = useContext(VesselContext);
  if (!context) {
    throw new Error('useVessel must be used within a VesselProvider');
  }
  return context;
};

export const VesselProvider = ({ children }) => {
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [isVesselSelected, setIsVesselSelected] = useState(false);

  // Carregar a embarcação selecionada do localStorage ao inicializar
  useEffect(() => {
    const storedVessel = localStorage.getItem('selectedVessel');
    if (storedVessel) {
      try {
        const vessel = JSON.parse(storedVessel);
        setSelectedVessel(vessel);
        setIsVesselSelected(true);
      } catch (error) {
        console.error('Erro ao carregar embarcação do localStorage:', error);
        localStorage.removeItem('selectedVessel');
      }
    }
  }, []);

  const selectVessel = (vessel) => {
    setSelectedVessel(vessel);
    setIsVesselSelected(true);
    localStorage.setItem('selectedVessel', JSON.stringify(vessel));
  };

  const clearVesselSelection = () => {
    setSelectedVessel(null);
    setIsVesselSelected(false);
    localStorage.removeItem('selectedVessel');
  };

  // Função para obter o nome da collection baseado na embarcação
  const getCollectionName = (baseCollection) => {
    if (!selectedVessel) return baseCollection;
    
    // Normalizar o nome da embarcação para usar como nome da collection
    const vesselKey = selectedVessel.id.replace(/-/g, '_');
    return `${baseCollection}_${vesselKey}`;
  };

  const value = {
    selectedVessel,
    isVesselSelected,
    selectVessel,
    clearVesselSelection,
    getCollectionName,
  };

  return (
    <VesselContext.Provider value={value}>
      {children}
    </VesselContext.Provider>
  );
};

export default VesselContext;
