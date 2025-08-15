import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../api/axios';

const Reports = () => {
  const [reportType, setReportType] = useState('financial');
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    paymentStatus: '',
    paymentMethod: '',
    vessel: ''
  });
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ field: 'createdAt', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false); // Changed to false by default
  const [quickFilter, setQuickFilter] = useState('thisMonth');
  
  const itemsPerPage = 20;

  // Quick date filters
  const quickFilters = {
    today: { label: 'Hoje', days: 0 },
    yesterday: { label: 'Ontem', days: 1 },
    thisWeek: { label: 'Esta Semana', days: 7 },
    thisMonth: { label: 'Este Mês', days: 30 },
    last3Months: { label: 'Últimos 3 Meses', days: 90 },
    thisYear: { label: 'Este Ano', days: 365 }
  };

  const reportTypes = [
    { value: 'financial', label: '💰 Financeiro', icon: '💰' },
    { value: 'payments', label: '💳 Pagamentos', icon: '💳' },
    { value: 'customers', label: '👥 Clientes', icon: '👥' }
  ];

  const generateReport = useCallback(async () => {
    setIsLoading(true);
    setCurrentPage(1); // Reset pagination
    try {
      console.log('Generating report:', reportType, 'with filters:', filters);
      const response = await api.get(`/reports/${reportType}`, { params: filters });
      console.log('Report response:', response.data);
      setReportData(response.data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      
      // Tentar buscar dados básicos para debug
      try {
        const debugResponse = await api.get('/reports/debug');
        console.log('Debug response:', debugResponse.data);
      } catch (debugError) {
        console.error('Debug request failed:', debugError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [reportType, filters]);

  // Function to generate report with specific filters (for quick filters)
  const generateReportWithFilters = useCallback(async (customFilters) => {
    setIsLoading(true);
    setCurrentPage(1); // Reset pagination
    try {
      console.log('Generating report:', reportType, 'with custom filters:', customFilters);
      const response = await api.get(`/reports/${reportType}`, { params: customFilters });
      console.log('Report response:', response.data);
      setReportData(response.data);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      
      // Tentar buscar dados básicos para debug
      try {
        const debugResponse = await api.get('/reports/debug');
        console.log('Debug response:', debugResponse.data);
      } catch (debugError) {
        console.error('Debug request failed:', debugError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [reportType]);

  const applyQuickFilter = useCallback((filterKey) => {
    const filter = quickFilters[filterKey];
    const endDate = new Date();
    const startDate = new Date();
    
    if (filterKey === 'today') {
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (filterKey === 'yesterday') {
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (filterKey === 'thisWeek') {
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (filterKey === 'thisMonth') {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (filterKey === 'thisYear') {
      startDate.setMonth(0, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate.setDate(startDate.getDate() - filter.days);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    }
    
    const newFilters = {
      ...filters,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
    
    setFilters(newFilters);
    setQuickFilter(filterKey);
    
    // Auto-generate report with new filters
    generateReportWithFilters(newFilters);
  }, [filters, generateReportWithFilters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    setQuickFilter(''); // Reset quick filter when manual date is changed
  };

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    if (!reportData?.data) return [];
    
    let data = [...reportData.data];
    
    // Apply search filter
    if (searchTerm) {
      data = data.filter(item => 
        item.noteNumber?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ticketNumber?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.passengerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vessel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    data.sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      if (sortConfig.field === 'createdAt') {
        return sortConfig.direction === 'asc' 
          ? new Date(aValue) - new Date(bValue)
          : new Date(bValue) - new Date(aValue);
      }
      
      if (sortConfig.field === 'totalValue') {
        return sortConfig.direction === 'asc' 
          ? (aValue || 0) - (bValue || 0)
          : (bValue || 0) - (aValue || 0);
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'asc' 
        ? (aValue || 0) - (bValue || 0)
        : (bValue || 0) - (aValue || 0);
    });
    
    return data;
  }, [reportData?.data, searchTerm, sortConfig]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportReport = async (format) => {
    setIsExporting(true);
    try {
      console.log('Exporting report:', reportType, 'as', format);
      
      const response = await api.get(`/reports/${reportType}/export`, {
        params: { ...filters, format },
        responseType: 'blob'
      });

      // Verificar se a resposta é realmente um blob válido
      if (response.data.size === 0) {
        throw new Error('Arquivo vazio recebido do servidor');
      }

      const blob = new Blob([response.data], {
        type: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'
      });
      
      // Verificar se o blob foi criado corretamente
      if (blob.size === 0) {
        throw new Error('Erro na criação do arquivo');
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link); // Adicionar ao DOM temporariamente
      link.click();
      document.body.removeChild(link); // Remover do DOM
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      
      // Log detailed error information for debugging
      console.error('Error details:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (date) => {
    if (!date) return '---';
    
    try {
      const dateObj = new Date(date);
      
      // Verificar se a data é válida
      if (isNaN(dateObj.getTime())) {
        return '---';
      }
      
      return dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'UTC'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '---';
    }
  };

  const getSortIcon = (field) => {
    if (sortConfig.field !== field) return '↕️';
    return sortConfig.direction === 'asc' ? '⬆️' : '⬇️';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pago':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'pix':
        return '💳';
      case 'dinheiro':
        return '💵';
      case 'cartao':
        return '💳';
      default:
        return '❓';
    }
  };

  const getRecordTypeIcon = (type) => {
    switch (type) {
      case 'nota':
        return '📋';
      case 'bilhete':
        return '🎫';
      default:
        return '📄';
    }
  };

  const getRecordTypeColor = (type) => {
    switch (type) {
      case 'nota':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'bilhete':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCustomerTypeIcon = (type) => {
    switch (type) {
      case 'cliente_frete':
        return '📦';
      case 'passageiro':
        return '🎫';
      case 'cliente_misto':
        return '🔄';
      default:
        return '👤';
    }
  };

  useEffect(() => {
    // Only generate report when report type changes, not on initial load
    if (reportData) {
      generateReport();
    }
  }, [reportType]);

  useEffect(() => {
    // Auto-apply thisMonth on component mount and generate first report
    applyQuickFilter('thisMonth');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                📊 Relatórios Avançados
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Análise detalhada e insights do seu sistema de frete
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Export PDF Button - Only show when there's report data */}
              {reportData && (
                <button
                  onClick={() => exportReport('pdf')}
                  disabled={isExporting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                  title="Exportar relatório atual para PDF"
                >
                  {isExporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>📄 Exportar PDF</>
                  )}
                </button>
              )}
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium ${
                  showFilters 
                    ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900 dark:hover:bg-red-800 dark:text-red-200' 
                    : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900 dark:hover:bg-indigo-800 dark:text-indigo-200'
                }`}
                title={showFilters ? 'Clique para ocultar os filtros avançados' : 'Clique para mostrar filtros personalizados'}
              >
                {showFilters ? (
                  <>
                    ⚙️ Ocultar Filtros Avançados
                    <span className="text-xs bg-red-200 dark:bg-red-800 px-2 py-1 rounded-full">
                      Ativo
                    </span>
                  </>
                ) : (
                  <>
                    ⚙️ Filtros Avançados
                    <span className="text-xs bg-indigo-200 dark:bg-indigo-800 px-2 py-1 rounded-full">
                      Oculto
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📈 Tipo de Relatório
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {reportTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setReportType(type.value)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  reportType === type.value
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div className={`font-medium text-sm ${
                  reportType === type.value 
                    ? 'text-indigo-700 dark:text-indigo-300' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}>{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ⚡ Filtros Rápidos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Clique em um período para gerar o relatório automaticamente
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(quickFilters).map(([key, filter]) => (
              <button
                key={key}
                onClick={() => applyQuickFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  quickFilter === key
                    ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 hover:shadow-md'
                }`}
                title={`Clique para gerar automaticamente o relatório ${filter.label.toLowerCase()} com fretes e bilhetes`}
              >
                {quickFilter === key && '✅ '}
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-2 border-indigo-200 dark:border-indigo-800 animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  🔍 Filtros Avançados
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure filtros personalizados para análises mais específicas
                </p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900 px-3 py-1 rounded-full">
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  ✨ Modo Avançado Ativo
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
              {/* Data Início */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  📅 Data Início
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Data Fim */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  📅 Data Fim
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Status Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  💰 Status Pagamento
                </label>
                <select
                  name="paymentStatus"
                  value={filters.paymentStatus}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Todos</option>
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  💳 Forma Pagamento
                </label>
                <select
                  name="paymentMethod"
                  value={filters.paymentMethod}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Todos</option>
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="cartao">Cartão</option>
                </select>
              </div>

              {/* Embarcação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  🚢 Embarcação
                </label>
                <input
                  type="text"
                  name="vessel"
                  value={filters.vessel}
                  onChange={handleFilterChange}
                  placeholder="Nome da embarcação"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={generateReport}
                disabled={isLoading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center font-medium"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : null}
                🔍 Gerar Relatório
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mr-4"></div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Gerando relatório...
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Processando dados, aguarde um momento
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Report Results */}
        {!isLoading && reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      {reportType === 'customers' ? 'Total de Clientes' : 'Total de Registros'}
                    </p>
                    <p className="text-2xl font-bold">
                      {reportData.summary?.totalItems || 
                       reportData.summary?.totalCustomers || 
                       (reportData.summary?.totalNotes || 0) + (reportData.summary?.totalTickets || 0)}
                    </p>
                    {(reportData.summary?.totalNotes || reportData.summary?.totalTickets) && (
                      <p className="text-blue-200 text-xs flex items-center gap-1">
                        🚚 {reportData.summary?.totalNotes || 0} fretes • 🎫 {reportData.summary?.totalTickets || 0} bilhetes
                      </p>
                    )}
                    {reportType === 'customers' && (
                      <p className="text-blue-200 text-xs">
                        💼 Dados combinados de fretes e passagens
                      </p>
                    )}
                  </div>
                  <div className="text-3xl opacity-80">📊</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Receita Total</p>
                    <p className="text-2xl font-bold">{formatCurrency(reportData.summary?.totalRevenue)}</p>
                    <p className="text-green-200 text-xs">
                      💰 Fretes + Passagens combinados
                    </p>
                  </div>
                  <div className="text-3xl opacity-80">💰</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">
                      {reportType === 'payments' ? 'Pagamentos Pendentes' : 'Pendências'}
                    </p>
                    <p className="text-2xl font-bold">
                      {reportData.summary?.pendingPayments || 0}
                    </p>
                    {reportType === 'payments' && reportData.summary?.totalPaid && (
                      <p className="text-yellow-200 text-xs flex items-center gap-1">
                        ✅ {reportData.summary.totalPaid} pagos • ⏳ {reportData.summary.pendingPayments || 0} pendentes
                      </p>
                    )}
                  </div>
                  <div className="text-3xl opacity-80">⏳</div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">
                      {reportType === 'customers' ? 'Valor Médio por Cliente' : 'Ticket Médio'}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(reportData.summary?.averageTicket || reportData.summary?.averageCustomerValue)}
                    </p>
                    {reportType === 'customers' && reportData.summary?.mixedCustomers && (
                      <p className="text-purple-200 text-xs">
                        {reportData.summary.mixedCustomers} clientes mistos
                      </p>
                    )}
                  </div>
                  <div className="text-3xl opacity-80">🎯</div>
                </div>
              </div>
            </div>

            {/* Payment Methods Breakdown - Only for Payments Report */}
            {reportType === 'payments' && reportData.summary?.paymentMethodBreakdown && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  💳 Receita por Método de Pagamento
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(reportData.summary.paymentMethodBreakdown).map(([method, data]) => (
                    <div key={method} className={`p-4 rounded-lg border-2 ${
                      method === 'pix' ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20' :
                      method === 'dinheiro' ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20' :
                      method === 'cartao' ? 'border-purple-200 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20' :
                      'border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-700'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          {getPaymentMethodIcon(method)} 
                          {method === 'pix' ? 'PIX' : 
                           method === 'dinheiro' ? 'Dinheiro' : 
                           method === 'cartao' ? 'Cartão' : method}
                        </h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(data.revenue || 0)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          📊 {data.count || 0} transações
                        </p>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              method === 'pix' ? 'bg-blue-500' :
                              method === 'dinheiro' ? 'bg-green-500' :
                              method === 'cartao' ? 'bg-purple-500' : 'bg-gray-500'
                            }`}
                            style={{ 
                              width: `${Math.min(100, (data.revenue / reportData.summary.totalRevenue) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {((data.revenue / reportData.summary.totalRevenue) * 100).toFixed(1)}% do total
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pendentes Card */}
                  {reportData.summary.pendingValue > 0 && (
                    <div className="p-4 rounded-lg border-2 border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          ⏳ Pendentes
                        </h4>
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(reportData.summary.pendingValue || 0)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          📊 {reportData.summary.pendingPayments || 0} pendências
                        </p>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-red-500"
                            style={{ 
                              width: `${Math.min(100, ((reportData.summary.pendingValue || 0) / (reportData.summary.totalRevenue + (reportData.summary.pendingValue || 0))) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(((reportData.summary.pendingValue || 0) / (reportData.summary.totalRevenue + (reportData.summary.pendingValue || 0))) * 100).toFixed(1)}% não recebido
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Search and Pagination Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="🔍 Buscar por número, cliente, passageiro, tipo ou embarcação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    Mostrando {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a{' '}
                    {Math.min(currentPage * itemsPerPage, filteredData.length)} de{' '}
                    {filteredData.length} registros
                  </span>
                </div>
              </div>
            </div>

            {/* Data Display */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                {/* Desktop Table View */}
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 hidden md:table">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      {reportType !== 'customers' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Tipo
                        </th>
                      )}
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort(reportType === 'customers' ? 'name' : 'noteNumber')}
                      >
                        {reportType === 'customers' ? 'Cliente/Passageiro' : 'Número'} {getSortIcon(reportType === 'customers' ? 'name' : 'noteNumber')}
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('createdAt')}
                      >
                        {reportType === 'customers' ? 'Última Transação' : 'Data'} {getSortIcon('createdAt')}
                      </th>
                      {reportType !== 'customers' && (
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                          onClick={() => handleSort('recipient')}
                        >
                          Cliente/Passageiro {getSortIcon('recipient')}
                        </th>
                      )}
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                        onClick={() => handleSort('totalValue')}
                      >
                        Valor {getSortIcon('totalValue')}
                      </th>
                      {reportType === 'customers' ? (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Transações
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Contato
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                            Pagamento
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        {reportType !== 'customers' && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRecordTypeColor(item.type)}`}>
                              {getRecordTypeIcon(item.type)} {item.type === 'nota' ? 'Frete' : 'Bilhete'}
                            </span>
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {reportType === 'customers' ? (
                            <div className="flex items-center">
                              <span className="mr-2">{getCustomerTypeIcon(item.type)}</span>
                              {item.name}
                            </div>
                          ) : (
                            <>#{item.noteNumber || item.ticketNumber}</>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatDate(item.createdAt || item.lastTransaction)}
                        </td>
                        {reportType !== 'customers' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {item.recipient || item.passengerName || item.name}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(item.totalValue)}
                          {reportType === 'customers' && item.paidValue !== undefined && (
                            <div className="text-xs text-gray-500">
                              Pago: {formatCurrency(item.paidValue)} • Pendente: {formatCurrency(item.pendingValue)}
                            </div>
                          )}
                        </td>
                        {reportType === 'customers' ? (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              <div className="space-y-1">
                                {item.totalNotes > 0 && <div>📦 {item.totalNotes} frete(s)</div>}
                                {item.totalTickets > 0 && <div>🎫 {item.totalTickets} bilhete(s)</div>}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.phone && <div>📞 {item.phone}</div>}
                              {item.city && <div>📍 {item.city}</div>}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.paymentStatus || item.status)}`}>
                                {item.paymentStatus === 'pago' || item.status === 'pago' ? '✅ Pago' : 
                                 item.paymentStatus === 'cancelado' || item.status === 'cancelado' ? '❌ Cancelado' : '⏳ Pendente'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                              {item.paymentMethod ? 
                                `${getPaymentMethodIcon(item.paymentMethod)} ${item.paymentMethod.charAt(0).toUpperCase() + item.paymentMethod.slice(1)}` 
                                : '---'
                              }
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4 p-4">
                  {paginatedData.map((item, index) => (
                    <div 
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-4 space-y-3"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {reportType === 'customers' ? (
                            <div className="flex items-center">
                              <span className="mr-2 text-lg">{getCustomerTypeIcon(item.type)}</span>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {item.name}
                              </h3>
                            </div>
                          ) : (
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              #{item.noteNumber || item.ticketNumber}
                            </h3>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(item.createdAt || item.lastTransaction)}
                          </p>
                        </div>
                        {reportType !== 'customers' && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRecordTypeColor(item.type)}`}>
                            {getRecordTypeIcon(item.type)} {item.type === 'nota' ? 'Frete' : 'Bilhete'}
                          </span>
                        )}
                      </div>

                      {/* Customer/Passenger Info */}
                      {reportType !== 'customers' && (
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            {item.type === 'nota' ? 'Destinatário:' : 'Passageiro:'}
                          </span>
                          <p className="text-sm text-gray-900 dark:text-white mt-1">
                            {item.recipient || item.passengerName || item.name}
                          </p>
                        </div>
                      )}

                      {/* Value and Payment Info */}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor:</span>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                              {formatCurrency(item.totalValue)}
                            </p>
                            {reportType === 'customers' && item.paidValue !== undefined && (
                              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-1">
                                <div>Pago: {formatCurrency(item.paidValue)}</div>
                                <div>Pendente: {formatCurrency(item.pendingValue)}</div>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {reportType === 'customers' ? (
                              <div className="space-y-1 text-sm">
                                {item.totalNotes > 0 && (
                                  <div className="text-gray-600 dark:text-gray-300">
                                    📦 {item.totalNotes} frete(s)
                                  </div>
                                )}
                                {item.totalTickets > 0 && (
                                  <div className="text-gray-600 dark:text-gray-300">
                                    🎫 {item.totalTickets} bilhete(s)
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.paymentStatus || item.status)}`}>
                                  {item.paymentStatus === 'pago' || item.status === 'pago' ? '✅ Pago' : 
                                   item.paymentStatus === 'cancelado' || item.status === 'cancelado' ? '❌ Cancelado' : '⏳ Pendente'}
                                </span>
                                {item.paymentMethod && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {getPaymentMethodIcon(item.paymentMethod)} {item.paymentMethod.charAt(0).toUpperCase() + item.paymentMethod.slice(1)}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contact Info for Customers */}
                      {reportType === 'customers' && (item.phone || item.city) && (
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Contato:</span>
                          <div className="mt-1 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            {item.phone && <div>📞 {item.phone}</div>}
                            {item.city && <div>📍 {item.city}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    ⬅️ Anterior
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => i + 1).filter(page => {
                    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2;
                  }).map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] < page - 1 && (
                        <span className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Próximo ➡️
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !reportData && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <span className="text-6xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Bem-vindo aos Relatórios!
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Clique em um dos <strong>Filtros Rápidos</strong> acima para gerar seu primeiro relatório automaticamente,<br />
              ou use os <strong>Filtros Avançados</strong> para uma análise personalizada.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => applyQuickFilter('thisMonth')}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
              >
                � Relatório do Mês
              </button>
              <button
                onClick={() => applyQuickFilter('today')}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                🌅 Relatório de Hoje
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
