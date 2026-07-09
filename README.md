🎬 Nexus Movies: Advanced Full-Stack Discovery Platform

🌐 Live Production Environment: https://nexus-movie.abrdns.com/

A Flagship Product Developed by Mutex — Premium Movie Discovery & Community Experience

Nexus Movies is a lightning-fast, beautifully designed full-stack movie discovery platform, engineered as a core product by my software company, Mutex. Powered by the TMDB API, it features real-time community reviews, customizable public profiles, secure wishlists, and seamless Google OAuth integration. It is built to deliver rich media details and real-time streaming availability without compromising on speed, scalability, or security.

✨ Core Features

🔒 Robust Authentication: Supports secure Email/Password registration (bcrypt hashed + JWT) and 1-click Google OAuth 2.0 login.

📧 OTP Password Recovery: Integrated with the Brevo HTTP API to send secure 6-digit email verification codes for forgotten passwords.

💬 Instagram-Style Comments: Features live star ratings, reply tagging, and 3-dot context menus (⋮) for instant comment deletion and reporting.

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

git clone https://github.com/DHILIP201/Movie-Backend-Files.git
cd Movie-Backend-Files


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


🏗️ Nexus Movies - System Architecture & Workflow

A visual breakdown of the full-stack data flow for the Nexus Movies platform.

📊 Visual Workflow Diagram

(Note: GitHub will automatically render the code block below into a visual flowchart!)
flowchart LR
    %% Defining aesthetic styles
    classDef frontend fill:#e6f3ff,stroke:#0b57d0,stroke-width:2px,color:#041e49,font-weight:bold
    classDef backend fill:#e8f5e9,stroke:#146c2e,stroke-width:2px,color:#0f5223,font-weight:bold
    classDef db fill:#e0f2f1,stroke:#00695c,stroke-width:2px,color:#004d40,font-weight:bold
    classDef userbox fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#bf360c,font-weight:bold
    classDef apibox fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#4a148c,font-weight:bold

    subgraph USER_ENV ["1. USER ENVIRONMENT"]
        direction TB
        U((👤 User)) --> Browser[Web Browser]
    end

    subgraph FRONTEND ["2. FRONTEND (CLIENT)"]
        direction TB
        UI[HTML5 / CSS3 Interface] --> Logic[Vanilla JS DOM Manipulation]
        Logic --> Fetch[Fetch API Helpers]
    end

    subgraph BACKEND ["4. BACKEND (SERVER)"]
        direction TB
        Node[Node.js + Express.js] --> Middleware[Auth Middleware JWT]
        Middleware --> Routes[API Routers]
        Routes --> Controller[Business Logic]
        Controller --> Mongoose[Mongoose Schemas]
    end

    subgraph DATABASE ["6. CLOUD DATABASE"]
        Mongo[(MongoDB Atlas)]
    end

    subgraph EXTERNAL ["EXTERNAL APIs"]
        direction TB
        TMDB(TMDB API)
        Brevo(Brevo API)
        Google(Google OAuth)
    end

    %% Network Flow
    Browser -- "User Action" --> UI
    UI -. "UI Update" .- Browser

    Fetch == "3. API REQUEST" ==> Middleware
    Middleware -. "7. API RESPONSE" .-> Fetch

    Mongoose == "5. DB OPERATIONS" ==> Mongo
    Mongo -. "Data Retrieval" .-> Mongoose

    Controller -- "Secure Fetch" --> TMDB
    Controller -- "Trigger SMTP" --> Brevo
    Middleware -- "Token Verification" --> Google

    %% Apply Styles
    class USER_ENV userbox;
    class FRONTEND frontend;
    class BACKEND backend;
    class DATABASE db;
    class EXTERNAL apibox;


📋 Step-by-Step Workflow Explanation

If you are explaining your project in an interview, here is the exact step-by-step breakdown of how data moves through your system (matching the diagram above):

1️⃣ User Interaction:
The user interacts with the application in their web browser (e.g., typing a movie name into the search bar or clicking "Login").

2️⃣ Frontend Processing:
The Vanilla JavaScript catches the event (like the debounced search input). It updates the UI (showing a loading skeleton) and formats the data to be sent to the server.

3️⃣ API Request (Client ➡️ Server):
The browser's fetch() API sends an HTTP request (GET, POST, PUT, DELETE) to your custom Node.js backend. It attaches secure credentials, like the JWT token in the headers.

4️⃣ Backend Routing & Logic:
Express.js receives the request.

Middleware: Checks CORS and validates the JWT token or Google OAuth credentials.

Controllers: The business logic takes over. If the user searched for a movie, the controller uses the fetchTMDB() helper to request data from the external TMDB API. If they requested a password reset, it contacts the Brevo API.

5️⃣ Database Operations (CRUD):
If the request involves user data (like saving a review, updating a profile, or checking login credentials), Mongoose validates the schema and executes a query to the database.

6️⃣ Cloud Storage:
MongoDB Atlas securely stores or retrieves the requested data (Users, Reviews, Profiles, Wishlists) and sends the result back to the Express controller.

7️⃣ API Response (Server ➡️ Client):
The Node.js backend packages the final data (movies, user profiles, or success messages) into a clean JSON object and sends it back across the internet to the frontend.

8️⃣ UI Update:
The Vanilla JS receives the JSON response and dynamically updates the HTML Document Object Model (DOM)—rendering the movie cards, displaying the 3-dot comment menus, or flashing a success toast notification!
