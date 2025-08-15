const mongoose = require('mongoose');

const FreightNoteSchema = new mongoose.Schema({
  noteNumber: { type: Number, required: true, unique: true },
  issueDate: { type: Date, default: Date.now },
  recipient: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  phone: { type: String, required: true },
  idNumber: { type: String, required: true },
  vesselName: {
    type: String,
    enum: ['B/M Almirante Oliveira V', 'N/M Comandante Oliveira II'],
    required: true,
  },
  goods: [
    {
      quantity: { type: Number, required: true },
      description: { type: String, required: true },
      invoiceNumber: { type: String, required: true },
      value: { type: Number, required: true },
      weight: { type: Number, required: true },
      discount: { type: Number, default: 0 }, // Changed from discountWeight to discount (in R$)
    },
  ],
  paymentStatus: {
    type: String,
    enum: ['pendente', 'pago'],
    default: 'pendente'
  },
  paymentMethod: {
    type: String,
    enum: ['pix', 'dinheiro', 'cartao'],
    required: function() {
      return this.paymentStatus === 'pago';
    }
  },
  paymentDate: {
    type: Date,
    required: function() {
      return this.paymentStatus === 'pago';
    }
  },
  status: {
    type: String,
    enum: ['ativo', 'cancelado'],
    default: 'ativo'
  },
  canceledAt: {
    type: Date
  },
  digitalSignature: { type: String }, // URL or base64 of the image
});

module.exports = mongoose.model('FreightNote', FreightNoteSchema);
