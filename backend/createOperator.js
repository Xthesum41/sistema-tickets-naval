const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/fullstack_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function createOperatorUser() {
  try {
    // Dados do operador padrão
    const operatorData = {
      username: 'operador',
      name: 'Operador Padrão',
      password: 'operador123',
      role: 'operador'
    };

    // Verificar se já existe este operador
    const existingOperator = await User.findOne({ username: operatorData.username });
    if (existingOperator) {
      console.log('❌ Já existe um usuário operador com este username');
      console.log(`👤 Operador existente: ${existingOperator.username} - ${existingOperator.name}`);
      process.exit(0);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(operatorData.password, 10);
    
    const operatorUser = new User({
      username: operatorData.username,
      password: hashedPassword,
      name: operatorData.name,
      role: operatorData.role
    });

    await operatorUser.save();
    
    console.log('✅ Usuário operador criado com sucesso!');
    console.log('📋 Credenciais de acesso:');
    console.log(`   👤 Username: ${operatorData.username}`);
    console.log(`   🔑 Senha: ${operatorData.password}`);
    console.log(`   ⚙️ Tipo: ${operatorData.role}`);
    console.log('');
    console.log('🎯 Permissões do Operador:');
    console.log('   ✅ Criar e gerenciar bilhetes de passagem');
    console.log('   ✅ Criar e gerenciar notas de frete');
    console.log('   ✅ Atualizar status de pagamentos');
    console.log('   ✅ Imprimir comprovantes');
    console.log('   ❌ Acessar dashboard e relatórios (apenas admin)');
    console.log('   ❌ Gerenciar usuários (apenas admin)');
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere a senha padrão após o primeiro acesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário operador:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Função para criar operador personalizado
async function createCustomOperator() {
  try {
    // Você pode alterar estes dados conforme necessário
    const customOperator = {
      username: 'joao.operador',
      name: 'João Silva',
      password: 'joao123',
      role: 'operador'
    };

    // Verificar se já existe este operador
    const existingOperator = await User.findOne({ username: customOperator.username });
    if (existingOperator) {
      console.log('❌ Já existe um usuário com este username');
      console.log(`👤 Usuário existente: ${existingOperator.username} - ${existingOperator.name}`);
      process.exit(0);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(customOperator.password, 10);
    
    const operatorUser = new User({
      username: customOperator.username,
      password: hashedPassword,
      name: customOperator.name,
      role: customOperator.role
    });

    await operatorUser.save();
    
    console.log('✅ Usuário operador personalizado criado com sucesso!');
    console.log('📋 Credenciais de acesso:');
    console.log(`   👤 Username: ${customOperator.username}`);
    console.log(`   🔑 Senha: ${customOperator.password}`);
    console.log(`   📝 Nome: ${customOperator.name}`);
    console.log(`   ⚙️ Tipo: ${customOperator.role}`);
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário operador:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Verificar qual função executar com base no argumento
const args = process.argv.slice(2);
if (args.includes('--custom')) {
  createCustomOperator();
} else {
  createOperatorUser();
}
