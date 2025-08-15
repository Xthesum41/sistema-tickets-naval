// Função utilitária para debug de datas
const debugDateFilter = (period, filter) => {
  console.log('\n=== DEBUG DATE FILTER ===');
  console.log(`Period: ${period}`);
  console.log(`Filter:`, filter);
  
  if (filter.issueDate) {
    const { $gte, $lte } = filter.issueDate;
    if ($gte) console.log(`From: ${$gte.toISOString()} (${$gte.toLocaleDateString('pt-BR')} ${$gte.toLocaleTimeString('pt-BR')})`);
    if ($lte) console.log(`To: ${$lte.toISOString()} (${$lte.toLocaleDateString('pt-BR')} ${$lte.toLocaleTimeString('pt-BR')})`);
  }
  
  console.log(`Current date: ${new Date().toISOString()} (${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')})`);
  console.log('=========================\n');
};

// Função para criar filtro de data mais preciso
const createDateFilter = (period) => {
  const now = new Date();
  let dateFilter = {};
  
  switch (period) {
    case 'today':
      // Hoje: de 00:00:00 até 23:59:59 do dia atual
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      
      dateFilter = {
        issueDate: {
          $gte: todayStart,
          $lte: todayEnd
        }
      };
      break;
      
    case 'yesterday':
      // Ontem: de 00:00:00 até 23:59:59 do dia anterior
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      
      dateFilter = {
        issueDate: {
          $gte: yesterdayStart,
          $lte: yesterdayEnd
        }
      };
      break;
      
    case 'thisWeek':
      // Esta semana: do domingo até hoje
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      dateFilter = {
        issueDate: { $gte: startOfWeek }
      };
      break;
      
    case 'thisMonth':
      // Este mês: do dia 1 até o final do mês
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      dateFilter = {
        issueDate: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      };
      break;
      
    case 'last30Days':
      // Últimos 30 dias
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      
      dateFilter = {
        issueDate: {
          $gte: thirtyDaysAgo
        }
      };
      break;
      
    case 'thisYear':
      // Este ano: de 1º de janeiro até 31 de dezembro
      const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      
      dateFilter = {
        issueDate: {
          $gte: startOfYear,
          $lte: endOfYear
        }
      };
      break;
      
    default:
      // 'all' ou indefinido: sem filtro de data
      dateFilter = {};
      break;
  }
  
  // Debug das datas
  debugDateFilter(period, dateFilter);
  
  return dateFilter;
};

module.exports = { createDateFilter, debugDateFilter };
