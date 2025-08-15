import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useVessel } from '../contexts/VesselContext';
import { generateTicketPrintContent } from '../utils/printTemplates';

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

// Função para formatar data atual em português brasileiro
const getCurrentDateBR = () => {
  const now = new Date();
  // Ajustar para o timezone local (GMT-4)
  const localTime = new Date(now.getTime() - (4 * 60 * 60 * 1000));
  
  // Extrair componentes da data
  const day = String(localTime.getUTCDate()).padStart(2, '0');
  const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const year = localTime.getUTCFullYear();
  
  return `${day}/${month}/${year}`;
};

const TicketForm = () => {
  const { selectedVessel } = useVessel();
  
  const [formData, setFormData] = useState({
    passengerName: '',
    address: '',
    phone: '',
    cpf: '',
    rg: '',
    origin: '',
    destination: '',
    route: '',
    departureDateTime: '',
    accommodationType: '2ª Classe',
    suiteNumber: '', // Número da suíte/camarote
    luggageQuantity: '',
    discount: '',
    total: '',
    vesselName: selectedVessel?.name || '',
    paymentStatus: 'pendente',
    paymentMethod: '',
    paymentDate: '',
  });

  const [loading, setLoading] = useState(false);

  // Opções de cidades
  const cities = ['Manaus', 'Juruá', 'Carauari'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };

    // Atualizar a rota automaticamente quando origem ou destino mudarem
    if (name === 'origin' || name === 'destination') {
      if (name === 'origin') {
        newFormData.origin = value;
      } else {
        newFormData.destination = value;
      }
      
      // Formar a rota se ambos estiverem preenchidos
      if (newFormData.origin && newFormData.destination) {
        newFormData.route = `${newFormData.origin} - ${newFormData.destination}`;
      } else {
        newFormData.route = '';
      }
    }

    setFormData(newFormData);
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
    // Se mudou para pago e não tem data, definir a data atual de Manaus
    else if (value === 'pago' && !formData.paymentDate) {
      newFormData.paymentDate = getCurrentDateString();
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validação: verificar se há embarcação selecionada
    if (!selectedVessel) {
      toast.error('Selecione uma embarcação no menu principal antes de criar o bilhete.');
      setLoading(false);
      return;
    }

    try {
      // Preparar dados para envio - converter campos numéricos e garantir que route esteja definido
      const ticketData = {
        ...formData,
        vesselName: selectedVessel.name,
        luggageQuantity: parseInt(formData.luggageQuantity) || 0,
        discount: parseFloat(formData.discount) || 0,
        total: parseFloat(formData.total) || 0
      };
      
      // Remover campos origin e destination se existirem (o backend espera apenas route)
      delete ticketData.origin;
      delete ticketData.destination;
      
      // Se pagamento for pendente, remover campos de pagamento vazios
      if (ticketData.paymentStatus === 'pendente') {
        delete ticketData.paymentMethod;
        delete ticketData.paymentDate;
      }
      
      console.log('Sending ticket data:', ticketData);
      await api.post('/tickets', ticketData);
      toast.success('Bilhete criado com sucesso! 🎫');
      
      // Reset form
      setFormData({
        passengerName: '',
        address: '',
        phone: '',
        cpf: '',
        rg: '',
        origin: '',
        destination: '',
        route: '',
        departureDateTime: '',
        accommodationType: '2ª Classe',
        suiteNumber: '',
        luggageQuantity: '',
        discount: '',
        total: '',
        vesselName: selectedVessel?.name || '',
        paymentStatus: 'pendente',
        paymentMethod: '',
        paymentDate: '',
      });
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast.error('Erro ao criar bilhete. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndPrint = async () => {
    // Validação: verificar se há embarcação selecionada
    if (!selectedVessel) {
      toast.error('Selecione uma embarcação no menu principal antes de criar o bilhete.');
      return;
    }

    try {
      setLoading(true);
      toast.info('Criando bilhete...');

      // 1. Criar o bilhete - preparar dados para envio
      const ticketData = {
        ...formData,
        vesselName: selectedVessel.name,
        luggageQuantity: parseInt(formData.luggageQuantity) || 0,
        discount: parseFloat(formData.discount) || 0,
        total: parseFloat(formData.total) || 0
      };
      
      // Remover campos origin e destination se existirem (o backend espera apenas route)
      delete ticketData.origin;
      delete ticketData.destination;
      
      // Se pagamento for pendente, remover campos de pagamento vazios
      if (ticketData.paymentStatus === 'pendente') {
        delete ticketData.paymentMethod;
        delete ticketData.paymentDate;
      }
      
      console.log('Sending ticket data for print:', ticketData);
      const response = await api.post('/tickets', ticketData);
      const createdTicket = response.data;
      
      toast.success('Bilhete criado com sucesso!');
      console.log(createdTicket);

      // 2. Gerar comprovante para impressão
      toast.info('Gerando comprovante para impressão...');
      generatePrintableReceipt(createdTicket);

      // 3. Reset form
      setFormData({
        passengerName: '',
        address: '',
        phone: '',
        cpf: '',
        rg: '',
        origin: '',
        destination: '',
        route: '',
        departureDateTime: '',
        accommodationType: '2ª Classe',
        suiteNumber: '',
        luggageQuantity: '',
        discount: '',
        total: '',
        vesselName: selectedVessel?.name || '',
        paymentStatus: 'pendente',
        paymentMethod: '',
        paymentDate: '',
      });

    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast.error('Erro ao criar bilhete. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const generatePrintableReceipt = (ticketData) => {
    try {
      // Log para debug
      console.log('Generating receipt for ticket:', ticketData);
      console.log('Suite number:', ticketData.suiteNumber);
      console.log('Accommodation type:', ticketData.accommodationType);
      
      toast.info('Gerando comprovante para impressão...');
      
      // Usar a função centralizada
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              🎫 Novo Bilhete de Passagem
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Preencha os dados para emitir um novo bilhete de passagem
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Data: {getCurrentDateBR()}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Passageiro */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            👤 Dados do Passageiro
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="passengerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                id="passengerName"
                name="passengerName"
                value={formData.passengerName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="Nome completo do passageiro"
              />
            </div>
            
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                CPF *
              </label>
              <input
                type="text"
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="rg" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                RG *
              </label>
              <input
                type="text"
                id="rg"
                name="rg"
                value={formData.rg}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="00.000.000-0"
              />
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Endereço *
            </label>
            <textarea
              id="address"
              name="address"
              rows="2"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="Endereço completo do passageiro"
            />
          </div>
        </div>

        {/* Dados da Viagem */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            🚢 Dados da Viagem
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="origin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Origem *
              </label>
              <select
                id="origin"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="">Selecione a origem</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destino *
              </label>
              <select
                id="destination"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="">Selecione o destino</option>
                {cities.filter(city => city !== formData.origin).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="route" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rota (Automática)
              </label>
              <input
                type="text"
                id="route"
                name="route"
                value={formData.route}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                placeholder="Será preenchida automaticamente"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label htmlFor="departureDateTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data e Hora de Partida *
              </label>
              <input
                type="datetime-local"
                id="departureDateTime"
                name="departureDateTime"
                value={formData.departureDateTime}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="accommodationType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Acomodação *
              </label>
              <select
                id="accommodationType"
                name="accommodationType"
                value={formData.accommodationType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
              >
                <option value="1ª Classe">1ª Classe</option>
                <option value="2ª Classe">2ª Classe</option>
                <option value="½ passageiro">½ Passageiro</option>
                <option value="suíte">Suíte</option>
                <option value="camarote">Camarote</option>
              </select>
            </div>
            
            {/* Campo condicional para número da suíte/camarote */}
            {(formData.accommodationType === 'suíte' || formData.accommodationType === 'camarote') && (
              <div>
                <label htmlFor="suiteNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {formData.accommodationType === 'suíte' ? 'Suíte' : 'Camarote'} Nº *
                </label>
                <input
                  type="text"
                  id="suiteNumber"
                  name="suiteNumber"
                  value={formData.suiteNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder={`Ex: ${formData.accommodationType === 'suíte' ? '01, 02, 03...' : 'A1, B2, C3...'}`}
                />
              </div>
            )}

            {/* Se não for suíte/camarote, mostrar o campo de bagagens na mesma linha */}
            {!(formData.accommodationType === 'suíte' || formData.accommodationType === 'camarote') && (
              <div>
                <label htmlFor="luggageQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantidade de Bagagens *
                </label>
                <input
                  type="number"
                  id="luggageQuantity"
                  name="luggageQuantity"
                  value={formData.luggageQuantity}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Linha separada para bagagens quando for suíte/camarote */}
          {(formData.accommodationType === 'suíte' || formData.accommodationType === 'camarote') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="luggageQuantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantidade de Bagagens *
                </label>
                <input
                  type="number"
                  id="luggageQuantity"
                  name="luggageQuantity"
                  value={formData.luggageQuantity}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Desconto (R$)
              </label>
              <input
                type="number"
                step="0.01"
                id="discount"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label htmlFor="total" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                id="total"
                name="total"
                value={formData.total}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="0.00"
              />
            </div>
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
                ⚠️ Este bilhete será criado com pagamento pendente. Você pode atualizar o status posteriormente.
              </p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                '🎫 '
              )}
              Emitir Bilhete
            </button>

            <button
              type="button"
              onClick={handleCreateAndPrint}
              disabled={loading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-md shadow-sm transition-colors focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
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
};

export default TicketForm;
