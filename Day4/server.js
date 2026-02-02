require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const svgCaptcha = require('svg-captcha');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// --- MONGODB CONNECTION ---
// Replace the URL with your Atlas connection string from the dashboard
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/user_portal';
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- USER SCHEMA ---
const userSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    resume: String,
    cover_letter: String,
    grades: [{ subject: String, grade: String }] // Embedded grades
});
const User = mongoose.model('User', userSchema);

// --- MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'arch_linux_secret',
    resave: false,
    saveUninitialized: false
}));

// --- MULTER CONFIG ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './public/uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, req.session.user.id + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// --- ROUTES ---

app.get('/', (req, res) => res.redirect('/login'));

app.get('/captcha', (req, res) => {
    const captcha = svgCaptcha.create();
    req.session.captcha = captcha.text;
    res.type('svg').status(200).send(captcha.data);
});

// HTML Page Routes (Serving static HTML files)
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/dashboard', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// --- API ENDPOINTS ---

app.post('/api/register', async (req, res) => {
    try {
        const { first_name, last_name, username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = new User({
            first_name, last_name, username, email, password: hashedPassword,
            grades: [ // Initial dummy data for your student portal
                { subject: 'Operating Systems', grade: 'A' },
                { subject: 'Computer Networks', grade: 'B+' }
            ]
        });
        
        await newUser.save();
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: 'User already exists or data invalid' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password, captcha } = req.body;
    if (req.session.captcha !== captcha) return res.status(400).json({ error: 'Invalid Captcha' });

    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid Credentials' });
    }

    req.session.user = { id: user._id, username: user.username };
    res.json({ success: true });
});

app.get('/api/user-data', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
    const user = await User.findById(req.session.user.id);
    res.json({ user, grades: user.grades });
});

app.post('/api/update-profile', upload.fields([{ name: 'resume' }, { name: 'cover_letter' }]), async (req, res) => {
    if (!req.session.user) return res.status(401).send('Unauthorized');

    let updateData = {
        username: req.body.username,
        email: req.body.email
    };

    if (req.files['resume']) updateData.resume = '/uploads/' + req.files['resume'][0].filename;
    if (req.files['cover_letter']) updateData.cover_letter = '/uploads/' + req.files['cover_letter'][0].filename;

    await User.findByIdAndUpdate(req.session.user.id, updateData);
    res.redirect('/dashboard');
});

app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));