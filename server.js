const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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
        jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
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
        jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ success: true, token, username: user.username });
        });
    } catch (err) {
        res.status(500).send('Server error during login');
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

// Dynamic Route: Handles both Movies and TV Genres
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

// NEW SAFEFALL ROUTE: Dedicated endpoint specifically for cast/credits
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

// PROTECTED: Master Details Route (Bundles Details, Similar, Providers, AND Cast)
app.get('/api/details/:mediaType/:id', auth, async (req, res) => {
    try {
        const { mediaType, id } = req.params;
       
        // Fetches all fields smoothly using standard template formats
        const [mainData, similarData, providerData] = await Promise.all([
            fetchTMDB(`/${mediaType}/${id}?append_to_response=videos,credits`),
            fetchTMDB(`/${mediaType}/${id}/similar`),
            fetchTMDB(`/${mediaType}/${id}/watch/providers`)
        ]);

        // Explicit structural guarantee to pass cast both wrapped inside credits and as a root parameter to fully align with frontend fallback attempts
        let castArray = [];
        if (mainData && mainData.credits && mainData.credits.cast) {
            castArray = mainData.credits.cast;
        } else {
            // Internal network level recovery fallback
            try {
                const embeddedCredits = await fetchTMDB(`/${mediaType}/${id}/credits`);
                if (embeddedCredits && embeddedCredits.cast) {
                    castArray = embeddedCredits.cast;
                }
            } catch (innerErr) {
                console.log("Internal recovery skipped:", innerErr);
            }
        }

        // Apply clean data attachment block directly to the payload objects
        if (!mainData.credits) {
            mainData.credits = {};
        }
        mainData.credits.cast = castArray;

        res.json({
            success: true,
            item: mainData,
            cast: castArray, // Added explicitly at root level for immediate script destructuring matching
            similar: similarData.results || [],
            providers: providerData.results || {}
        });
    } catch (error) {
        console.error("Master Details Error:", error);
        res.status(502).json({ success: false, message: "Error fetching media details" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Secure Server spinning safely on port http://localhost:${PORT}`);
});