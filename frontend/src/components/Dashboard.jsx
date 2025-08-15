import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useVessel } from '../contexts/VesselContext';

const Dashboard = () => {
  const { selectedVessel } = useVessel();
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalTickets: 0,
    totalRevenue: 0,
    ticketRevenue: 0,
    pendingPayments: 0,
    paidPayments: 0,
    pendingTickets: 0,
    paidTickets: 0,
    canceledNotes: 0,
    canceledTickets: 0,
    revenueByMonth: [],
    paymentMethods: {},
    recentNotes: [],
    recentTickets: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  
  // Pagination states
  const [notesCurrentPage, setNotesCurrentPage] = useState(1);
  const [ticketsCurrentPage, setTicketsCurrentPage] = useState(1);
  const itemsPerPage = 5; // Default to 5 items per page

  // Quick date filters similar to Reports component
  const quickFilters = {
    today: { label: 'Hoje', period: 'today' },
    yesterday: { label: 'Ontem', period: 'yesterday' },
    thisWeek: { label: 'Esta Semana', period: 'thisWeek' },
    thisMonth: { label: 'Este Mês', period: 'thisMonth' },
    last30Days: { label: 'Últimos 30 Dias', period: 'last30Days' },
    thisYear: { label: 'Este Ano', period: 'thisYear' },
    all: { label: 'Todos os Períodos', period: 'all' }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod, selectedVessel]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching dashboard data for period:', selectedPeriod); // Debug log
      
      // Construir URL com filtros
      let url = `/reports/dashboard?period=${selectedPeriod}`;
      if (selectedVessel?.name) {
        url += `&vessel=${encodeURIComponent(selectedVessel.name)}`;
      }
      
      console.log('Dashboard URL:', url); // Debug log
      const response = await api.get(url);
      console.log('Dashboard response:', response.data); // Debug log
      setStats(response.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
      
      // Tentar buscar dados básicos
      try {
        const debugResponse = await api.get('/reports/debug');
        console.log('Debug response:', debugResponse.data);
        if (debugResponse.data.totalNotesInDB === 0) {
          toast.info('Nenhuma nota de frete foi criada ainda. Crie algumas notas para ver os dados nos relatórios.');
        }
      } catch (debugError) {
        console.error('Debug request failed:', debugError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to apply quick filters
  const applyQuickFilter = (filterKey) => {
    setSelectedPeriod(quickFilters[filterKey].period);
    // Reset pagination when filter changes
    setNotesCurrentPage(1);
    setTicketsCurrentPage(1);
  };

  // Pagination functions
  const getPaginatedNotes = () => {
    const startIndex = (notesCurrentPage - 1) * itemsPerPage;
    return stats.recentNotes.slice(startIndex, startIndex + itemsPerPage);
  };

  const getPaginatedTickets = () => {
    const startIndex = (ticketsCurrentPage - 1) * itemsPerPage;
    return stats.recentTickets.slice(startIndex, startIndex + itemsPerPage);
  };

  const getTotalNotesPages = () => Math.ceil(stats.recentNotes.length / itemsPerPage);
  const getTotalTicketsPages = () => Math.ceil((stats.recentTickets?.length || 0) / itemsPerPage);

  const handleNotesPageChange = (page) => {
    setNotesCurrentPage(page);
  };

  const handleTicketsPageChange = (page) => {
    setTicketsCurrentPage(page);
  };

  // Pagination component
  const PaginationControls = ({ currentPage, totalPages, onPageChange, label }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>
            Página {currentPage} de {totalPages} • {label}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 text-sm rounded-md ${
                page === currentPage
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
      </div>
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    
    try {
      const date = new Date(dateString);
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return '---';
      }
      
      return date.toLocaleDateString('pt-BR', {
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

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'pix': return '💳';
      case 'dinheiro': return '💵';
      case 'cartao': return '💳';
      default: return '💰';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📊 Dashboard
            </h1>
            {selectedVessel && (
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                🚢 <span className="ml-1">{selectedVessel.name}</span>
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              🔄 Atualizar
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            ⚡ Filtros Rápidos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Clique em um período para atualizar os dados do dashboard automaticamente
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(quickFilters).map(([key, filter]) => (
              <button
                key={key}
                onClick={() => applyQuickFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedPeriod === filter.period
                    ? 'bg-indigo-600 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 hover:shadow-md'
                }`}
                title={`Clique para atualizar o dashboard com dados ${filter.label.toLowerCase()}`}
              >
                {selectedPeriod === filter.period && '✅ '}
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Notas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Notas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalNotes}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>

          {/* Receita Total */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Receita Total
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          {/* Pagamentos Pendentes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pagamentos Pendentes
                </p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.pendingPayments}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          {/* Pagamentos Pagos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pagamentos Pagos
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.paidPayments}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Tickets */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Tickets
                </p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats.totalTickets || 0}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-full">
                <span className="text-2xl">🎫</span>
              </div>
            </div>
          </div>

          {/* Receita de Tickets */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Receita de Tickets
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(stats.ticketRevenue || 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <span className="text-2xl">💳</span>
              </div>
            </div>
          </div>

          {/* Tickets Pendentes */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tickets Pendentes
                </p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats.pendingTickets || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-full">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>

          {/* Tickets Pagos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tickets Pagos
                </p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {stats.paidTickets || 0}
                </p>
              </div>
              <div className="p-3 bg-teal-100 dark:bg-teal-900/20 rounded-full">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Formas de Pagamento */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              💳 Formas de Pagamento
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.paymentMethods).map(([method, data]) => (
                <div key={method} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">{getPaymentMethodIcon(method)}</span>
                    <span className="text-gray-700 dark:text-gray-300 capitalize">
                      {method === 'pix' ? 'PIX' : 
                       method === 'dinheiro' ? 'Dinheiro' : 
                       method === 'cartao' ? 'Cartão' : method}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {data.count} notas
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {formatCurrency(data.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Status das Notas */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Status das Notas
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Ativas</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.totalNotes - stats.canceledNotes}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 dark:text-gray-300">Canceladas</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {stats.canceledNotes}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notas Recentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🕒 Notas de Frete Recentes
              </h3>
              {stats.recentNotes.length > 0 && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.recentNotes.length} nota{stats.recentNotes.length !== 1 ? 's' : ''} encontrada{stats.recentNotes.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div className="p-6 pb-0">
            {stats.recentNotes.length > 0 ? (
              <div className="overflow-x-auto">
                {/* Desktop Table View */}
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 hidden md:table">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Destinatário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Pagamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {getPaginatedNotes().map((note) => (
                      <tr key={note._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          #{note.noteNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {note.recipient}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatCurrency(note.totalValue || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            note.paymentStatus === 'pago'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {note.paymentStatus === 'pago' ? '✅ Pago' : '⏳ Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatDate(note.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {getPaginatedNotes().map((note) => (
                    <div 
                      key={note._id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            #{note.noteNumber}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {note.recipient}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          note.paymentStatus === 'pago'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {note.paymentStatus === 'pago' ? '✅ Pago' : '⏳ Pendente'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(note.totalValue || 0)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatDate(note.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nenhuma nota de frete encontrada no período selecionado.
              </p>
            )}
          </div>
          {stats.recentNotes.length > 0 && (
            <PaginationControls
              currentPage={notesCurrentPage}
              totalPages={getTotalNotesPages()}
              onPageChange={handleNotesPageChange}
              label={`${stats.recentNotes.length} notas de frete`}
            />
          )}
        </div>

        {/* Tickets Recentes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                🎫 Bilhetes de Passagem Recentes
              </h3>
              {(stats.recentTickets && stats.recentTickets.length > 0) && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stats.recentTickets.length} bilhete{stats.recentTickets.length !== 1 ? 's' : ''} encontrado{stats.recentTickets.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <div className="p-6 pb-0">
            {(stats.recentTickets && stats.recentTickets.length > 0) ? (
              <div className="overflow-x-auto">
                {/* Desktop Table View */}
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 hidden md:table">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Passageiro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Pagamento
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {getPaginatedTickets().map((ticket) => (
                      <tr key={ticket._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          #{ticket.ticketNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {ticket.passengerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatCurrency(ticket.totalValue || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ticket.paymentStatus === 'pago'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {ticket.paymentStatus === 'pago' ? '✅ Pago' : '⏳ Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                          {formatDate(ticket.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-3">
                  {getPaginatedTickets().map((ticket) => (
                    <div 
                      key={ticket._id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                            #{ticket.ticketNumber}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {ticket.passengerName}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          ticket.paymentStatus === 'pago'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                        }`}>
                          {ticket.paymentStatus === 'pago' ? '✅ Pago' : '⏳ Pendente'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(ticket.totalValue || 0)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Nenhum bilhete de passagem encontrado no período selecionado.
              </p>
            )}
          </div>
          {(stats.recentTickets && stats.recentTickets.length > 0) && (
            <PaginationControls
              currentPage={ticketsCurrentPage}
              totalPages={getTotalTicketsPages()}
              onPageChange={handleTicketsPageChange}
              label={`${stats.recentTickets.length} bilhetes de passagem`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
