# 🚢 Sistema de Gestão Marítima

Sistema completo para gestão de transporte marítimo, incluindo emissão de notas de frete, bilhetes de passagem e relatórios gerenciais.

## 📋 Sumário
- [Características](#-características)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Funcionalidades](#-funcionalidades)
- [API](#-api)


## ✨ Características

- **Gestão Completa**: Notas de frete e bilhetes de passagem
- **Sistema de Autenticação**: Login com roles de Admin e Operador
- **Controle de Acesso**: Hierarquia de permissões por funcionalidade
- **Multi-Embarcação**: Suporte a múltiplas embarcações
- **Relatórios Avançados**: Dashboard com métricas e relatórios em PDF (Admin)
- **Paginação Inteligente**: Interface otimizada para grandes volumes de dados
- **Impressão**: Comprovantes padronizados para impressão
- **Gerenciamento de Usuários**: Criação e controle de usuários (Admin)
- **Dark Mode**: Interface moderna com tema escuro/claro
- **Responsivo**: Funciona em desktop, tablet e mobile

## 🛠 Tecnologias

### Frontend
- **React 18** - Biblioteca JavaScript para interfaces de usuário
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **React Router DOM** - Roteamento para SPAs
- **Axios** - Cliente HTTP para APIs
- **React Hook Form** - Gerenciamento de formulários
- **React Toastify** - Notificações elegantes

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web para Node.js
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação via JSON Web Tokens
- **bcryptjs** - Hash seguro de senhas
- **PDFKit** - Geração de documentos PDF
- **CORS** - Cross-Origin Resource Sharing

## 📋 Pré-requisitos

- **Node.js** (versão 16 ou superior)
- **MongoDB** (versão 4.4 ou superior)
- **npm** ou **yarn**

## 🚀 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/sistema-gestao-maritima.git
cd sistema-gestao-maritima
```

### 2. Instale as dependências
```bash
# Instalar dependências do projeto raiz
npm install

# Instalar dependências do backend
cd backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install
```

### 3. Configure o banco de dados

Certifique-se de que o MongoDB esteja rodando localmente na porta padrão `27017`.

O sistema irá criar automaticamente o banco `fullstack_app` na primeira execução.

### 4. Configure usuário administrador

Execute o script para criar o usuário administrador inicial:

```bash
cd backend
npm run create-admin
```

**Credenciais padrão criadas:**
- **Usuário:** admin
- **Senha:** admin123

⚠️ **IMPORTANTE:** Altere a senha padrão após o primeiro acesso!

### 5. Execute o projeto

#### Opção 1: Executar ambos os serviços simultaneamente (Recomendado)
```bash
# Na raiz do projeto
npm run dev
```

#### Opção 2: Executar separadamente
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 6. Acesse a aplicação

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000

## 💻 Uso

### Primeira Execução

1. **Login**: Use as credenciais padrão (admin/admin123) para primeiro acesso
2. **Seleção de Embarcação**: Escolha a embarcação que será utilizada
3. **Dashboard**: Visualize métricas gerais (apenas Admin)
4. **Gestão**: Acesse as telas de notas de frete e bilhetes
5. **Usuários**: Crie operadores e outros administradores (apenas Admin)

### Hierarquia de Usuários

#### 👑 **Administrador**
- Acesso completo ao sistema
- Dashboard e relatórios
- Gerenciamento de usuários
- Criação de notas de frete e bilhetes
- Visualização de todas as funcionalidades

#### ⚙️ **Operador**
- Criação de notas de frete
- Emissão de bilhetes de passagem
- Impressão de comprovantes
- Gerenciamento de pagamentos
- **Sem acesso** a dashboard, relatórios e gerenciamento de usuários

### Funcionalidades Principais

- **Criar Nota de Frete**: Registre cargas e mercadorias
- **Emitir Bilhete**: Registre passageiros e suas acomodações  
- **Gerenciar Pagamentos**: Controle status e métodos de pagamento
- **Imprimir Comprovantes**: Gere documentos padronizados
- **Visualizar Relatórios**: Análise financeira e operacional

## 📁 Estrutura do Projeto

```
sistema-gestao-maritima/
├── 📁 backend/
│   ├── 📄 index.js                 # Servidor principal
│   ├── � createAdmin.js           # Script para criar admin
│   ├── �📁 models/                  # Modelos do banco de dados
│   │   ├── FreightNote.js          # Modelo de Nota de Frete
│   │   ├── Ticket.js               # Modelo de Bilhete
│   │   └── User.js                 # Modelo de Usuário
│   ├── 📁 routes/                  # Rotas da API
│   │   ├── freightNoteRoutes.js    # Rotas de notas de frete
│   │   ├── ticketRoutes.js         # Rotas de bilhetes
│   │   ├── authRoutes.js           # Autenticação e usuários
│   │   ├── pdfRoutes.js            # Geração de PDFs
│   │   └── reportRoutes.js         # Relatórios e dashboard
│   └── 📁 utils/                   # Utilitários
│       └── pdfGenerator.js         # Gerador de PDFs
├── 📁 frontend/
│   ├── 📄 index.html               # HTML principal
│   ├── 📄 vite.config.js           # Configuração do Vite
│   └── 📁 src/
│       ├── 📄 App.jsx              # Componente principal
│       ├── 📄 main.jsx             # Entry point
│       ├── 📁 api/                 # Configuração de API
│       │   └── axios.js            # Cliente HTTP
│       ├── 📁 components/          # Componentes React
│       │   ├── FreightNoteForm.jsx # Formulário de nota de frete
│       │   ├── FreightNoteList.jsx # Lista de notas de frete
│       │   ├── TicketForm.jsx      # Formulário de bilhete
│       │   ├── TicketList.jsx      # Lista de bilhetes
│       │   ├── Dashboard.jsx       # Dashboard principal (Admin)
│       │   ├── Reports.jsx         # Relatórios avançados (Admin)
│       │   ├── UserManagement.jsx  # Gerenciar usuários (Admin)
│       │   ├── Login.jsx           # Tela de login
│       │   ├── ProtectedRoute.jsx  # Proteção de rotas
│       │   ├── VesselSelection.jsx # Seleção de embarcação
│       │   └── Navbar.jsx          # Navegação principal
│       ├── 📁 contexts/            # Contextos React
│       │   ├── AuthContext.jsx     # Contexto de autenticação
│       │   ├── VesselContext.jsx   # Contexto de embarcação
│       │   └── ThemeContext.jsx    # Contexto de tema
│       └── 📁 utils/               # Utilitários frontend
├── 📄 package.json                 # Dependências do projeto
└── 📄 README.md                    # Este arquivo
```

## 🎯 Funcionalidades

### � Sistema de Autenticação
- Login seguro com JWT
- Controle de sessão
- Hash seguro de senhas (bcrypt)
- Interceptors para tokens expirados

### 👥 Gerenciamento de Usuários (Admin)
- Criação de usuários
- Controle de permissões por role
- Desativação de usuários
- Visualização de último acesso

### �📊 Dashboard (Admin)
- Métricas financeiras em tempo real
- Notas de frete e bilhetes recentes (5 por página)
- Gráficos de desempenho
- Filtros por embarcação e período

### 📋 Notas de Frete
- Cadastro completo de remetente e mercadorias
- Múltiplos itens por nota
- Cálculo automático de peso e valor
- Status de pagamento (Pendente/Pago)
- Desconto por item
- Impressão de comprovantes

### 🎫 Bilhetes de Passagem
- Dados completos do passageiro
- Tipos de acomodação (2ª Classe, 1ª Classe, Suíte)
- Controle de bagagem
- Rotas personalizáveis
- Sistema de numeração automática

### 💰 Controle Financeiro
- Status de pagamento por transação
- Métodos: PIX, Dinheiro, Cartão
- Relatórios financeiros detalhados
- Análise de inadimplência

### 📈 Relatórios (Admin)
- **Dashboard**: Métricas gerais e transações recentes
- **Financeiro**: Análise de receitas e pagamentos (20 itens por página)
- **Operacional**: Performance por embarcação
- **Clientes**: Análise de passageiros e remetentes
- **Exportação em PDF**: Relatórios completos e profissionais

### 🎨 Interface
- Design responsivo e moderno
- Dark mode / Light mode
- Paginação inteligente (5-20 itens por página conforme contexto)
- Busca e filtros avançados
- Notificações em tempo real

## 🔌 API

#### Autenticação
- `POST /auth/login` - Login de usuário
- `GET /auth/verify` - Verificar token
- `GET /auth/users` - Listar usuários (Admin)
- `POST /auth/users` - Criar usuário (Admin)
- `PATCH /auth/users/:id/deactivate` - Desativar usuário (Admin)

#### Notas de Frete (Autenticado)
- `GET /freight-notes` - Listar notas
- `POST /freight-notes` - Criar nota
- `PATCH /freight-notes/:id/payment` - Atualizar pagamento
- `PATCH /freight-notes/:id/cancel` - Cancelar nota

#### Bilhetes (Autenticado)
- `GET /tickets` - Listar bilhetes  
- `POST /tickets` - Criar bilhete
- `PATCH /tickets/:id/payment` - Atualizar pagamento
- `PATCH /tickets/:id/cancel` - Cancelar bilhete

#### Relatórios (Admin)
- `GET /reports/dashboard` - Dados do dashboard
- `GET /reports/financial` - Relatório financeiro
- `GET /reports/operational` - Relatório operacional
- `GET /reports/customers` - Relatório de clientes
- `GET /reports/:type/export` - Exportar em PDF

### Filtros Suportados
- `vesselName` - Filtrar por embarcação
- `startDate` / `endDate` - Período
- `paymentStatus` - Status do pagamento
- `paymentMethod` - Método de pagamento

### Headers de Autenticação
```
Authorization: Bearer <jwt-token>
```


## 🚨 Troubleshooting

### Problemas Comuns

1. **MongoDB não conecta**
   - Verifique se o MongoDB está rodando
   - Confirme a string de conexão no `backend/index.js`

2. **Erro de CORS**
   - Verifique se o backend está rodando na porta 5000
   - Confirme a configuração no `frontend/src/api/axios.js`

3. **Erro de autenticação**
   - Execute `npm run create-admin` no diretório backend
   - Verifique se o token JWT não expirou
   - Confirme as credenciais de login

4. **Build falha**
   - Delete `node_modules` e `package-lock.json`
   - Execute `npm install` novamente

4. **PDFs não geram**
   - Verifique se todas as dependências do PDFKit estão instaladas
   - Confirme permissões de escrita no sistema

### Performance

- O sistema utiliza paginação para otimizar a performance
- Dashboard: 5 itens por seção
- Listas: 10 itens por página  
- Relatórios: 20 itens por página
- Índices automáticos no MongoDB para consultas rápidas

---


