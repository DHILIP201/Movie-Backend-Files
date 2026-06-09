const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const https = require('https');
require('dotenv').config();

// Import Models & Middleware
const User = require('./models/Temp');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'movie_secret_key';

app.use(cors());
app.use(express.json());

// MongoDB Connection Block
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🍃 Connected to MongoDB Atlas successfully!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- EMAIL TRANSPORTER SETUP ---
// Requires EMAIL_USER and EMAIL_PASS environment variables in Render
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // False for Port 587
    requireTLS: true, // Forces secure TLS connection
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Test the connection the second the server starts
transporter.verify((error, success) => {
    if (error) {
        console.error("⚠️ Nodemailer Verification Error:", error);
    } else {
        console.log("📧 ✅ Email Server is connected and ready to send!");
    }
});
// Temporary memory store for OTPs
const otpStore = {};

// Bulletproof Fetch Helper Function
const fetchTMDB = async (endpoint) => {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `https://api.themoviedb.org/3${endpoint}${separator}api_key=${TMDB_API_KEY}`;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`TMDB Error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        throw error;
    }
};

app.get('/', (req, res) => {
    res.send('🎬 Movie Central Backend is ONLINE and SECURE!');
});

// ==========================================
// AUTHENTICATION & USER PROFILE ROUTES
// ==========================================

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ success: false, message: 'User already exists' });
        user = new User({ username, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        const payload = { user: { id: user.id } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }, (err, token) => {
            if (err) throw err;
            res.json({ success: true, token, username: user.username });
        });
    } catch (err) {
        res.status(500).send('Server error during registration');
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid Credentials' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid Credentials' });
        const payload = { user: { id: user.id } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' }, (err, token) => {
            if (err) throw err;
            res.json({ success: true, token, username: user.username });
        });
    } catch (err) {
        res.status(500).send('Server error during login');
    }
});

// --- FORGOT PASSWORD: SEND OTP ROUTE ---
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "No account found with this email." });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = { otp, expires: Date.now() + 600000 }; // 10 minutes

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Nexus Movies - Account Recovery Code',
            text: `Hello ${user.username},\n\nYour 6-digit account recovery code is: ${otp}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.`
        });
        res.json({ success: true, message: "OTP sent to email." });
    } catch (err) {
        console.error("OTP Error:", err);
        res.status(500).json({ success: false, message: "Failed to send email." });
    }
});

// --- VERIFY OTP & RESET PASSWORD ROUTE ---
app.post('/api/auth/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const record = otpStore[email];

    if (!record || record.otp !== otp || Date.now() > record.expires) {
        return res.status(400).json({ success: false, message: "Invalid or expired verification code." });
    }

    try {
        const user = await User.findOne({ email });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        
        delete otpStore[email]; 
        res.json({ success: true, message: "Password reset securely!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error resetting password." });
    }
});

app.get('/api/user/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.json({
            success: true,
            profile: {
                username: user.username,
                joinDate: user.createdAt || new Date(),
                profilePhoto: user.profilePhoto || '',
                bio: user.bio || '',
                favoriteGenres: user.favoriteGenres || []
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

app.put('/api/user/profile', auth, async (req, res) => {
    try {
        const { bio, profilePhoto, favoriteGenres } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (bio !== undefined) user.bio = bio;
        if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
        if (favoriteGenres !== undefined) user.favoriteGenres = favoriteGenres;
        await user.save();
        res.json({ success: true, message: 'Profile updated successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server update error' });
    }
});

// ==========================================
// UTILITY ROUTES (CONTACT & REVIEWS)
// ==========================================

// --- REAL CONTACT SUPPORT ROUTE ---
app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Sends the ticket to your own email
            subject: `Nexus Movies Support Ticket from: ${name}`,
            text: `Name: ${name}\nUser Email: ${email}\n\nMessage:\n${message}`
        });
        res.json({ success: true });
    } catch (err) {
        console.error("Email Error:", err);
        res.status(500).json({ success: false });
    }
});

// ==========================================
// MEDIA ROUTES (PROXY TO SECURE API KEY)
// ==========================================

app.get('/api/trending', async (req, res) => {
    try {
        const data = await fetchTMDB('/trending/all/day?language=en-US');
        res.json(data);
    } catch (error) { res.status(502).json({ success: false, message: "TMDB error" }); }
});

app.get('/api/webseries', async (req, res) => {
    try {
        const data = await fetchTMDB('/discover/tv?language=en-US&sort_by=popularity.desc&page=1');
        res.json(data);
    } catch (error) { res.status(502).json({ success: false, message: "TMDB error" }); }
});

app.get('/api/genre/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = await fetchTMDB(`/discover/${type}?with_genres=${id}&sort_by=popularity.desc`);
        res.json(data);
    } catch (error) { res.status(502).json({ success: false, message: "Error fetching genre data" }); }
});

app.get('/api/search', async (req, res) => {
    try {
        const searchQuery = req.query.query;
        if (!searchQuery) return res.json({ results: [] });
        const data = await fetchTMDB(`/search/multi?query=${encodeURIComponent(searchQuery)}&language=en-US`);
        res.json(data);
    } catch (error) { res.status(502).json({ success: false, message: "Error performing search" }); }
});

app.get('/api/cast/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = await fetchTMDB(`/${type}/${id}/credits`);
        res.json({ success: true, cast: data.cast || [] });
    } catch (error) {
        console.error("Backend Cast Fetch Error:", error);
        res.status(500).json({ success: false, cast: [], message: "Server fetch failed" });
    }
});

app.get('/api/details/:mediaType/:id', auth, async (req, res) => {
    try {
        const { mediaType, id } = req.params;
        
        const [mainData, similarData, providerData] = await Promise.all([
            fetchTMDB(`/${mediaType}/${id}?append_to_response=videos,credits`),
            fetchTMDB(`/${mediaType}/${id}/similar`),
            fetchTMDB(`/${mediaType}/${id}/watch/providers`)
        ]);

        let castArray = [];
        if (mainData && mainData.credits && mainData.credits.cast) {
            castArray = mainData.credits.cast;
        } else {
            try {
                const embeddedCredits = await fetchTMDB(`/${mediaType}/${id}/credits`);
                if (embeddedCredits && embeddedCredits.cast) {
                    castArray = embeddedCredits.cast;
                }
            } catch (innerErr) {
                console.log("Internal recovery skipped:", innerErr);
            }
        }

        if (!mainData.credits) {
            mainData.credits = {};
        }
        mainData.credits.cast = castArray;

        res.json({
            success: true,
            item: mainData,
            cast: castArray, 
            similar: similarData.results || [],
            providers: providerData.results || {}
        });
    } catch (error) {
        console.error("Master Details Error:", error);
        res.status(502).json({ success: false, message: "Error fetching media details" });
    }
});

// ==========================================
// 24/7 KEEP-ALIVE PINGER
// ==========================================
// Prevents Render from putting the server to sleep
setInterval(() => {
    // Replace this URL with your actual Render backend URL once deployed
    https.get('https://movie-backend-files.onrender.com'); 
    console.log("Pinged server to keep it awake!");
}, 600000); // 10 minutes

app.listen(PORT, () => {
    console.log(`🚀 Secure Server spinning safely on port http://localhost:${PORT}`);
});