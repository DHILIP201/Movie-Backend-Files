🎬 Nexus Movies: Advanced Full-Stack Discovery Platform

Developed by Mutex - A Premium Movie Discovery & Community Experience

Nexus Movies is a lightning-fast, beautifully designed full-stack movie discovery platform. Powered by the TMDB API, it features real-time community reviews, customizable public profiles, secure wishlists, and seamless Google OAuth integration. It is built to deliver rich media details and real-time streaming availability without compromising on speed or security.

✨ Core Features

🔒 Robust Authentication: Supports secure Email/Password registration (bcrypt hashed + JWT) and 1-click Google OAuth 2.0 login.

📧 OTP Password Recovery: Integrated with the Brevo HTTP API to send secure 6-digit email verification codes for forgotten passwords.

💬 Instagram-Style Comments: Features live star ratings, reply tagging, and 3-dot context menus (⋮) for instant comment deletion.

🛡️ Alias Shield (Dynamic Sync): If a user changes their username, the database automatically intercepts and cascades the update so all their past comments instantly reflect their new name and avatar.

👤 Comprehensive Profiles: Users can customize their bios, upload Base-64 compressed profile pictures, and select favorite genres. Features both Private Dashboard and Public viewing modes.

❤️ Live Wishlists: Users can bookmark movies and TV shows to a localized and cloud-synced public wishlist.

🎥 Rich TMDB Integration: Live trending feeds, web series tracking, genre filtering, live search, cast details, embedded YouTube trailers, and region-specific streaming provider data (Where to watch).

🧨 Absolute Data Control: A strict account deletion feature that cascades to permanently wipe the user, their profile, their wishlist, and all associated comments from the database forever.

🛠️ Technology Stack

Backend (The Core Engine)

Node.js & Express.js: Handles secure routing, API integration, and stateless session management.

MongoDB Atlas & Mongoose: Highly relational data modeling using schemas.

JWT & Bcrypt.js: Industry-standard cryptographic security for passwords and sessions.

Frontend (The User Interface)

HTML5 / CSS3 / Vanilla JS: Lightweight, lightning-fast rendering without heavy framework overhead. Custom grid architecture and horror-flicker CSS animations.

Google Identity Services (GSI): Handles seamless OAuth token generation.

External APIs (The Data Feeds)

TMDB API: Global movie, TV, and streaming provider data.

Brevo API: Transactional SMTP routing for secure OTP emails.

🚀 How to Run Locally

Follow these exact steps to deploy the Nexus Movies architecture on your local machine:

1. Clone the repository and navigate to the directory:

git clone https://github.com/yourusername/nexus-movies.git
cd nexus-movies


2. Install Backend Dependencies:
Navigate to the backend directory and install the required packages:

npm install express cors mongoose bcryptjs jsonwebtoken dotenv


3. Configure Environment Variables:
Create a .env file in the root of your backend directory and add your API keys:

PORT=5000
MONGO_URI=your_mongodb_connection_string
TMDB_API_KEY=your_tmdb_api_key
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
EMAIL_USER=your_brevo_verified_email_address
EMAIL_PASS=your_brevo_smtp_api_key


4. Start the Core Server:

node server.js


(You should see a success message: 🚀 Secure Server spinning safely on port http://localhost:5000)

5. Launch the Frontend UI:
Since the frontend uses vanilla web technologies, no build step is required. Simply open index.html in your browser. (Using an extension like VS Code Live Server is recommended to prevent CORS issues). Make sure BASE_BACKEND_URL in the JavaScript points to your local server.

🗄️ Database Architecture

Users: Handles core authentication (Username, Email, Hashed Password).

UserProfiles: Dedicated collection for Bios, Avatars, and Favorite Genres to allow flexible updates.

Reviews: Stores media IDs, content, and ratings, mapping dynamically to user IDs for secure deletion.

UserWishlists: Stores arrays of saved media objects tied securely to a specific user session.

Built with precision by Mutex.
