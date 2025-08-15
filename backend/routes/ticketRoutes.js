const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { getCurrentLocalDate, debugDate } = require('../utils/timezone');

// Create a new ticket
router.post('/', async (req, res) => {
  try {
    console.log('Received ticket data:', req.body);
    
    const lastTicket = await Ticket.findOne().sort({ ticketNumber: -1 });
    const ticketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1;

    // Se não foi fornecida uma issueDate, usar a data atual local
    const ticketData = { ...req.body, ticketNumber };
    if (!ticketData.issueDate) {
      ticketData.issueDate = getCurrentLocalDate();
      console.log('Setting issueDate to local timezone:', ticketData.issueDate);
    } else {
      console.log('Using provided issueDate:', ticketData.issueDate);
      debugDate('Provided issueDate', ticketData.issueDate);
    }

    const ticket = new Ticket(ticketData);

    await ticket.save();
    console.log('Ticket created successfully:', ticket);
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tickets
router.get('/', async (req, res) => {
  try {
    const { vesselName } = req.query;
    
    // Filtrar por embarcação se fornecido
    const filter = vesselName ? { vesselName } : {};
    
    // Ordenar por data de emissão (issueDate) em ordem decrescente
    const tickets = await Ticket.find(filter).sort({ 
      issueDate: -1 
    });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment status
router.patch('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod, paymentDate } = req.body;

    // Buscar o ticket atual para verificar o status
    const currentTicket = await Ticket.findById(id);
    if (!currentTicket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Regra de negócio: não permitir alterar pagamento aprovado para pendente
    if (currentTicket.paymentStatus === 'pago' && paymentStatus === 'pendente') {
      return res.status(400).json({ 
        error: 'Pagamentos já aprovados não podem ser alterados para pendente' 
      });
    }

    const updateData = { paymentStatus };
    
    if (paymentStatus === 'pago') {
      updateData.paymentMethod = paymentMethod;
      updateData.paymentDate = paymentDate || new Date();
    } else {
      updateData.paymentMethod = undefined;
      updateData.paymentDate = undefined;
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id, 
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel ticket
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { 
        status: 'cancelado',
        canceledAt: new Date()
      },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Error canceling ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a ticket (manter por compatibilidade, mas agora temos cancelamento)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTicket = await Ticket.findByIdAndDelete(id);
    
    if (!deletedTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.status(200).json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
