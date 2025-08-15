const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  ticketNumber: { type: Number, required: true, unique: true },
  issueDate: { type: Date, default: Date.now },
  passengerName: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  cpf: { type: String, required: true },
  rg: { type: String, required: true },
  route: { type: String, required: true },
  departureDateTime: { type: Date, required: true },
  accommodationType: {
    type: String,
    enum: ['1ª Classe', '2ª Classe', '½ passageiro', 'suíte', 'camarote'],
    required: true,
  },
  suiteNumber: { type: String, required: false }, // Número da suíte/camarote
  luggageQuantity: { type: Number, required: true },
  discount: { type: Number, required: true },
  total: { type: Number, required: true },
  digitalSignature: { type: String }, // URL or base64 of the image
  vesselName: {
    type: String,
    enum: ['B/M Almirante Oliveira V', 'N/M Comandante Oliveira II'],
    required: true,
  },
  // Campos de pagamento (similares às notas de frete)
  paymentStatus: {
    type: String,
    enum: ['pendente', 'pago'],
    default: 'pendente'
  },
  paymentMethod: {
    type: String,
    enum: ['pix', 'dinheiro', 'cartao'],
    required: false
  },
  paymentDate: {
    type: Date,
    required: false
  },
  // Status do ticket (similar às notas de frete)
  status: {
    type: String,
    enum: ['ativo', 'cancelado'],
    default: 'ativo'
  },
  canceledAt: {
    type: Date,
    required: false
  }
});

module.exports = mongoose.model('Ticket', TicketSchema);
