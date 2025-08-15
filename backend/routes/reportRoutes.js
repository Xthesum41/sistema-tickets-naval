const express = require('express');
const FreightNote = require('../models/FreightNote');
const Ticket = require('../models/Ticket');
const { createDateFilter, formatBrazilianDateTime } = require('../utils/dateFilters');
const { getCurrentLocalDate, toLocalTimezone, formatDateBR } = require('../utils/timezone');
const router = express.Router();

// Debug route to check database contents
router.get('/debug', async (req, res) => {
  try {
    const totalNotes = await FreightNote.countDocuments();
    const sampleNotes = await FreightNote.find().limit(3);
    
    res.json({
      totalNotesInDB: totalNotes,
      sampleNotes: sampleNotes,
      dbStatus: 'Connected'
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    res.status(500).json({ 
      error: error.message,
      dbStatus: 'Error'
    });
  }
});

// Dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const { period, vessel } = req.query;
    let vesselFilter = {};
    
    // Filtro de embarcação
    if (vessel) {
      vesselFilter = { vesselName: new RegExp(vessel, 'i') };
      console.log('Dashboard vessel filter:', vesselFilter); // Debug log
    }
    
    // Criar filtro de data usando função utilitária
    const dateFilter = createDateFilter(period);

    // Combinar filtros de data e embarcação
    const combinedFilter = { ...dateFilter, ...vesselFilter };
    console.log('Dashboard combined filter:', combinedFilter); // Debug log

    // Buscar todas as notas do período
    const notes = await FreightNote.find(combinedFilter).sort({ issueDate: -1 });
    console.log('Found notes:', notes.length); // Debug log
    
    // Buscar todos os tickets do período
    const tickets = await Ticket.find(combinedFilter).sort({ issueDate: -1 });
    console.log('Found tickets:', tickets.length); // Debug log

    // Calcular estatísticas
    const stats = {
      totalNotes: notes.length,
      totalTickets: tickets.length,
      totalRevenue: 0,
      ticketRevenue: 0,
      pendingPayments: 0,
      paidPayments: 0,
      pendingTickets: 0,
      paidTickets: 0,
      canceledNotes: 0,
      canceledTickets: 0,
      paymentMethods: {},
      recentNotes: [],
      recentTickets: []
    };

    // Processar notas
    notes.forEach(note => {
      // Calcular valor total da nota
      const totalValue = note.goods?.reduce((sum, good) => {
        const value = parseFloat(good.value) || 0;
        const discount = parseFloat(good.discount) || 0;
        return sum + (value - discount);
      }, 0) || 0;

      // Adicionar ao total de receita se pago
      if (note.paymentStatus === 'pago') {
        stats.totalRevenue += totalValue;
        stats.paidPayments++;

        // Contar formas de pagamento
        if (note.paymentMethod) {
          if (!stats.paymentMethods[note.paymentMethod]) {
            stats.paymentMethods[note.paymentMethod] = { count: 0, total: 0 };
          }
          stats.paymentMethods[note.paymentMethod].count++;
          stats.paymentMethods[note.paymentMethod].total += totalValue;
        }
      } else {
        stats.pendingPayments++;
      }

      // Contar canceladas
      if (note.status === 'cancelado') {
        stats.canceledNotes++;
      }
    });

    // Pegar notas recentes (últimas 10)
    stats.recentNotes = notes
      .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
      .slice(0, 10)
      .map(note => {
        const totalValue = note.goods?.reduce((sum, good) => {
          const value = parseFloat(good.value) || 0;
          const discount = parseFloat(good.discount) || 0;
          return sum + (value - discount);
        }, 0) || 0;
        
        console.log('Note issueDate raw:', note.issueDate, typeof note.issueDate);
        console.log('Formatted date:', formatDateBR(note.issueDate));
        
        // Criar uma data corrigida para o frontend
        const originalDate = new Date(note.issueDate);
        const hours = originalDate.getUTCHours();
        let correctedDate = originalDate;
        
        // Se foi criada com bug de timezone (próximo da meia-noite UTC), corrigir
        if (hours < 6) {
          correctedDate = new Date(originalDate.getTime() - (24 * 60 * 60 * 1000));
        }
        
        return {
          _id: note._id,
          noteNumber: note.noteNumber,
          recipient: note.recipient,
          paymentStatus: note.paymentStatus,
          createdAt: correctedDate, // Usar data corrigida
          totalValue: totalValue
        };
      });

    // Processar tickets
    tickets.forEach(ticket => {
      const totalValue = parseFloat(ticket.total) || 0;

      // Adicionar ao total de receita de tickets se pago
      if (ticket.paymentStatus === 'pago') {
        stats.ticketRevenue += totalValue;
        stats.paidTickets++;

        // Contar formas de pagamento - mesma estrutura das notas
        if (ticket.paymentMethod) {
          if (!stats.paymentMethods[ticket.paymentMethod]) {
            stats.paymentMethods[ticket.paymentMethod] = { count: 0, total: 0 };
          }
          stats.paymentMethods[ticket.paymentMethod].count++;
          stats.paymentMethods[ticket.paymentMethod].total += totalValue;
        }
      } else {
        stats.pendingTickets++;
      }

      // Contar cancelados
      if (ticket.status === 'cancelado') {
        stats.canceledTickets++;
      }
    });

    // Pegar tickets recentes (últimas 5)
    stats.recentTickets = tickets
      .sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate))
      .slice(0, 5)
      .map(ticket => {
        console.log('Ticket issueDate raw:', ticket.issueDate, typeof ticket.issueDate);
        console.log('Formatted date:', formatDateBR(ticket.issueDate));
        
        // Criar uma data corrigida para o frontend
        const originalDate = new Date(ticket.issueDate);
        const hours = originalDate.getUTCHours();
        let correctedDate = originalDate;
        
        // Se foi criada com bug de timezone (próximo da meia-noite UTC), corrigir
        if (hours < 6) {
          correctedDate = new Date(originalDate.getTime() - (24 * 60 * 60 * 1000));
        }
        
        return {
          _id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          passengerName: ticket.passengerName,
          paymentStatus: ticket.paymentStatus,
          createdAt: correctedDate, // Usar data corrigida
          totalValue: parseFloat(ticket.total) || 0
        };
      });

    // Combinar receitas
    stats.totalRevenue += stats.ticketRevenue;

    console.log('Dashboard stats:', stats); // Debug log
    res.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Financial report - Combining freight notes and tickets
router.get('/financial', async (req, res) => {
  try {
    const { startDate, endDate, paymentStatus, paymentMethod, vessel } = req.query;
    
    let filter = {};
    
    // Filtro de data (só aplicar se fornecido)
    if (startDate && endDate) {
      filter.issueDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    } else if (startDate) {
      filter.issueDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.issueDate = { $lte: new Date(endDate + 'T23:59:59.999Z') };
    }
    
    // Filtros adicionais
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (vessel) filter.vesselName = new RegExp(vessel, 'i');

    console.log('Financial report filter:', filter); // Debug log

    // Buscar notas de frete
    const notes = await FreightNote.find(filter).sort({ issueDate: -1 });
    console.log('Found notes for financial report:', notes.length); // Debug log
    
    // Buscar tickets com mesmo filtro (ajustando campo de embarcação)
    const ticketFilter = { ...filter };
    if (vessel) {
      delete ticketFilter.vesselName;
      ticketFilter.vesselName = new RegExp(vessel, 'i');
    }
    const tickets = await Ticket.find(ticketFilter).sort({ issueDate: -1 });
    console.log('Found tickets for financial report:', tickets.length); // Debug log
    
    // Calcular resumo
    const summary = {
      totalNotes: notes.length,
      totalTickets: tickets.length,
      totalItems: notes.length + tickets.length,
      totalRevenue: 0,
      pendingPayments: 0,
      averageTicket: 0
    };

    // Processar notas de frete
    const processedNotes = notes.map(note => {
      const totalValue = note.goods?.reduce((sum, good) => {
        const value = parseFloat(good.value) || 0;
        const discount = parseFloat(good.discount) || 0;
        return sum + (value - discount);
      }, 0) || 0;

      if (note.paymentStatus === 'pago') {
        summary.totalRevenue += totalValue;
      } else {
        summary.pendingPayments++;
      }

      return {
        id: note._id,
        type: 'nota',
        noteNumber: note.noteNumber,
        ticketNumber: null,
        recipient: note.recipient,
        passengerName: null,
        totalValue,
        paymentStatus: note.paymentStatus,
        paymentMethod: note.paymentMethod,
        paymentDate: note.paymentDate,
        createdAt: note.issueDate,
        vessel: note.vesselName
      };
    });

    // Processar tickets
    const processedTickets = tickets.map(ticket => {
      const totalValue = parseFloat(ticket.total) || 0;

      if (ticket.paymentStatus === 'pago') {
        summary.totalRevenue += totalValue;
      } else {
        summary.pendingPayments++;
      }

      return {
        id: ticket._id,
        type: 'bilhete',
        noteNumber: null,
        ticketNumber: ticket.ticketNumber,
        recipient: ticket.passengerName,
        passengerName: ticket.passengerName,
        totalValue,
        paymentStatus: ticket.paymentStatus,
        paymentMethod: ticket.paymentMethod,
        paymentDate: ticket.paymentDate,
        createdAt: ticket.issueDate,
        vessel: ticket.vesselName
      };
    });

    // Combinar e ordenar dados
    const combinedData = [...processedNotes, ...processedTickets]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    summary.averageTicket = summary.totalRevenue / (combinedData.filter(item => item.paymentStatus === 'pago').length || 1);

    console.log('Financial report summary:', summary); // Debug log
    
    res.json({
      summary,
      data: combinedData
    });
  } catch (error) {
    console.error('Error generating financial report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Operational report - Combining freight notes and tickets
router.get('/operational', async (req, res) => {
  try {
    const { startDate, endDate, vessel } = req.query;
    
    let filter = {};
    
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    if (vessel) filter.vesselName = new RegExp(vessel, 'i');

    const notes = await FreightNote.find(filter).sort({ issueDate: -1 });
    const tickets = await Ticket.find(filter).sort({ issueDate: -1 });
    
    const summary = {
      totalNotes: notes.length,
      totalTickets: tickets.length,
      totalItems: notes.length + tickets.length,
      totalWeight: 0,
      totalGoods: 0,
      totalPassengers: tickets.length,
      activeNotes: 0,
      canceledNotes: 0,
      activeTickets: 0,
      canceledTickets: 0
    };

    // Processar notas de frete
    const processedNotes = notes.map(note => {
      const totalWeight = note.goods?.reduce((sum, good) => sum + (parseFloat(good.weight) || 0), 0) || 0;
      const totalGoods = note.goods?.reduce((sum, good) => sum + (parseInt(good.quantity) || 0), 0) || 0;
      const totalValue = note.goods?.reduce((sum, good) => {
        const value = parseFloat(good.value) || 0;
        const discount = parseFloat(good.discount) || 0;
        return sum + (value - discount);
      }, 0) || 0;

      summary.totalWeight += totalWeight;
      summary.totalGoods += totalGoods;
      
      if (note.status === 'cancelado') {
        summary.canceledNotes++;
      } else {
        summary.activeNotes++;
      }

      return {
        id: note._id,
        type: 'nota',
        noteNumber: note.noteNumber,
        ticketNumber: null,
        recipient: note.recipient,
        passengerName: null,
        city: note.city,
        route: note.route,
        totalValue,
        totalWeight,
        totalItems: totalGoods,
        passengers: 0,
        status: note.status,
        createdAt: note.issueDate,
        vessel: note.vesselName
      };
    });

    // Processar tickets
    const processedTickets = tickets.map(ticket => {
      const totalValue = parseFloat(ticket.total) || 0;

      if (ticket.status === 'cancelado') {
        summary.canceledTickets++;
      } else {
        summary.activeTickets++;
      }

      return {
        id: ticket._id,
        type: 'bilhete',
        noteNumber: null,
        ticketNumber: ticket.ticketNumber,
        recipient: ticket.passengerName,
        passengerName: ticket.passengerName,
        city: ticket.destination,
        route: ticket.route,
        totalValue,
        totalWeight: 0,
        totalItems: 0,
        passengers: 1,
        status: ticket.status || 'ativo',
        createdAt: ticket.issueDate,
        vessel: ticket.vesselName
      };
    });

    // Combinar e ordenar dados
    const combinedData = [...processedNotes, ...processedTickets]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      summary,
      data: combinedData
    });
  } catch (error) {
    console.error('Error generating operational report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Payments report - Combining freight notes and tickets
router.get('/payments', async (req, res) => {
  try {
    const { startDate, endDate, paymentStatus, paymentMethod } = req.query;
    
    let filter = {};
    
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const notes = await FreightNote.find(filter).sort({ issueDate: -1 });
    const tickets = await Ticket.find(filter).sort({ issueDate: -1 });
    
    const summary = {
      totalNotes: notes.length,
      totalTickets: tickets.length,
      totalItems: notes.length + tickets.length,
      totalRevenue: 0,
      pendingPayments: 0,
      totalPaid: 0,
      pendingValue: 0,
      paymentMethods: {},
      paymentMethodBreakdown: {}
    };

    // Processar notas de frete
    const processedNotes = notes.map(note => {
      const totalValue = note.goods?.reduce((sum, good) => {
        const value = parseFloat(good.value) || 0;
        const discount = parseFloat(good.discount) || 0;
        return sum + (value - discount);
      }, 0) || 0;

      if (note.paymentStatus === 'pago') {
        summary.totalRevenue += totalValue;
        summary.totalPaid++;
        
        if (note.paymentMethod) {
          // Estrutura antiga para compatibilidade
          if (!summary.paymentMethods[note.paymentMethod]) {
            summary.paymentMethods[note.paymentMethod] = { count: 0, total: 0 };
          }
          summary.paymentMethods[note.paymentMethod].count++;
          summary.paymentMethods[note.paymentMethod].total += totalValue;

          // Nova estrutura para breakdown detalhado
          if (!summary.paymentMethodBreakdown[note.paymentMethod]) {
            summary.paymentMethodBreakdown[note.paymentMethod] = { 
              count: 0, 
              revenue: 0,
              percentage: 0
            };
          }
          summary.paymentMethodBreakdown[note.paymentMethod].count++;
          summary.paymentMethodBreakdown[note.paymentMethod].revenue += totalValue;
        }
      } else {
        summary.pendingPayments++;
        summary.pendingValue += totalValue;
      }

      return {
        id: note._id,
        type: 'nota',
        noteNumber: note.noteNumber,
        ticketNumber: null,
        recipient: note.recipient,
        passengerName: null,
        totalValue,
        paymentStatus: note.paymentStatus,
        paymentMethod: note.paymentMethod,
        paymentDate: note.paymentDate,
        createdAt: note.issueDate
      };
    });

    // Processar tickets
    const processedTickets = tickets.map(ticket => {
      const totalValue = parseFloat(ticket.total) || 0;

      if (ticket.paymentStatus === 'pago') {
        summary.totalRevenue += totalValue;
        summary.totalPaid++;
        
        if (ticket.paymentMethod) {
          // Estrutura antiga para compatibilidade
          if (!summary.paymentMethods[ticket.paymentMethod]) {
            summary.paymentMethods[ticket.paymentMethod] = { count: 0, total: 0 };
          }
          summary.paymentMethods[ticket.paymentMethod].count++;
          summary.paymentMethods[ticket.paymentMethod].total += totalValue;

          // Nova estrutura para breakdown detalhado
          if (!summary.paymentMethodBreakdown[ticket.paymentMethod]) {
            summary.paymentMethodBreakdown[ticket.paymentMethod] = { 
              count: 0, 
              revenue: 0,
              percentage: 0
            };
          }
          summary.paymentMethodBreakdown[ticket.paymentMethod].count++;
          summary.paymentMethodBreakdown[ticket.paymentMethod].revenue += totalValue;
        }
      } else {
        summary.pendingPayments++;
        summary.pendingValue += totalValue;
      }

      return {
        id: ticket._id,
        type: 'bilhete',
        noteNumber: null,
        ticketNumber: ticket.ticketNumber,
        recipient: ticket.passengerName,
        passengerName: ticket.passengerName,
        totalValue,
        paymentStatus: ticket.paymentStatus,
        paymentMethod: ticket.paymentMethod,
        paymentDate: ticket.paymentDate,
        createdAt: ticket.issueDate
      };
    });

    // Calcular percentuais para o breakdown
    if (summary.totalRevenue > 0) {
      Object.keys(summary.paymentMethodBreakdown).forEach(method => {
        summary.paymentMethodBreakdown[method].percentage = 
          (summary.paymentMethodBreakdown[method].revenue / summary.totalRevenue) * 100;
      });
    }

    // Combinar e ordenar dados
    const combinedData = [...processedNotes, ...processedTickets]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      summary,
      data: combinedData
    });
  } catch (error) {
    console.error('Error generating payments report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Customers report - Combining freight notes and tickets
router.get('/customers', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let filter = {};
    
    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const notes = await FreightNote.find(filter).sort({ issueDate: -1 });
    const tickets = await Ticket.find(filter).sort({ issueDate: -1 });
    
    // Agrupar por cliente/passageiro
    const customerMap = {};
    
    // Processar notas de frete
    notes.forEach(note => {
      const customer = note.recipient;
      const totalValue = note.goods?.reduce((sum, good) => {
        const value = parseFloat(good.value) || 0;
        const discount = parseFloat(good.discount) || 0;
        return sum + (value - discount);
      }, 0) || 0;

      if (!customerMap[customer]) {
        customerMap[customer] = {
          name: customer,
          type: 'cliente_frete',
          city: note.city,
          phone: note.phone,
          idNumber: note.idNumber,
          totalNotes: 0,
          totalTickets: 0,
          totalTransactions: 0,
          totalValue: 0,
          paidValue: 0,
          pendingValue: 0,
          lastTransaction: note.issueDate
        };
      }

      customerMap[customer].totalNotes++;
      customerMap[customer].totalTransactions++;
      customerMap[customer].totalValue += totalValue;
      
      if (note.paymentStatus === 'pago') {
        customerMap[customer].paidValue += totalValue;
      } else {
        customerMap[customer].pendingValue += totalValue;
      }

      if (new Date(note.issueDate) > new Date(customerMap[customer].lastTransaction)) {
        customerMap[customer].lastTransaction = note.issueDate;
      }
    });

    // Processar tickets de passagem
    tickets.forEach(ticket => {
      const passenger = ticket.passengerName;
      const totalValue = parseFloat(ticket.total) || 0;

      if (!customerMap[passenger]) {
        customerMap[passenger] = {
          name: passenger,
          type: 'passageiro',
          city: ticket.destination,
          phone: ticket.phone || '',
          idNumber: ticket.idNumber || '',
          totalNotes: 0,
          totalTickets: 0,
          totalTransactions: 0,
          totalValue: 0,
          paidValue: 0,
          pendingValue: 0,
          lastTransaction: ticket.issueDate
        };
      } else {
        // Se já existe como cliente de frete, atualizar tipo
        customerMap[passenger].type = 'cliente_misto';
      }

      customerMap[passenger].totalTickets++;
      customerMap[passenger].totalTransactions++;
      customerMap[passenger].totalValue += totalValue;
      
      if (ticket.paymentStatus === 'pago') {
        customerMap[passenger].paidValue += totalValue;
      } else {
        customerMap[passenger].pendingValue += totalValue;
      }

      if (new Date(ticket.issueDate) > new Date(customerMap[passenger].lastTransaction)) {
        customerMap[passenger].lastTransaction = ticket.issueDate;
      }
    });

    // Converter para array e ordenar
    const customers = Object.values(customerMap)
      .sort((a, b) => b.totalValue - a.totalValue);

    const summary = {
      totalCustomers: customers.length,
      freightCustomers: customers.filter(c => c.totalNotes > 0).length,
      passengers: customers.filter(c => c.totalTickets > 0).length,
      mixedCustomers: customers.filter(c => c.type === 'cliente_misto').length,
      totalRevenue: customers.reduce((sum, customer) => sum + customer.totalValue, 0),
      averageCustomerValue: customers.length > 0 ? customers.reduce((sum, customer) => sum + customer.totalValue, 0) / customers.length : 0
    };

    res.json({
      summary,
      data: customers
    });
  } catch (error) {
    console.error('Error generating customers report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export functionality (basic implementation)
router.get('/:reportType/export', async (req, res) => {
  try {
    const { reportType } = req.params;
    const { format, startDate, endDate, paymentStatus, paymentMethod, vessel } = req.query;
    
    console.log('Export request:', { reportType, format, filters: req.query });
    
    if (format === 'pdf') {
      const PDFDocument = require('pdfkit');
      
      // Construir filtros para busca no banco
      let noteFilters = {};
      let ticketFilters = {};
      
      // Aplicar filtros de data usando issueDate que é o campo correto nos modelos
      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) {
          dateFilter.$gte = new Date(startDate);
        }
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setHours(23, 59, 59, 999); // Incluir todo o dia final
          dateFilter.$lte = endDateObj;
        }
        noteFilters.issueDate = dateFilter;
        ticketFilters.issueDate = dateFilter;
      }
      
      // Aplicar outros filtros
      if (paymentStatus) {
        noteFilters.paymentStatus = paymentStatus;
        ticketFilters.paymentStatus = paymentStatus;
      }
      
      if (paymentMethod) {
        noteFilters.paymentMethod = paymentMethod;
        ticketFilters.paymentMethod = paymentMethod;
      }
      
      if (vessel) {
        noteFilters.vesselName = new RegExp(vessel, 'i');
        ticketFilters.vesselName = new RegExp(vessel, 'i');
      }
      
      console.log('Applied filters:', { noteFilters, ticketFilters });
      
      // Buscar dados do relatório com filtros aplicados
      let reportData;
      try {
        const notes = await FreightNote.find(noteFilters).sort({ issueDate: -1 });
        const tickets = await Ticket.find(ticketFilters).sort({ issueDate: -1 });
        reportData = { notes, tickets };
        console.log(`Found ${notes.length} notes and ${tickets.length} tickets`);
      } catch (error) {
        console.error('Error fetching report data:', error);
        reportData = { notes: [], tickets: [] };
      }

      // Criar documento PDF
      const doc = new PDFDocument({ margin: 50 });
      
      // Função auxiliar para verificar se há espaço suficiente na página
      function checkPageSpace(requiredHeight, currentY = null) {
        const y = currentY || doc.y;
        const pageHeight = 792; // Altura padrão de página A4
        const margin = 50;
        const availableSpace = pageHeight - margin - y;
        
        if (availableSpace < requiredHeight) {
          doc.addPage();
          return 50; // Retorna nova posição Y após criar nova página
        }
        return y; // Retorna posição Y atual se há espaço suficiente
      }
      
      // Headers para download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      // Pipe o PDF para a resposta com error handling
      doc.pipe(res);
      
      // Handle stream errors
      doc.on('error', (err) => {
        console.error('PDF generation error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erro na geração do PDF' });
        }
      });
      
      res.on('error', (err) => {
        console.error('Response stream error:', err);
      });
      
      // Generate consolidated PDF with all report types
      try {
      
      // === CABEÇALHO PRINCIPAL ===
      doc.rect(0, 0, 595, 90)
         .fill('#1e40af');
      
      doc.fontSize(28)
         .fillColor('#ffffff')
         .font('Helvetica-Bold')
         .text('RELATÓRIO EXECUTIVO COMPLETO', 50, 20, { align: 'center' });
      
      doc.fontSize(14)
         .fillColor('#bfdbfe')
         .font('Helvetica')
         .text('Análise Financeira • Pagamentos • Clientes', 50, 50, { align: 'center' });
      
      doc.fontSize(10)
         .fillColor('#e0f2fe')
         .text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 50, 70, { align: 'center' });
      
      doc.fillColor('#000000');
      doc.y = 110;
      
      // === FILTROS APLICADOS ===
      const filtersY = doc.y;
      doc.rect(50, filtersY, 495, 40)
         .fillAndStroke('#f8fafc', '#e2e8f0');
      
      doc.fontSize(12)
         .fillColor('#1e293b')
         .font('Helvetica-Bold')
         .text('Escopo do Relatório', 60, filtersY + 10);
      
      let filterText = '';
      if (startDate && endDate) {
        filterText = `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`;
      } else {
        filterText = 'Período: Todos os registros';
      }
      
      if (vessel) filterText += ` • Embarcação: ${vessel}`;
      
      doc.fontSize(10)
         .fillColor('#64748b')
         .font('Helvetica')
         .text(filterText, 60, filtersY + 25);
      
      doc.y = filtersY + 60;
      
      // ========================================
      // SEÇÃO 1: RESUMO FINANCEIRO
      // ========================================
      
      doc.fontSize(18)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('1. RESUMO FINANCEIRO', 50, doc.y);
      
      doc.moveDown(1);
      
      // Calcular dados financeiros
      const totalNotes = reportData.notes ? reportData.notes.length : 0;
      const totalTickets = reportData.tickets ? reportData.tickets.length : 0;
      
      const totalRevenueNotes = (reportData.notes || []).reduce((sum, note) => {
        return sum + (note.goods || []).reduce((noteSum, good) => noteSum + (good.value || 0), 0);
      }, 0);
      
      const totalRevenueTickets = (reportData.tickets || []).reduce((sum, ticket) => sum + (ticket.total || 0), 0);
      const totalRevenue = totalRevenueNotes + totalRevenueTickets;
      
      const paidRevenueNotes = (reportData.notes || []).filter(note => note.paymentStatus === 'pago').reduce((sum, note) => {
        return sum + (note.goods || []).reduce((noteSum, good) => noteSum + (good.value || 0), 0);
      }, 0);
      
      const paidRevenueTickets = (reportData.tickets || []).filter(ticket => ticket.paymentStatus === 'pago').reduce((sum, ticket) => sum + (ticket.total || 0), 0);
      const paidRevenue = paidRevenueNotes + paidRevenueTickets;
      const pendingRevenue = totalRevenue - paidRevenue;
      
      // Cards financeiros
      const financeY = doc.y;
      
      // Receita Total
      doc.rect(50, financeY, 160, 60)
         .fillAndStroke('#dbeafe', '#3b82f6');
      doc.fontSize(10)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('RECEITA TOTAL', 60, financeY + 10);
      doc.fontSize(16)
         .text(`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 60, financeY + 25);
      doc.fontSize(8)
         .fillColor('#64748b')
         .font('Helvetica')
         .text(`${totalNotes + totalTickets} transações`, 60, financeY + 45);
      
      // Receita Paga
      doc.rect(220, financeY, 160, 60)
         .fillAndStroke('#d1fae5', '#10b981');
      doc.fontSize(10)
         .fillColor('#059669')
         .font('Helvetica-Bold')
         .text('RECEITA PAGA', 230, financeY + 10);
      doc.fontSize(16)
         .text(`R$ ${paidRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 230, financeY + 25);
      doc.fontSize(8)
         .fillColor('#64748b')
         .font('Helvetica')
         .text(`${totalRevenue > 0 ? ((paidRevenue / totalRevenue) * 100).toFixed(1) : 0}% do total`, 230, financeY + 45);
      
      // Receita Pendente
      doc.rect(390, financeY, 155, 60)
         .fillAndStroke('#fef3c7', '#f59e0b');
      doc.fontSize(10)
         .fillColor('#d97706')
         .font('Helvetica-Bold')
         .text('PENDENTE', 400, financeY + 10);
      doc.fontSize(16)
         .text(`R$ ${pendingRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 400, financeY + 25);
      doc.fontSize(8)
         .fillColor('#64748b')
         .font('Helvetica')
         .text(`${totalRevenue > 0 ? ((pendingRevenue / totalRevenue) * 100).toFixed(1) : 0}% do total`, 400, financeY + 45);
      
      doc.y = financeY + 80;
      
      // Breakdown por tipo
      doc.fontSize(14)
         .fillColor('#374151')
         .font('Helvetica-Bold')
         .text('Composição da Receita:', 50, doc.y);
      
      doc.moveDown(0.5);
      const breakdownY = doc.y;
      
      doc.fontSize(11)
         .fillColor('#1f2937')
         .font('Helvetica')
         .text(`• Fretes: R$ ${totalRevenueNotes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${totalNotes} notas)`, 60, breakdownY)
         .text(`• Passageiros: R$ ${totalRevenueTickets.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${totalTickets} bilhetes)`, 60, breakdownY + 15)
         .text(`• Ticket médio passageiro: R$ ${totalTickets > 0 ? (totalRevenueTickets / totalTickets).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}`, 60, breakdownY + 30);
      
      doc.y = breakdownY + 60;
      
      // ========================================
      // SEÇÃO 2: ANÁLISE DE PAGAMENTOS
      // ========================================
      
      doc.fontSize(18)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('2. ANÁLISE DE PAGAMENTOS', 50, doc.y);
      
      doc.moveDown(1);
      
      // Calcular breakdown por método de pagamento
      const paymentBreakdown = {};
      
      (reportData.notes || []).forEach(note => {
        if (note.paymentStatus === 'pago' && note.paymentMethod) {
          const method = note.paymentMethod;
          const value = (note.goods || []).reduce((sum, good) => sum + (good.value || 0), 0);
          if (!paymentBreakdown[method]) {
            paymentBreakdown[method] = { revenue: 0, count: 0 };
          }
          paymentBreakdown[method].revenue += value;
          paymentBreakdown[method].count += 1;
        }
      });
      
      (reportData.tickets || []).forEach(ticket => {
        if (ticket.paymentStatus === 'pago' && ticket.paymentMethod) {
          const method = ticket.paymentMethod;
          const value = ticket.total || 0;
          if (!paymentBreakdown[method]) {
            paymentBreakdown[method] = { revenue: 0, count: 0 };
          }
          paymentBreakdown[method].revenue += value;
          paymentBreakdown[method].count += 1;
        }
      });
      
      const paymentsY = doc.y;
      
      if (Object.keys(paymentBreakdown).length > 0) {
        Object.entries(paymentBreakdown).forEach(([method, data], index) => {
          const percentage = paidRevenue > 0 ? (data.revenue / paidRevenue * 100) : 0;
          const yPos = paymentsY + (index * 25);
          
          // Nome do método
          const methodNames = {
            'pix': 'PIX',
            'dinheiro': 'Dinheiro', 
            'cartao': 'Cartão',
            'debito': 'Débito'
          };
          
          doc.fontSize(12)
             .fillColor('#1f2937')
             .font('Helvetica-Bold')
             .text(methodNames[method] || method, 60, yPos);
          
          // Barra visual
          const barWidth = Math.max(10, (percentage / 100) * 200);
          doc.rect(150, yPos + 2, barWidth, 12)
             .fill(method === 'pix' ? '#3b82f6' : method === 'dinheiro' ? '#10b981' : '#8b5cf6');
          
          // Valores
          doc.fontSize(10)
             .fillColor('#6b7280')
             .font('Helvetica')
             .text(`R$ ${data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentage.toFixed(1)}%) - ${data.count} transações`, 360, yPos + 3);
        });
        
        doc.y = paymentsY + (Object.keys(paymentBreakdown).length * 25) + 20;
      } else {
        doc.fontSize(10)
           .fillColor('#6b7280')
           .text('Nenhum pagamento processado no período', 60, paymentsY);
        doc.y = paymentsY + 30;
      }
      
      // ========================================
      // SEÇÃO 3: ANÁLISE DE CLIENTES
      // ========================================
      
      doc.fontSize(18)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('3. ANÁLISE DE CLIENTES', 50, doc.y);
      
      doc.moveDown(1);
      
      // Agrupar clientes/passageiros
      const customerMap = {};
      
      // Processar notas de frete
      (reportData.notes || []).forEach(note => {
        const customer = note.recipient;
        const totalValue = (note.goods || []).reduce((sum, good) => sum + (good.value || 0), 0);
        
        if (!customerMap[customer]) {
          customerMap[customer] = {
            name: customer,
            totalNotes: 0,
            totalTickets: 0,
            totalValue: 0,
            paidValue: 0,
            pendingValue: 0
          };
        }
        
        customerMap[customer].totalNotes++;
        customerMap[customer].totalValue += totalValue;
        
        if (note.paymentStatus === 'pago') {
          customerMap[customer].paidValue += totalValue;
        } else {
          customerMap[customer].pendingValue += totalValue;
        }
      });
      
      // Processar tickets
      (reportData.tickets || []).forEach(ticket => {
        const passenger = ticket.passengerName;
        const totalValue = ticket.total || 0;
        
        if (!customerMap[passenger]) {
          customerMap[passenger] = {
            name: passenger,
            totalNotes: 0,
            totalTickets: 0,
            totalValue: 0,
            paidValue: 0,
            pendingValue: 0
          };
        }
        
        customerMap[passenger].totalTickets++;
        customerMap[passenger].totalValue += totalValue;
        
        if (ticket.paymentStatus === 'pago') {
          customerMap[passenger].paidValue += totalValue;
        } else {
          customerMap[passenger].pendingValue += totalValue;
        }
      });
      
      const customers = Object.values(customerMap).sort((a, b) => b.totalValue - a.totalValue);
      
      const customersY = doc.y;
      
      // Estatísticas de clientes
      doc.fontSize(12)
         .fillColor('#374151')
         .font('Helvetica-Bold')
         .text('Estatísticas de Clientes:', 50, customersY);
      
      doc.fontSize(11)
         .fillColor('#1f2937')
         .font('Helvetica')
         .text(`• Total de clientes: ${customers.length}`, 60, customersY + 20)
         .text(`• Clientes com fretes: ${customers.filter(c => c.totalNotes > 0).length}`, 60, customersY + 35)
         .text(`• Passageiros únicos: ${customers.filter(c => c.totalTickets > 0).length}`, 60, customersY + 50)
         .text(`• Receita média por cliente: R$ ${customers.length > 0 ? (totalRevenue / customers.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}`, 60, customersY + 65);
      
      doc.y = customersY + 90;
      
      // Top 10 clientes
      if (customers.length > 0) {
        const topCustomers = customers.slice(0, 10);
        const tableHeight = 20 + (topCustomers.length * 18) + 40; // Header + rows + margins
        const sectionHeight = 30 + tableHeight; // Title + table
        
        doc.y = checkPageSpace(sectionHeight);
        
        doc.fontSize(14)
           .fillColor('#374151')
           .font('Helvetica-Bold')
           .text('Top 10 Clientes:', 50, doc.y);
        
        doc.moveDown(0.5);
        
        const tableY = doc.y;
        
        // Cabeçalho da tabela
        doc.rect(50, tableY, 495, 20)
           .fill('#f3f4f6');
        
        doc.fontSize(9)
           .fillColor('#1f2937')
           .font('Helvetica-Bold')
           .text('Cliente', 60, tableY + 6)
           .text('Fretes', 230, tableY + 6)
           .text('Bilhetes', 270, tableY + 6)
           .text('Total Gasto', 320, tableY + 6)
           .text('Pago', 420, tableY + 6)
           .text('Pendente', 480, tableY + 6);
        
        let rowY = tableY + 20;
        
        topCustomers.forEach((customer, index) => {
          if (index % 2 === 0) {
            doc.rect(50, rowY, 495, 18)
               .fill('#f9fafb');
          }
          
          // Truncar nome para caber na coluna sem quebrar
          let displayName = customer.name;
          if (displayName.length > 28) {
            displayName = displayName.substring(0, 25) + '...';
          }
          
          doc.fontSize(8)
             .fillColor('#374151')
             .font('Helvetica')
             .text(displayName, 60, rowY + 5)
             .text(customer.totalNotes.toString(), 230, rowY + 5)
             .text(customer.totalTickets.toString(), 270, rowY + 5)
             .text(`R$ ${customer.totalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 320, rowY + 5)
             .text(`R$ ${customer.paidValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 420, rowY + 5)
             .text(`R$ ${customer.pendingValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 480, rowY + 5);
          
          rowY += 18;
        });
        
        doc.y = rowY + 20;
      }
      
      // ========================================
      // SEÇÃO 4: PERFORMANCE POR EMBARCAÇÃO
      // ========================================
      
      const vesselAnalysis = {};
      
      // Processar dados por embarcação
      (reportData.notes || []).forEach(note => {
        const vessel = note.vesselName || 'Não Informado';
        const value = (note.goods || []).reduce((sum, good) => sum + (good.value || 0), 0);
        if (!vesselAnalysis[vessel]) {
          vesselAnalysis[vessel] = { 
            freightRevenue: 0, 
            passengerRevenue: 0, 
            freightCount: 0, 
            passengerCount: 0 
          };
        }
        vesselAnalysis[vessel].freightRevenue += value;
        vesselAnalysis[vessel].freightCount += 1;
      });
      
      (reportData.tickets || []).forEach(ticket => {
        const vessel = ticket.vesselName || 'Não Informado';
        const value = ticket.total || 0;
        if (!vesselAnalysis[vessel]) {
          vesselAnalysis[vessel] = { 
            freightRevenue: 0, 
            passengerRevenue: 0, 
            freightCount: 0, 
            passengerCount: 0 
          };
        }
        vesselAnalysis[vessel].passengerRevenue += value;
        vesselAnalysis[vessel].passengerCount += 1;
      });
      
      if (Object.keys(vesselAnalysis).length > 0) {
        // Verificar se há espaço suficiente para a seção completa (título + tabela)
        const sortedVessels = Object.entries(vesselAnalysis)
          .sort(([,a], [,b]) => (b.freightRevenue + b.passengerRevenue) - (a.freightRevenue + a.passengerRevenue))
          .slice(0, 10);
        
        const tableHeight = 20 + (sortedVessels.length * 18) + 40; // Header + rows + margins
        const sectionHeight = 50 + tableHeight; // Title + table
        
        doc.y = checkPageSpace(sectionHeight);
        
        doc.fontSize(18)
           .fillColor('#1e40af')
           .font('Helvetica-Bold')
           .text('4. PERFORMANCE POR EMBARCAÇÃO', 50, doc.y);
        
        doc.moveDown(1);
        
        const vesselTableY = doc.y;
        
        // Cabeçalho
        doc.rect(50, vesselTableY, 495, 20)
           .fill('#f3f4f6');
           
        doc.fontSize(9)
           .fillColor('#1f2937')
           .font('Helvetica-Bold')
           .text('Embarcação', 60, vesselTableY + 6)
           .text('Fretes', 180, vesselTableY + 6)
           .text('Passageiros', 240, vesselTableY + 6)
           .text('Receita Total', 320, vesselTableY + 6)
           .text('% do Total', 420, vesselTableY + 6);
        
        let tableY = vesselTableY + 20;
        
        sortedVessels.forEach(([vessel, data], index) => {
          const totalVesselRevenue = data.freightRevenue + data.passengerRevenue;
          const participation = totalRevenue > 0 ? ((totalVesselRevenue / totalRevenue) * 100) : 0;
          
          if (index % 2 === 0) {
            doc.rect(50, tableY, 495, 18)
               .fill('#f9fafb');
          }
          
          doc.fontSize(8)
             .fillColor('#374151')
             .font('Helvetica')
             .text(vessel.substring(0, 18), 60, tableY + 5)
             .text(data.freightCount.toString(), 180, tableY + 5)
             .text(data.passengerCount.toString(), 240, tableY + 5)
             .text(`R$ ${totalVesselRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, 320, tableY + 5)
             .text(`${participation.toFixed(1)}%`, 420, tableY + 5);
          
          tableY += 18;
        });
        
        doc.y = tableY + 20;
      }
      
      // ========================================
      // SEÇÃO 5: RESUMO EXECUTIVO
      // ========================================
      
      doc.fontSize(18)
         .fillColor('#1e40af')
         .font('Helvetica-Bold')
         .text('5. RESUMO EXECUTIVO', 50, doc.y);
      
      doc.moveDown(1);
      
      const execSummaryY = doc.y;
      doc.rect(50, execSummaryY, 495, 100)
         .fillAndStroke('#f0f9ff', '#0284c7');
      
      doc.fontSize(12)
         .fillColor('#0c4a6e')
         .font('Helvetica-Bold')
         .text('INDICADORES PRINCIPAIS', 60, execSummaryY + 10);
      
      const collectionRate = totalRevenue > 0 ? (paidRevenue / totalRevenue * 100) : 0;
      const occupationRate = totalTickets > 0 ? (totalTickets / (Math.ceil(totalTickets / 300) * 300) * 100) : 0;
      
      doc.fontSize(10)
         .fillColor('#1e293b')
         .font('Helvetica')
         .text(`• Total de transações processadas: ${totalNotes + totalTickets} (${totalNotes} fretes + ${totalTickets} passageiros)`, 60, execSummaryY + 30)
         .text(`• Receita total gerada: R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 60, execSummaryY + 45)
         .text(`• Taxa de cobrança: ${collectionRate.toFixed(1)}% (R$ ${paidRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} recebido)`, 60, execSummaryY + 60)
         .text(`• Taxa de ocupação: ${occupationRate.toFixed(1)}% (${Math.ceil(totalTickets / 300)} viagens estimadas)`, 60, execSummaryY + 75);
      
      doc.y = execSummaryY + 110;
      
      // Mensagem para casos sem dados
      if (totalNotes === 0 && totalTickets === 0) {
        doc.addPage();
        doc.fontSize(16)
           .fillColor('#dc2626')
           .text('NENHUM DADO ENCONTRADO', { align: 'center' });
        
        doc.moveDown();
        doc.fontSize(12)
           .fillColor('#6b7280')
           .text('Nenhuma transação foi encontrada com os filtros aplicados.', { align: 'center' });
        
        if (startDate || endDate) {
          const periodText = startDate && endDate 
            ? `${new Date(startDate).toLocaleDateString('pt-BR')} até ${new Date(endDate).toLocaleDateString('pt-BR')}`
            : startDate 
            ? `A partir de ${new Date(startDate).toLocaleDateString('pt-BR')}`
            : `Até ${new Date(endDate).toLocaleDateString('pt-BR')}`;
          doc.text(`Período: ${periodText}`, { align: 'center' });
        }
      }
      
      // Rodapé simples
      try {
        const pages = doc.bufferedPageRange();
        if (pages && pages.count > 0) {
          for (let i = 0; i < pages.count; i++) {
            const pageNum = i + pages.start;
            
            if (pageNum >= pages.start && pageNum < pages.start + pages.count) {
              doc.switchToPage(pageNum);
              
              doc.fontSize(8)
                 .fillColor('#9ca3af')
                 .text(`Relatório Consolidado - Página ${i + 1} de ${pages.count} - ${new Date().toLocaleDateString('pt-BR')}`, 50, 780, { width: 495, align: 'center' });
            }
          }
        }
      } catch (footerError) {
        console.error('Error adding footer:', footerError);
      }
      
      doc.end();
      
      } catch (pdfGenerationError) {
        console.error('Error during PDF content generation:', pdfGenerationError);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erro na geração do conteúdo do PDF: ' + pdfGenerationError.message });
        }
      }
      
    } else if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_${reportType}.xlsx`);
      
      // Implementação Excel ainda não disponível
      res.status(501).json({ error: 'Exportação para Excel ainda não implementada' });
    } else {
      res.status(400).json({ error: 'Formato não suportado' });
    }
    
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: 'Erro interno do servidor: ' + error.message });
  }
});

module.exports = router;
