import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useVessel } from '../contexts/VesselContext';
import PaymentEditModal from './PaymentEditModal';
import { generateTicketPrintContent } from '../utils/printTemplates';

const TicketList = () => {
  const { selectedVessel } = useVessel();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCanceledTickets, setShowCanceledTickets] = useState(false);
  const [showPendingPayments, setShowPendingPayments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 10 items per page for better management

  useEffect(() => {
    fetchTickets();
  }, [selectedVessel?.name]); // Recarregar quando a embarcação mudar

  const fetchTickets = async () => {
    try {
      setLoading(true);
      // Filtrar por embarcação selecionada
      const params = selectedVessel?.name ? { vesselName: selectedVessel.name } : {};
      const response = await api.get('/tickets', { params });
      setTickets(response.data);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      toast.error('Erro ao carregar bilhetes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async (id) => {
    if (window.confirm('Tem certeza que deseja cancelar este bilhete?')) {
      try {
        await api.patch(`/tickets/${id}/cancel`);
        fetchTickets(); // Recarregar a lista
        toast.success('Bilhete cancelado com sucesso!');
      } catch (error) {
        console.error('Erro ao cancelar ticket:', error);
        toast.error('Erro ao cancelar bilhete');
      }
    }
  };

  const handlePaymentUpdate = async (updatedTicket) => {
    try {
      fetchTickets(); // Recarregar a lista para obter os dados mais recentes
      toast.success('Pagamento atualizado com sucesso!');
      setShowPaymentModal(false);
      setSelectedTicket(null);
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Erro ao atualizar pagamento');
      }
    }
  };

  const handleEditPayment = (ticket) => {
    setSelectedTicket(ticket);
    setShowPaymentModal(true);
  };

  const printReceipt = (ticketData) => {
    try {
      toast.info('Gerando comprovante para impressão...');
      
      // Usar a função utilitária para gerar o conteúdo
      const printContent = generateTicketPrintContent(ticketData);

      // Abrir em nova janela para impressão
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      toast.success('Comprovante gerado! A janela de impressão foi aberta.');
    } catch (error) {
      console.error('Erro ao gerar comprovante:', error);
      toast.error('Erro ao gerar comprovante para impressão.');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const filteredTickets = tickets.filter(ticket => {
    try {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = (
        ticket.passengerName?.toLowerCase().includes(searchTermLower) ||
        ticket.cpf?.toLowerCase().includes(searchTermLower) ||
        ticket.route?.toLowerCase().includes(searchTermLower) ||
        ticket.accommodationType?.toLowerCase().includes(searchTermLower) ||
        ticket.ticketNumber?.toString().toLowerCase().includes(searchTermLower)
      );
      
      // Filtrar por status se necessário
      const matchesStatus = showCanceledTickets ? 
        ticket.status === 'cancelado' : 
        (ticket.status !== 'cancelado' || !ticket.status);

      // Filtrar por pagamentos pendentes se necessário
      const matchesPayment = showPendingPayments ?
        ticket.paymentStatus === 'pendente' :
        true;
        
      return matchesSearch && matchesStatus && matchesPayment;
    } catch (error) {
      console.error('Erro no filtro de busca:', error);
      return false;
    }
  });

  // Pagination functions
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Reset pagination when search changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Reset pagination when filter changes
  const handleToggleCanceledTickets = () => {
    setShowCanceledTickets(!showCanceledTickets);
    setShowPendingPayments(false); // Desabilitar filtro de pagamentos pendentes
    setCurrentPage(1);
  };

  // Reset pagination when pending filter changes  
  const handleTogglePendingPayments = () => {
    setShowPendingPayments(!showPendingPayments);
    setShowCanceledTickets(false); // Desabilitar filtro de cancelados
    setCurrentPage(1);
  };

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          for (let i = 1; i <= 5; i++) {
            pages.push(i);
          }
        } else if (currentPage >= totalPages - 2) {
          for (let i = totalPages - 4; i <= totalPages; i++) {
            pages.push(i);
          }
        } else {
          for (let i = currentPage - 2; i <= currentPage + 2; i++) {
            pages.push(i);
          }
        }
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg">
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredTickets.length)} de {filteredTickets.length} bilhetes
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200"
          >
            Anterior
          </button>
          
          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 text-sm rounded-md ${
                page === currentPage
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-500'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200"
          >
            Próxima
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              🎫 Bilhetes de Passagem
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerencie seus bilhetes de passagem emitidos
            </p>
          </div>
          <Link
            to="/tickets/new"
            className="mt-4 sm:mt-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
          >
            ➕ Novo Bilhete
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Pesquisar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
              <input
                id="search"
                type="text"
                placeholder="Pesquisar por passageiro, CPF, rota ou número..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleCanceledTickets}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showCanceledTickets
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {showCanceledTickets ? '❌ Cancelados' : '✅ Ativos'}
            </button>
            
            <button
              onClick={handleTogglePendingPayments}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showPendingPayments
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:hover:bg-yellow-900/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {showPendingPayments ? '⏳ Pendentes' : '💰 Todos'}
            </button>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {tickets.length === 0 ? 'Nenhum bilhete encontrado' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {tickets.length === 0 
                ? 'Comece emitindo seu primeiro bilhete de passagem.' 
                : 'Tente ajustar os termos da pesquisa.'
              }
            </p>
            {tickets.length === 0 && (
              <Link
                to="/tickets/new"
                className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition-colors"
              >
                ➕ Criar Novo Bilhete
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Número
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Passageiro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rota
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Pagamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedTickets.map((ticket) => (
                  <tr key={ticket._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${ticket.status === 'cancelado' ? 'opacity-75' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      #{ticket.ticketNumber || '---'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium">{ticket.passengerName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {ticket.cpf}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      <div>
                        <div className="font-medium">{ticket.route}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {ticket.accommodationType}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ticket.status === 'cancelado'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {ticket.status === 'cancelado' ? '❌ Cancelado' : '✅ Ativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ticket.paymentStatus === 'pago' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {ticket.paymentStatus === 'pago' ? '✅ Pago' : '⏳ Pendente'}
                        </span>
                        {ticket.paymentStatus === 'pago' && ticket.paymentMethod && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {ticket.paymentMethod === 'pix' ? 'PIX' :
                             ticket.paymentMethod === 'dinheiro' ? 'Dinheiro' :
                             ticket.paymentMethod === 'cartao' ? 'Cartão' :
                             ticket.paymentMethod.charAt(0).toUpperCase() + ticket.paymentMethod.slice(1)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(ticket.issueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(ticket.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-1">
                        {ticket.status !== 'cancelado' && (
                          <button
                            onClick={() => handleEditPayment(ticket)}
                            className="inline-flex items-center px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            title="Editar Pagamento"
                          >
                            💳
                          </button>
                        )}
                        <button
                          onClick={() => printReceipt(ticket)}
                          className="inline-flex items-center px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                          title="Imprimir Comprovante"
                        >
                          🖨️
                        </button>
                        {ticket.status !== 'cancelado' && (
                          <button
                            onClick={() => handleCancelTicket(ticket._id)}
                            className="inline-flex items-center px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                            title="Cancelar Bilhete"
                          >
                            ❌
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {paginatedTickets.map((ticket) => (
              <div 
                key={ticket._id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3 ${
                  ticket.status === 'cancelado' ? 'opacity-75' : ''
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {ticket.ticketNumber || '#---'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(ticket.issueDate)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {ticket.status === 'cancelado' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        ❌ Cancelado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        ✅ Ativo
                      </span>
                    )}
                    {ticket.status === 'cancelado' && ticket.canceledAt && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(ticket.canceledAt)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Passenger Info */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Passageiro:</span>
                      <div className="mt-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.passengerName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{ticket.cpf}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Rota:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{ticket.route}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Acomodação:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{ticket.accommodationType}</p>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pagamento:</span>
                      <div className="mt-1 flex items-center space-x-2">
                        {ticket.paymentStatus === 'pago' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✅ Pago
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            ⏳ Pendente
                          </span>
                        )}
                        {ticket.paymentStatus === 'pago' && ticket.paymentMethod && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {ticket.paymentMethod === 'pix' && 'PIX'}
                            {ticket.paymentMethod === 'dinheiro' && 'Dinheiro'}
                            {ticket.paymentMethod === 'cartao' && 'Cartão'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(ticket.total)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {ticket.status !== 'cancelado' && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPayment(ticket)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        title="Editar Pagamento"
                      >
                        💳 Pagamento
                      </button>
                      <button
                        onClick={() => printReceipt(ticket)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                        title="Imprimir Comprovante"
                      >
                        🖨️ Imprimir
                      </button>
                      <button
                        onClick={() => handleCancelTicket(ticket._id)}
                        className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                        title="Cancelar Bilhete"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          </>
        )}
        
        {/* Pagination Controls */}
        <PaginationControls />
      </div>

      {/* Footer info */}
      {filteredTickets.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Exibindo {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTickets.length)} de {filteredTickets.length} bilhete(s) filtrado(s) • Total: {tickets.length} bilhete(s)
        </div>
      )}

      {/* Payment Edit Modal */}
      <PaymentEditModal
        note={selectedTicket}
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedTicket(null);
        }}
        onUpdate={handlePaymentUpdate}
        entityType="tickets"
      />
    </div>
  );
};

export default TicketList;
