import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useVessel } from '../contexts/VesselContext';
import PaymentEditModal from './PaymentEditModal';
import { generateFreightNotePrintContent } from '../utils/printTemplates';

// Função para formatar data no padrão brasileiro (sem correção de timezone pois o backend já corrige)
const formatDateBR = (date) => {
  if (!date) return '---';
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('pt-BR', { 
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

function FreightNoteList() {
  const { selectedVessel } = useVessel();
  const [freightNotes, setFreightNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCanceledNotes, setShowCanceledNotes] = useState(false);
  const [showPendingPayments, setShowPendingPayments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 10 items per page for better management

  useEffect(() => {
    const fetchFreightNotes = async () => {
      try {
        setLoading(true);
        // Filtrar por embarcação selecionada
        const params = selectedVessel?.name ? { vesselName: selectedVessel.name } : {};
        const response = await api.get('/freight-notes', { params });
        setFreightNotes(response.data);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar Notas de Frete.');
      } finally {
        setLoading(false);
      }
    };

    fetchFreightNotes();
  }, [selectedVessel?.name]); // Recarregar quando a embarcação mudar

  const filteredNotes = freightNotes.filter(note => {
    try {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = (
        note.recipient?.toLowerCase().includes(searchTermLower) ||
        note.city?.toLowerCase().includes(searchTermLower) ||
        note.noteNumber?.toString().toLowerCase().includes(searchTermLower)
      );
      
      // Filtrar por status se necessário
      const matchesStatus = showCanceledNotes ? 
        note.status === 'cancelado' : 
        (note.status !== 'cancelado' || !note.status);

      // Filtrar por pagamentos pendentes se necessário
      const matchesPayment = showPendingPayments ?
        note.paymentStatus === 'pendente' :
        true;
        
      return matchesSearch && matchesStatus && matchesPayment;
    } catch (error) {
      console.error('Erro no filtro de busca:', error);
      return false;
    }
  });

  // Pagination functions
  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotes = filteredNotes.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Reset pagination when search changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Reset pagination when filter changes
  const handleToggleCanceledNotes = () => {
    setShowCanceledNotes(!showCanceledNotes);
    setShowPendingPayments(false); // Desabilitar filtro de pagamentos pendentes
    setCurrentPage(1);
  };

  // Reset pagination when pending filter changes  
  const handleTogglePendingPayments = () => {
    setShowPendingPayments(!showPendingPayments);
    setShowCanceledNotes(false); // Desabilitar filtro de cancelados
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
            Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredNotes.length)} de {filteredNotes.length} notas
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

  const handleEditPayment = (note) => {
    setSelectedNote(note);
    setShowPaymentModal(true);
  };

  const handlePaymentUpdate = (updatedNote) => {
    setFreightNotes(freightNotes.map(note => 
      note._id === updatedNote._id ? updatedNote : note
    ));
  };

  const handleCancelNote = async (noteId) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta nota de frete?')) {
      return;
    }

    try {
      const response = await api.patch(`/freight-notes/${noteId}/cancel`);
      setFreightNotes(freightNotes.map(note => 
        note._id === noteId ? response.data : note
      ));
      toast.success('Nota de frete cancelada com sucesso!');
    } catch (error) {
      console.error('Erro ao cancelar nota:', error);
      toast.error('Erro ao cancelar nota de frete.');
    }
  };

  const printReceipt = (noteData) => {
    try {
      toast.info('Gerando comprovante para impressão...');
      
      // Usar a função utilitária para gerar o conteúdo
      const printContent = generateFreightNotePrintContent(noteData);

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
              📋 Notas de Frete
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerencie suas notas de frete emitidas
            </p>
          </div>
          <Link
            to="/freight-notes/new"
            className="mt-4 sm:mt-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
          >
            ➕ Nova Nota de Frete
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
                placeholder="Pesquisar por destinatário, cidade ou número..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleCanceledNotes}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                showCanceledNotes
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {showCanceledNotes ? '❌ Canceladas' : '✅ Ativas'}
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

      {/* Notes List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {freightNotes.length === 0 ? 'Nenhuma nota de frete encontrada' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {freightNotes.length === 0 
                ? 'Comece criando sua primeira nota de frete.' 
                : 'Tente ajustar os termos da pesquisa.'
              }
            </p>
            {freightNotes.length === 0 && (
              <Link
                to="/freight-notes/new"
                className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md shadow-sm transition-colors"
              >
                ➕ Criar Nova Nota
              </Link>
            )}
          </div>
        ) : (
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
                    Cidade
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedNotes.map((note) => (
                  <tr key={note._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${note.status === 'cancelado' ? 'opacity-75' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {note.noteNumber || '#---'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium">{note.recipient}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {note.idNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {note.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col">
                        {note.status === 'cancelado' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            ❌ Cancelada
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ✅ Ativa
                          </span>
                        )}
                        {note.status === 'cancelado' && note.canceledAt && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {formatDateBR(note.canceledAt)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          {note.paymentStatus === 'pago' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✅ Pago
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              ⏳ Pendente
                            </span>
                          )}
                        </div>
                        {note.paymentStatus === 'pago' && note.paymentMethod && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {note.paymentMethod === 'pix' && 'PIX'}
                            {note.paymentMethod === 'dinheiro' && 'Dinheiro'}
                            {note.paymentMethod === 'cartao' && 'Cartão'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {formatDateBR(note.issueDate || note.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {note.status !== 'cancelado' && (
                          <>
                            <button
                              onClick={() => handleEditPayment(note)}
                              className="inline-flex items-center px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                              title="Editar Pagamento"
                            >
                              💳
                            </button>
                            <button
                              onClick={() => printReceipt(note)}
                              className="inline-flex items-center px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                              title="Imprimir Comprovante"
                            >
                              🖨️
                            </button>
                            <button
                              onClick={() => handleCancelNote(note._id)}
                              className="inline-flex items-center px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                              title="Cancelar Nota"
                            >
                              ❌
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {paginatedNotes.map((note) => (
                <div 
                  key={note._id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 space-y-3 ${
                    note.status === 'cancelado' ? 'opacity-75' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {note.noteNumber || '#---'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDateBR(note.issueDate || note.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {note.status === 'cancelado' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          ❌ Cancelada
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ✅ Ativa
                        </span>
                      )}
                      {note.status === 'cancelado' && note.canceledAt && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateBR(note.canceledAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recipient Info */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Destinatário:</span>
                        <div className="mt-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{note.recipient}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{note.idNumber}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Cidade:</span>
                        <p className="text-sm text-gray-900 dark:text-white mt-1">{note.city}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pagamento:</span>
                    <div className="mt-1 flex items-center space-x-2">
                      {note.paymentStatus === 'pago' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          ✅ Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          ⏳ Pendente
                        </span>
                      )}
                      {note.paymentStatus === 'pago' && note.paymentMethod && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {note.paymentMethod === 'pix' && 'PIX'}
                          {note.paymentMethod === 'dinheiro' && 'Dinheiro'}
                          {note.paymentMethod === 'cartao' && 'Cartão'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {note.status !== 'cancelado' && (
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditPayment(note)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                          title="Editar Pagamento"
                        >
                          💳 Pagamento
                        </button>
                        <button
                          onClick={() => printReceipt(note)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                          title="Imprimir Comprovante"
                        >
                          🖨️ Imprimir
                        </button>
                        <button
                          onClick={() => handleCancelNote(note._id)}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                          title="Cancelar Nota"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Pagination Controls */}
        <PaginationControls />
      </div>

      {/* Footer info */}
      {filteredNotes.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Exibindo {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredNotes.length)} de {filteredNotes.length} nota(s) filtrada(s) • Total: {freightNotes.length} nota(s)
        </div>
      )}

      {/* Payment Edit Modal */}
      <PaymentEditModal
        note={selectedNote}
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedNote(null);
        }}
        onUpdate={handlePaymentUpdate}
      />
    </div>
  );
}

export default FreightNoteList;
