require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || 'chiave_segreta_di_default';
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database di esempio
const users = [
  { id: 1, username: 'user1', password: 'pass1', role: 'user' },
  { id: 2, username: 'admin', password: 'admin123', role: 'admin' }
];

// Endpoint per il login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Credenziali non valide' });
  }
  
  // Creiamo il token JWT
  const token = jwt.sign(
    { 
      id: user.id,
      username: user.username,
      role: user.role 
    },
    SECRET_KEY,
    { expiresIn: '1h' }
  );
  
  res.json({ 
    message: 'Login effettuato con successo',
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

// Middleware di autenticazione
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token mancante' });
  }
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token non valido' });
    }
    
    req.user = user;
    next();
  });
};

// Endpoint protetto
app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({
    message: 'Dati del profilo',
    user: req.user
  });
});

// Endpoint solo per admin
app.get('/api/admin', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Accesso negato' });
  }
  
  res.json({
    message: 'Pannello di amministrazione',
    data: {
      stats: {
        users: 42,
        activeUsers: 28
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
});