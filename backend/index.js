const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.15.14:5173'],
  credentials: true
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/fullstack_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

// Routes
app.get('/', (req, res) => {
  res.send('Backend is running');
});

const freightNoteRoutes = require('./routes/freightNoteRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const reportRoutes = require('./routes/reportRoutes');
const { authRoutes, authenticateToken, requireAdmin } = require('./routes/authRoutes');

// Routes
app.use('/auth', authRoutes);
app.use('/freight-notes', authenticateToken, freightNoteRoutes);
app.use('/tickets', authenticateToken, ticketRoutes);
app.use('/pdf', authenticateToken, pdfRoutes);
app.use('/reports', authenticateToken, requireAdmin, reportRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Network access: http://192.168.15.14:${PORT}`);
});
