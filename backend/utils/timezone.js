// Utilitário para trabalhar com datas em diferentes timezones
// Configurado para Horário Padrão do Amazonas (GMT-4)

// Configuração do timezone local
const LOCAL_TIMEZONE_OFFSET = -4; // GMT-4 (Horário Padrão do Amazonas)
const LOCAL_TIMEZONE_NAME = 'America/Manaus';

/**
 * Obtém a data atual no timezone local configurado
 * @returns {Date} Data atual ajustada para o timezone local
 */
const getCurrentLocalDate = () => {
  const now = new Date();
  // Timezone local está 4 horas atrás do UTC
  const localTime = new Date(now.getTime() - (Math.abs(LOCAL_TIMEZONE_OFFSET) * 3600000));
  return localTime;
};

/**
 * Converte uma data para o timezone local
 * @param {Date|string} date - Data a ser convertida
 * @returns {Date|null} Data convertida para o timezone local
 */
const toLocalTimezone = (date) => {
  if (!date) return null;
  
  const inputDate = new Date(date);
  
  // Para compatibilidade, retornar a data original
  // A conversão específica será feita nas funções de formatação
  return inputDate;
};

/**
 * Obtém a data atual no formato YYYY-MM-DD no timezone local
 * @returns {string} Data no formato YYYY-MM-DD
 */
const getCurrentDateString = () => {
  const now = new Date();
  // Ajustar para o timezone local (GMT-4)
  const localTime = new Date(now.getTime() - (Math.abs(LOCAL_TIMEZONE_OFFSET) * 3600000));
  
  // Extrair componentes da data em UTC para evitar conversões automáticas
  const year = localTime.getUTCFullYear();
  const month = String(localTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(localTime.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Converte string de data para objeto Date no timezone local
 * @param {string} dateString - String de data no formato YYYY-MM-DD ou ISO
 * @returns {Date|null} Objeto Date ou null se inválido
 */
const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  
  // Se a string já tem informação de timezone, usar como está
  if (dateString.includes('T') || dateString.includes('Z') || dateString.includes('+') || dateString.includes('-')) {
    return new Date(dateString);
  }
  
  // Se é apenas YYYY-MM-DD, interpretar como data local
  const [year, month, day] = dateString.split('-').map(num => parseInt(num));
  const localDate = new Date();
  
  // Definir a data no timezone local
  localDate.setFullYear(year, month - 1, day);
  localDate.setHours(0, 0, 0, 0);
  
  return localDate;
};

/**
 * Formata data no padrão brasileiro (dd/mm/aaaa)
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data formatada em português brasileiro
 */
const formatDateBR = (date) => {
  if (!date) return '';
  
  const inputDate = new Date(date);
  
  // Correção para datas que foram salvas com bug de timezone
  // Se a hora está próxima de meia-noite UTC, provavelmente foi criada com bug
  const hours = inputDate.getUTCHours();
  if (hours < 6) {
    // Subtrair 1 dia para corrigir o bug
    const correctedDate = new Date(inputDate.getTime() - (24 * 60 * 60 * 1000));
    return correctedDate.toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
  
  // Usar timezone UTC para evitar conversões automáticas do JavaScript
  return inputDate.toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Formata data e hora no padrão brasileiro
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data e hora formatadas em português brasileiro
 */
const formatDateTimeBR = (date) => {
  if (!date) return '';
  
  const inputDate = new Date(date);
  return inputDate.toLocaleString('pt-BR', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Função utilitária para debug de datas
 * @param {string} label - Rótulo para identificar o debug
 * @param {Date|string} date - Data a ser analisada
 */
const debugDate = (label, date) => {
  console.log(`\n=== DEBUG DATE: ${label} ===`);
  console.log('Input:', date);
  console.log('Type:', typeof date);
  console.log('Date object:', new Date(date));
  console.log('UTC:', new Date(date).toISOString());
  console.log('Formatted BR:', formatDateTimeBR(date));
  console.log('Current local date:', getCurrentDateString());
  console.log('================================\n');
};

/**
 * Obtém informações do timezone local configurado
 * @returns {Object} Informações do timezone
 */
const getTimezoneInfo = () => {
  return {
    offset: LOCAL_TIMEZONE_OFFSET,
    name: LOCAL_TIMEZONE_NAME,
    description: 'Horário Padrão do Amazonas (GMT-4)'
  };
};

// Exportações do módulo
module.exports = {
  // Funções principais
  getCurrentLocalDate,
  toLocalTimezone,
  getCurrentDateString,
  parseLocalDate,
  formatDateBR,
  formatDateTimeBR,
  
  // Utilitários
  debugDate,
  getTimezoneInfo,
  
  // Aliases para compatibilidade com código existente
  getManausDate: getCurrentLocalDate,
  toManausTimezone: toLocalTimezone,
  getManausDateString: getCurrentDateString,
  parseManausDate: parseLocalDate,
  formatBrazilianDate: formatDateBR,
  formatBrazilianDateTime: formatDateTimeBR,
  
  // Constantes
  LOCAL_TIMEZONE_OFFSET,
  MANAUS_TIMEZONE_OFFSET: LOCAL_TIMEZONE_OFFSET // Para compatibilidade
};
