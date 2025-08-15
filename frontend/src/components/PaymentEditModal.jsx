import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { generateTicketPrintContent, generateFreightNotePrintContent } from '../utils/printTemplates';

const PaymentEditModal = ({ note, isOpen, onClose, onUpdate, entityType = 'freight-notes' }) => {
  const [formData, setFormData] = useState({
    paymentStatus: 'pendente',
    paymentMethod: '',
    paymentDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (note) {
      setFormData({
        paymentStatus: note.paymentStatus || 'pendente',
        paymentMethod: note.paymentMethod || '',
        paymentDate: note.paymentDate ? new Date(note.paymentDate).toISOString().split('T')[0] : '',
      });
    }
  }, [note]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePaymentStatusChange = (e) => {
    const { value } = e.target;
    const newFormData = { 
      ...formData, 
      paymentStatus: value 
    };
    
    // Se mudou para pendente, limpar os campos de pagamento
    if (value === 'pendente') {
      newFormData.paymentMethod = '';
      newFormData.paymentDate = '';
    }
    // Se mudou para pago e não tem data, definir a data atual
    else if (value === 'pago' && !formData.paymentDate) {
      newFormData.paymentDate = new Date().toISOString().split('T')[0];
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.patch(`/${entityType}/${note._id}/payment`, formData);
      toast.success('Pagamento atualizado com sucesso!');
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.error || 'Não é possível alterar este pagamento.');
      } else {
        toast.error('Erro ao atualizar pagamento. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAndPrint = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.patch(`/${entityType}/${note._id}/payment`, formData);
      toast.success('Pagamento atualizado com sucesso!');
      onUpdate(response.data);
      
      // Gerar e imprimir comprovante para freight-notes e tickets
      setTimeout(() => {
        printReceipt(response.data);
      }, 500);
      
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.error || 'Não é possível alterar este pagamento.');
      } else {
        toast.error('Erro ao atualizar pagamento. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const printReceipt = (noteData) => {
    try {
      toast.info('Gerando comprovante para impressão...');
      
      // Gerar conteúdo usando as funções utilitárias
      const printContent = entityType === 'tickets' 
        ? generateTicketPrintContent(noteData)
        : generateFreightNotePrintContent(noteData);

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

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              💳 Editar Pagamento
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            {entityType === 'tickets' ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Bilhete:</strong> #{note.ticketNumber}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Passageiro:</strong> {note.passengerName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Rota:</strong> {note.route}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Valor:</strong> R$ {parseFloat(note.total || 0).toFixed(2)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Nota:</strong> #{note.noteNumber}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Destinatário:</strong> {note.recipient}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Valor:</strong> R$ {note.goods?.reduce((total, good) => {
                    const value = parseFloat(good.value) || 0;
                    const discount = parseFloat(good.discount) || 0;
                    return total + (value - discount);
                  }, 0).toFixed(2) || '0.00'}
                </p>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status do Pagamento *
              </label>
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handlePaymentStatusChange}
                required
                disabled={note.paymentStatus === 'pago'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed dark:disabled:bg-gray-600"
              >
                <option value="pendente">⏳ Pendente</option>
                <option value="pago">✅ Pago</option>
              </select>
              {note.paymentStatus === 'pago' && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  ℹ️ Pagamentos aprovados não podem ser alterados para pendente
                </p>
              )}
            </div>

            {formData.paymentStatus === 'pago' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Forma de Pagamento *
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                  >
                    <option value="">Selecione a forma de pagamento</option>
                    <option value="pix">💳 PIX</option>
                    <option value="dinheiro">💵 Dinheiro</option>
                    <option value="cartao">💳 Cartão</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                  />
                </div>
              </>
            )}

            {formData.paymentStatus === 'pendente' && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  ⚠️ O pagamento será marcado como pendente.
                </p>
              </div>
            )}

            {note.paymentStatus === 'pago' && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                  💳 Pagamento Já Aprovado
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-2">
                  Este pagamento foi aprovado e não pode ser alterado para pendente. Você pode:
                </p>
                <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside space-y-1">
                  <li>Alterar a forma de pagamento</li>
                  <li>Corrigir a data do pagamento</li>
                  <li>Cancelar toda a nota de frete (se necessário)</li>
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-md transition-colors disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : null}
                  💾 Salvar
                </button>
              </div>
              <button
                type="button"
                onClick={handleSubmitAndPrint}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-md transition-colors disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : null}
                🖨️ Salvar e Imprimir Comprovante
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentEditModal;
