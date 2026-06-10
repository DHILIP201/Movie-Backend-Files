const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
require('dotenv').config();

// Import Models & Middleware
const User = require('./models/Temp');
const auth = require('./middleware/auth');

// ==========================================
// NEW: DATABASE MODEL FOR GLOBAL REVIEWS
// ==========================================
const reviewSchema = new mongoose.Schema({
    movieId: { type: String, required: true },
    mediaType: { type: String, required: true },
    username: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now }
});
const Review = mongoose.model('Review', reviewSchema);
// ==========================================

const app = express();
const PORT = process.env.PORT || 5000;
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'movie_secret_key';

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// MongoDB Connection Block
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('🍃 Connected to MongoDB Atlas successfully!'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Temporary memory store for OTPs
const otpStore = {};

// Bulletproof Fetch Helper Function for TMDB
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

// --- FORGOT PASSWORD: SEND OTP ROUTE (BYPASSES BLOCKED SMTP PORTS) ---
app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    console.log(`\n\n[🚀 OTP TRIGGERED] User requested code for: ${email}`);
    
    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`[❌ OTP FAILED] No account found for email: ${email}`);
            return res.status(404).json({ success: false, message: "No account found with this email." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otpStore[email] = { otp, expires: Date.now() + 600000 }; // 10 minutes

        console.log(`[⏳ SENDING EMAIL] Dispatching API request to Brevo HTTP Endpoint...`);
        
        const sendEmailData = {
            sender: { name: "Nexus Movies Support", email: process.env.EMAIL_USER },
            to: [{ email: email }],
            subject: 'Nexus Movies - Account Recovery Code',
            htmlContent: `
                <p>Hello ${user.username},</p>
                <p>Your 6-digit account recovery code is: <strong>${otp}</strong></p>
                <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
            `
        };

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": process.env.EMAIL_PASS, // Your Brevo API Key
                "content-type": "application/json"
            },
            body: JSON.stringify(sendEmailData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify(result));
        }
        
        console.log(`[✅ EMAIL SENT SUCCESS] The 6-digit code (${otp}) was successfully processed by Brevo HTTP API!`);
        res.json({ success: true, message: "OTP sent to email." });
        
    } catch (err) {
        console.error(`\n[🚨 MASSIVE EMAIL ERROR] Brevo API connection failed:`, err);
        res.status(500).json({ success: false, message: "Failed to send email via API gateway." });
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
// UTILITY ROUTES (CONTACT VIA BREVO HTTP API)
// ==========================================

app.post('/api/contact', async (req, res) => {
    const { name, email, message } = req.body;
    console.log(`\n\n[🚀 CONTACT TRIGGERED] Ticket from: ${name} (${email})`);

    try {
        const sendContactData = {
            sender: { name: "Nexus Movies System", email: process.env.EMAIL_USER },
            to: [{ email: process.env.EMAIL_USER }], // Sends support ticket to your admin email
            subject: `Nexus Movies Support Ticket from: ${name}`,
            htmlContent: `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>User Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        };

        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: {
                "accept": "application/json",
                "api-key": process.env.EMAIL_PASS,
                "content-type": "application/json"
            },
            body: JSON.stringify(sendContactData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify(result));
        }

        console.log(`[✅ CONTACT SUCCESS] Support email successfully processed by Brevo API!`);
        res.json({ success: true });
    } catch (err) {
        console.error("\n[🚨 CONTACT EMAIL ERROR] Could not route contact email via HTTP API:", err);
        res.status(500).json({ success: false });
    }
});

// ==========================================
// GLOBAL REVIEW ROUTE (NEW)
// ==========================================
app.post('/api/review', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const newReview = new Review({
            movieId: req.body.movieId.toString(),
            mediaType: req.body.mediaType,
            username: user.username,
            userId: req.user.id,
            rating: req.body.rating,
            content: req.body.content
        });

        await newReview.save();
        res.json({ success: true, review: newReview });
    } catch (err) {
        console.error("Review save error:", err);
        res.status(500).json({ success: false, message: "Server error saving review" });
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
                if (embeddedCredits && embeddedCredits.cast) castArray = embeddedCredits.cast;
            } catch (innerErr) {
                console.log("Internal recovery skipped:", innerErr);
            }
        }

        if (!mainData.credits) mainData.credits = {};
        mainData.credits.cast = castArray;

        // 🔥 NEW: Fetch global reviews from MongoDB and attach them to the movie data!
        const globalReviews = await Review.find({ movieId: id.toString(), mediaType }).sort({ date: -1 });
        mainData.reviews = globalReviews;

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
setInterval(() => {
    https.get('https://movie-backend-files.onrender.com'); 
    console.log("Pinged server to keep it awake!");
}, 600000); // 10 minutes

app.listen(PORT, () => {
    console.log(`🚀 Secure Server spinning safely on port http://localhost:${PORT}`);
});