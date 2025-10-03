# LinkedIn Network Explorer

A stylish React app that helps users expand their network on LinkedIn by discovering related active creators.

## Features

- **Network Management**: Create and manage multiple LinkedIn networks
- **Profile Discovery**: Seed networks with 5-10 LinkedIn profiles and discover related active creators
- **Smart Expansion**: Select and expand specific profiles to grow your network
- **Modern UI**: Clean, responsive design with gradient backgrounds and smooth animations

## Architecture

- **Frontend**: React with Vite for fast development
- **Backend**: n8n workflows with Postgres/NoCoDB integration
- **API**: RESTful webhooks for all data operations

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:5173`

## Usage

1. **Settings**: First, configure your Apify API key in the settings page
2. **Create Network**: Add a title and LinkedIn profile URLs to seed your network
3. **Discover**: View discovered profiles ranked by relevance
4. **Expand**: Select profiles to expand and discover more connections

## API Endpoints

The app integrates with n8n webhooks at:

- Base URL: `https://webhook-processor-production-48f8.up.railway.app/webhook`

### Key Endpoints:

- `GET /users/:id` - Get user and networks
- `POST /apify` - Update Apify API key
- `POST /networks` - Create new network
- `GET /networks/:userId/:networkId` - Get network profiles
- `POST /expandNetwork` - Expand selected profiles

## Routes

- `/` - Redirects to demo user
- `/:userId` - Homepage with networks list
- `/:userId/settings` - Apify API key configuration
- `/:userId/networks/new` - Create new network
- `/:userId/networks/:networkId` - Network detail and expansion

## Tech Stack

- React 18
- React Router DOM
- Vite
- CSS3 with modern features
- Fetch API for HTTP requests
