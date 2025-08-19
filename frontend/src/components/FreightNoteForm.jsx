import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useVessel } from '../contexts/VesselContext';
import { generateFreightNotePrintContent } from '../utils/printTemplates';

// Função para obter data no timezone local (GMT-4 - Horário Padrão do Amazonas)
const getCurrentDateString = () => {
  const now = new Date();
  // Ajustar para o timezone local (GMT-4)
  const localTime = new Date(now.getTime() - (4 * 60 * 60 * 1000));
  
  // Extrair componentes da data para evitar conversões automáticas
  const year = localTime.getUTCFullYear();
  const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

function FreightNoteForm() {
  const { selectedVessel } = useVessel();
  
  const [formData, setFormData] = useState({
    recipient: '',
    address: '',
    city: '',
    phone: '',
    idNumber: '',
    issueDate: getCurrentDateString(), // Usar data local
    vesselName: selectedVessel?.name || '',
    goods: [{ quantity: '', description: '', invoiceNumber: '', value: '', weight: '', discount: '' }],
    paymentStatus: 'pendente',
    paymentMethod: '',
    paymentDate: '',
  });
  const [isLoading, setIsLoading] = useState(false);

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
    // Se mudou para pago e não tem data, definir a data atual local
    else if (value === 'pago' && !formData.paymentDate) {
      newFormData.paymentDate = getCurrentDateString();
    }
    
    setFormData(newFormData);
  };

  const handleGoodsChange = (index, e) => {
    const { name, value } = e.target;
    const updatedGoods = [...formData.goods];
    updatedGoods[index] = { ...updatedGoods[index], [name]: value };
    
    setFormData({ ...formData, goods: updatedGoods });
  };

  // Calcular o peso total de todas as mercadorias
  const calculateTotalWeight = () => {
    return formData.goods.reduce((total, good) => {
      const weight = parseFloat(good.weight) || 0;
      return total + weight;
    }, 0).toFixed(2);
  };

  const addGoods = () => {
    setFormData({
      ...formData,
      goods: [...formData.goods, { quantity: '', description: '', invoiceNumber: '', value: '', weight: '', discount: '' }],
    });
    toast.info('Nova mercadoria adicionada');
  };

  const removeGoods = (index) => {
    const updatedGoods = formData.goods.filter((_, i) => i !== index);
    setFormData({ ...formData, goods: updatedGoods });
    toast.info('Mercadoria removida');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await api.post('/freight-notes', formData);
      toast.success('Nota de Frete criada com sucesso!');
      console.log(response.data);
      
      // Reset form
      setFormData({
        recipient: '',
        address: '',
        city: '',
        phone: '',
        idNumber: '',
        issueDate: getCurrentDateString(), // Usar data de Manaus para reset
        vesselName: selectedVessel?.name || '',
        goods: [{ quantity: '', description: '', invoiceNumber: '', value: '', weight: '', discount: '' }],
        paymentStatus: 'pendente',
        paymentMethod: '',
        paymentDate: '',
      });
    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar Nota de Frete. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      setIsLoading(true);
      toast.info('Gerando PDF...');
      // Simulate PDF generation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAndPrint = async () => {
    try {
      setIsLoading(true);
      toast.info('Criando nota de frete...');

      // 1. Criar a nota de frete
      const response = await api.post('/freight-notes', formData);
      const createdNote = response.data;
      
      toast.success('Nota de Frete criada com sucesso!');
      console.log(createdNote);

      // 2. Gerar comprovante para impressão
      toast.info('Gerando comprovante para impressão...');
      generatePrintableReceipt(createdNote);

      // 3. Reset form
      setFormData({
        recipient: '',
        address: '',
        city: '',
        phone: '',
        idNumber: '',
        issueDate: getCurrentDateString(), // Usar data de Manaus para reset
        vesselName: selectedVessel?.name || '',
        goods: [{ quantity: '', description: '', invoiceNumber: '', value: '', weight: '', discount: '' }],
        paymentStatus: 'pendente',
        paymentMethod: '',
        paymentDate: '',
      });

    } catch (error) {
      console.error(error);
      toast.error('Erro ao criar Nota de Frete. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePrintableReceipt = (noteData) => {
    // Usar a função utilitária para gerar o conteúdo
    const printContent = generateFreightNotePrintContent(noteData);

    // Abrir em nova janela para impressão
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    toast.success('Comprovante gerado! A janela de impressão foi aberta.');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              📋 Nova Nota de Frete
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Preencha os dados para emitir uma nova nota de frete
            </p>
          </div>
          <div className="text-right">
            <div className="mb-2">
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Data de Emissão
              </label>
              <input 
                type="date" 
                name="issueDate" 
                value={formData.issueDate} 
                onChange={handleChange}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Destinatário */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            👤 Dados do Destinatário
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destinatário *
              </label>
              <input 
                type="text" 
                name="recipient" 
                value={formData.recipient} 
                onChange={handleChange} 
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Nome do destinatário"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                RG/CPF/CNPJ *
              </label>
              <input 
                type="text" 
                name="idNumber" 
                value={formData.idNumber} 
                onChange={handleChange} 
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="000.000.000-00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Endereço *
              </label>
              <input 
                type="text" 
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Rua, Avenida..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cidade *
              </label>
              <input 
                type="text" 
                name="city" 
                value={formData.city} 
                onChange={handleChange} 
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Nome da cidade"
              />
            </div>
            
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone *
              </label>
              <input 
                type="text" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange} 
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>

        {/* Mercadorias */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              📦 Mercadorias
            </h2>
            <button 
              type="button" 
              onClick={addGoods}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              ➕ Adicionar Mercadoria
            </button>
          </div>
          
          <div className="space-y-6">
            {formData.goods.map((good, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 relative">
                {formData.goods.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGoods(index)}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-700 focus:outline-none"
                    aria-label="Remover mercadoria"
                  >
                    ❌
                  </button>
                )}
                
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                  Mercadoria #{index + 1}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantidade *
                    </label>
                    <input 
                      type="number" 
                      name="quantity" 
                      value={good.quantity || ''} 
                      onChange={(e) => handleGoodsChange(index, e)} 
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Descrição *
                    </label>
                    <input 
                      type="text" 
                      name="description" 
                      value={good.description || ''} 
                      onChange={(e) => handleGoodsChange(index, e)} 
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="Descreva a mercadoria"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nº Nota Fiscal *
                    </label>
                    <input 
                      type="text" 
                      name="invoiceNumber" 
                      value={good.invoiceNumber || ''} 
                      onChange={(e) => handleGoodsChange(index, e)} 
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Valor (R$) *
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="value" 
                      value={good.value || ''} 
                      onChange={(e) => handleGoodsChange(index, e)} 
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Peso (kg) *
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="weight" 
                      value={good.weight || ''} 
                      onChange={(e) => handleGoodsChange(index, e)} 
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Desconto (R$)
                    </label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="discount" 
                      value={good.discount || ''} 
                      onChange={(e) => handleGoodsChange(index, e)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Informações de Pagamento */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            💳 Informações de Pagamento
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status do Pagamento *
              </label>
              <select
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handlePaymentStatusChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="pendente">⏳ Pendente</option>
                <option value="pago">✅ Pago</option>
              </select>
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
          </div>

          {formData.paymentStatus === 'pendente' && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                ⚠️ Esta nota de frete será criada com pagamento pendente. Você pode atualizar o status posteriormente.
              </p>
            </div>
          )}
        </div>

        {/* Resumo dos Totais */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            📊 Resumo dos Totais
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Peso Total (kg) <span className="text-xs text-blue-600 dark:text-blue-400">(calculado)</span>
              </label>
              <input 
                type="number" 
                step="0.01"
                value={calculateTotalWeight()}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed transition-colors font-semibold"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantidade de Mercadorias
              </label>
              <input 
                type="number"
                value={formData.goods.length}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed transition-colors"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor Total (R$) <span className="text-xs text-blue-600 dark:text-blue-400">(calculado)</span>
              </label>
              <input 
                type="number" 
                step="0.01"
                value={formData.goods.reduce((total, good) => {
                  const value = parseFloat(good.value) || 0;
                  const discount = parseFloat(good.discount) || 0;
                  return total + (value - discount);
                }, 0).toFixed(2)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed transition-colors font-semibold"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={generatePDF}
              disabled={isLoading}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                '📄 '
              )}
              Gerar PDF
            </button>
            
            <button 
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                '✅ '
              )}
              Criar Nota de Frete
            </button>

            <button
              type="button"
              onClick={handleCreateAndPrint}
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                '🖨️ '
              )}
              Criar e Imprimir Comprovante
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default FreightNoteForm;
