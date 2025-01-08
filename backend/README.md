# DiscordStorage

DiscordStorage is a web application that allows users to manage files and folders using a Discord server as the backend storage. It provides a user-friendly interface to upload, download, and manage files and folders.

## Features

- Create, rename, and delete folders
- Upload and download files
- View file previews
- Real-time progress updates for uploads and downloads
- Dark mode support

## Technologies Used

### Backend

- Node.js
- Express
- TypeScript
- Discord.js
- Multer
- WebSocket
- Swagger

### Frontend

- React
- TypeScript
- Vite
- Shadcn UI
- React Query

## Getting Started

### Prerequisites

- Node.js
- npm or yarn
- Discord bot token
- Discord server ID

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/Shafin-A/DiscordStorage.git
   cd DiscordStorage
   ```

2. Install dependencies for both backend and frontend:

   ```sh
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

3. Create a [.env](http://_vscodecontentref_/0) file in the [backend](http://_vscodecontentref_/1) directory with the following content:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   GUILD_ID=your_discord_server_id
   PORT=3000
   ```

### Running the Application

1. Start the backend server:

   ```sh
   cd backend
   npm run dev
   ```

2. Start the frontend development server:

   ```sh
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173` to access the application.

## API Documentation

The API documentation is available at `http://localhost:3000/docs` after starting the backend server.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.
