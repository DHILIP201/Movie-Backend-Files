const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // --- NEW PROFILE FIELDS ---
    profilePhoto: { type: String, default: '' },
    bio: { type: String, default: '' },
    favoriteGenres: { type: [String], default: [] }
}, { timestamps: true }); // timestamps automatically adds createdAt and updatedAt

module.exports = mongoose.model('User', UserSchema);