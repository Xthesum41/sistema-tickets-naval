const express = require('express');
const router = express.Router();
const FreightNote = require('../models/FreightNote');
const { getCurrentLocalDate, debugDate } = require('../utils/timezone');

// Create a new freight note
router.post('/', async (req, res) => {
  try {
    console.log('Received freight note data:', req.body);
    
    const lastNote = await FreightNote.findOne().sort({ noteNumber: -1 });
    const noteNumber = lastNote ? lastNote.noteNumber + 1 : 1;

    // Se não foi fornecida uma issueDate, usar a data atual local
    const freightNoteData = { ...req.body, noteNumber };
    if (!freightNoteData.issueDate) {
      freightNoteData.issueDate = getCurrentLocalDate();
      console.log('Setting issueDate to local timezone:', freightNoteData.issueDate);
    } else {
      console.log('Using provided issueDate:', freightNoteData.issueDate);
      debugDate('Provided issueDate', freightNoteData.issueDate);
    }

    const freightNote = new FreightNote(freightNoteData);

    await freightNote.save();
    console.log('Freight note created successfully:', freightNote);
    res.status(201).json(freightNote);
  } catch (error) {
    console.error('Error creating freight note:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all freight notes
router.get('/', async (req, res) => {
  try {
    const { vesselName } = req.query;
    
    // Filtrar por embarcação se fornecido
    const filter = vesselName ? { vesselName } : {};
    
    // Ordenar por data de emissão (issueDate) em ordem decrescente
    const freightNotes = await FreightNote.find(filter).sort({ 
      issueDate: -1 
    });
    res.status(200).json(freightNotes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment status
router.patch('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod, paymentDate } = req.body;

    // Buscar a nota atual para verificar o status
    const currentNote = await FreightNote.findById(id);
    if (!currentNote) {
      return res.status(404).json({ error: 'Nota de frete não encontrada' });
    }

    // Regra de negócio: não permitir alterar pagamento aprovado para pendente
    if (currentNote.paymentStatus === 'pago' && paymentStatus === 'pendente') {
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

    const freightNote = await FreightNote.findByIdAndUpdate(
      id, 
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json(freightNote);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel freight note
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    const freightNote = await FreightNote.findByIdAndUpdate(
      id,
      { 
        status: 'cancelado',
        canceledAt: new Date()
      },
      { new: true }
    );

    if (!freightNote) {
      return res.status(404).json({ error: 'Nota de frete não encontrada' });
    }

    res.status(200).json(freightNote);
  } catch (error) {
    console.error('Error canceling freight note:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

