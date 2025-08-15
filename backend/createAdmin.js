const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/fullstack_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createAdminUser() {
  try {
    // Verificar se já existe um admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('❌ Já existe um usuário administrador no sistema');
      console.log(`👤 Admin existente: ${existingAdmin.username} - ${existingAdmin.name}`);
      process.exit(0);
    }

    // Criar usuário admin padrão
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      name: 'Administrador',
      role: 'admin'
    });

    await adminUser.save();
    
    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('📋 Credenciais de acesso:');
    console.log('   👤 Username: admin');
    console.log('   🔑 Senha: admin123');
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere a senha padrão após o primeiro acesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdminUser();
