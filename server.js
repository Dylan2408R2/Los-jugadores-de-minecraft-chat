const express = require('express');
const http = require('http');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');

// DB setup
const DBSOURCE = path.join(__dirname, 'database.sqlite3');
const db = new sqlite3.Database(DBSOURCE);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    displayName TEXT,
    color TEXT,
    avatar TEXT
  )`);
});

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const sessionMiddleware = session({
  store: new SQLiteStore({ db: 'sessions.sqlite3', dir: './' }),
  secret: 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
});
app.use(sessionMiddleware);

// Passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy((username, password, done) => {
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return done(err);
    if (!user) return done(null, false, { message: 'Usuario no encontrado' });
    bcrypt.compare(password, user.password, (err, res) => {
      if (res) return done(null, user);
      return done(null, false, { message: 'Contraseña incorrecta' });
    });
  });
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  db.get('SELECT id, username, displayName, color, avatar FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

// File upload
const uploadDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Serve static
app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname, 'public')));

// Auth API
app.post('/api/register', async (req, res) => {
  const { username, password, displayName } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan campos' });
  const hash = await bcrypt.hash(password, 10);
  db.run('INSERT INTO users (username, password, displayName, color) VALUES (?,?,?,?)', [username, hash, displayName || username, '#3498db'], function(err) {
    if (err) return res.status(400).json({ error: 'Usuario ya existe' });
    req.login({ id: this.lastID }, err2 => {
      if (err2) return res.status(500).json({ error: 'Error al iniciar sesión' });
      return res.json({ ok: true });
    });
  });
});

app.post('/api/login', passport.authenticate('local'), (req, res) => {
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  req.logout(() => {});
  res.json({ ok: true });
});

app.get('/api/user', (req, res) => {
  if (!req.user) return res.json({ user: null });
  res.json({ user: req.user });
});

app.post('/api/profile', upload.single('avatar'), (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  const userId = req.user.id;
  const color = req.body.color || null;
  const avatar = req.file ? '/uploads/' + req.file.filename : null;
  db.run('UPDATE users SET color = COALESCE(?, color), avatar = COALESCE(?, avatar) WHERE id = ?', [color, avatar, userId], function(err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    db.get('SELECT id, username, displayName, color, avatar FROM users WHERE id = ?', [userId], (err2, user) => {
      res.json({ user });
    });
  });
});

// Share session with socket.io
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

io.on('connection', (socket) => {
  const req = socket.request;
  const user = req.session && req.session.passport && req.session.passport.user ? null : null;
  // try to load user from session id stored in passport
  if (req.session && req.session.passport && req.session.passport.user) {
    const userId = req.session.passport.user;
    db.get('SELECT id, username, displayName, color, avatar FROM users WHERE id = ?', [userId], (err, u) => {
      if (u) {
        socket.data.user = u;
        socket.join('global');
        socket.emit('system', { msg: 'Conectado al chat', time: Date.now() });
        io.to('global').emit('user-joined', { user: u });
      }
    });
  }

  socket.on('message', (msg) => {
    const u = socket.data.user;
    if (!u) return socket.emit('error', 'No autenticado');
    const payload = { from: { id: u.id, username: u.username, displayName: u.displayName, color: u.color, avatar: u.avatar }, text: msg, time: Date.now() };
    io.to('global').emit('message', payload);
  });

  socket.on('disconnect', () => {
    const u = socket.data.user;
    if (u) io.to('global').emit('user-left', { user: u });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server listening on', PORT));
