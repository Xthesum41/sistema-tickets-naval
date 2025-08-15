// Utilitários de timezone para Manaus (GMT-4)

// Fuso horário de Manaus (GMT-4)
const MANAUS_OFFSET = -4 * 60; // -4 horas em minutos

// Obter data atual no fuso de Manaus
export const getCurrentLocalDate = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const manausTime = new Date(utc + (MANAUS_OFFSET * 60000));
  return manausTime;
};

// Converter data para fuso de Manaus
export const convertToManausTime = (date) => {
  if (!date) return null;
  const dateObj = new Date(date);
  const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  const manausTime = new Date(utc + (MANAUS_OFFSET * 60000));
  return manausTime;
};

// Formatar data no padrão brasileiro (dd/mm/aaaa)
export const formatDateBR = (date) => {
  if (!date) return '---';
  const manausDate = convertToManausTime(date);
  return manausDate.toLocaleDateString('pt-BR');
};

// Formatar data e hora no padrão brasileiro
export const formatDateTimeBR = (date) => {
  if (!date) return '---';
  const manausDate = convertToManausTime(date);
  return manausDate.toLocaleDateString('pt-BR') + ' ' + manausDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

// Obter string de data atual no formato para inputs (YYYY-MM-DD)
export const getCurrentDateString = () => {
  const manausDate = getCurrentLocalDate();
  const year = manausDate.getFullYear();
  const month = String(manausDate.getMonth() + 1).padStart(2, '0');
  const day = String(manausDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Obter string de data atual no formato brasileiro (DD/MM/AAAA)
export const getCurrentDateBR = () => {
  return formatDateBR(getCurrentLocalDate());
};

// Obter string de data e hora atual no formato brasileiro
export const getCurrentDateTimeBR = () => {
  return formatDateTimeBR(getCurrentLocalDate());
};
