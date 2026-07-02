🎬 Nexus Movies

Nexus Movies is a lightning-fast, beautifully designed full-stack movie discovery platform. Powered by the TMDB API, it features real-time community reviews, customizable public profiles, secure wishlists, and seamless Google OAuth integration. Developed by Mutex.

✨ Key Features

🔒 Robust Authentication: Supports secure Email/Password registration (bcrypt hashed + JWT) and 1-click Google OAuth 2.0 login.

📧 OTP Password Recovery: Integrated with the Brevo HTTP API to send secure 6-digit email OTPs for forgotten passwords.

💬 Instagram-Style Comments:

Dynamic review system with live star ratings.

3-dot context menus (⋮) allowing users to instantly delete their own comments or report others.

Reply tagging system that auto-fills usernames.

Alias Shield (Dynamic Sync): If a user changes their username, the database automatically cascades the update so all their past comments instantly reflect their new name and avatar.

👤 Comprehensive User Profiles: Users can customize their bios, upload profile pictures (auto-compressed to Base64), and select favorite genres. Features both Private Dashboard and Public viewing modes.

❤️ Live Wishlists: Users can bookmark movies/TV shows to a localized and cloud-synced public wishlist.

🎥 Rich TMDB Integration: Live trending feeds, web series tracking, genre filtering, live search, cast details, embedded YouTube trailers, and region-specific streaming provider data (Where to watch).

🛡️ Absolute Data Control: A strict account deletion feature that cascades to permanently wipe the user, their profile, their wishlist, and all associated comments from the database forever.

🛠️ Tech Stack

Frontend:

HTML5 / CSS3 (Custom Variables, CSS Grid/Flexbox)

Vanilla JavaScript (ES6+)

Google Identity Services (GSI)

UI Highlights: Skeleton loaders, custom horror-flicker CSS animations, and modal-driven architecture.

Backend:

Node.js & Express.js

MongoDB Atlas & Mongoose (Schemas: User, UserProfile, UserWishlist, Review)

JWT (JSON Web Tokens) for stateless session management

Bcrypt.js for password cryptography

External APIs:

TMDB API (Movie & TV Data)

Brevo API (Transactional SMTP Emails)

Google OAuth 2.0

🚀 Local Setup & Installation

Prerequisites

Node.js installed

MongoDB Atlas Account (or local MongoDB)

TMDB API Key

Google Cloud Console Project (for Client ID)

Brevo Account (for SMTP API keys)

1. Clone the Repository

git clone https://github.com/yourusername/nexus-movies.git
cd nexus-movies


2. Backend Setup

Navigate to the backend directory and install dependencies:

npm install express cors mongoose bcryptjs jsonwebtoken dotenv


Create a .env file in the root of your backend directory and add the following:

PORT=5000
MONGO_URI=your_mongodb_connection_string
TMDB_API_KEY=your_tmdb_api_key
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
EMAIL_USER=your_brevo_verified_email_address
EMAIL_PASS=your_brevo_smtp_api_key


Start the backend server:

node server.js


3. Frontend Setup

The frontend is built with vanilla web technologies, so no build step is required!

Open index.html.

Ensure BASE_BACKEND_URL on line ~1100 points to your local server (http://localhost:5000/api) or your deployed backend URL.

Open index.html in your browser (using an extension like VS Code Live Server is recommended to prevent CORS issues).

🗄️ Database Schema Overview

Users: Handles core auth (Username, Email, Hashed Password).

UserProfiles: Dedicated collection for Bios, Avatars, and Favorite Genres to bypass strict temp schemas.

Reviews: Stores movieId, content, rating, and maps dynamically to userId.

UserWishlists: Stores arrays of saved media objects tied to a specific username.

🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

📝 License

This project is proprietary and developed by Mutex.
