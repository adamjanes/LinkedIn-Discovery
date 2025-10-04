# LinkedIn Network Explorer

A professional React app that helps users expand their network on LinkedIn by discovering related active creators through intelligent profile analysis and network expansion.

## Features

- **Network Management**: Create and manage multiple LinkedIn networks
- **Profile Discovery**: Seed networks with 5-10 LinkedIn profiles and discover related active creators
- **Smart Expansion**: Select and expand specific profiles to grow your network
- **Professional UI**: Clean, enterprise-grade design with responsive layouts
- **Usage Tracking**: Real-time Apify API usage monitoring with monthly limits
- **Manual Refresh**: User-controlled data updates without constant polling

## Architecture

- **Frontend**: React 18 with Vite for fast development
- **Backend**: n8n workflows with Postgres/NoCoDB integration
- **API**: RESTful webhooks for all data operations
- **Styling**: Modern CSS with professional design system

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
5. **Monitor Usage**: Track your Apify API usage in the bottom-right footer

## User Flow

1. **Initial Setup**: User enters their Apify API key in settings
2. **Network Creation**: User creates a network with 5-10 LinkedIn profile URLs
3. **Profile Discovery**: System analyzes profiles and discovers related active creators
4. **Network Expansion**: User selects specific profiles to expand their network further
5. **Usage Monitoring**: Real-time tracking of API usage and monthly limits

## API Endpoints

The app integrates with n8n webhooks at:

- Base URL: `https://webhook-processor-production-48f8.up.railway.app/webhook`

### Key Endpoints:

- `GET /users/:id` - Get user and networks
- `POST /apify` - Update Apify API key
- `POST /networks` - Create new network
- `GET /networks/:userId/:networkId` - Get network profiles
- `POST /expandNetwork` - Expand selected profiles
- `GET /apify-balance/:user_id` - Get Apify usage and billing info

### API Response Examples:

**Get User:**

```json
{
  "id": "user-uuid-123",
  "apify_api_key": "apify-abc123",
  "networks": [
    { "id": 1, "title": "AI Influencers", "created_at": "2025-10-03" }
  ]
}
```

**Apify Balance:**

```json
{
  "monthlyUsage": 2.0287320966176567,
  "resetsAt": "2025-11-02T23:59:59.999Z"
}
```

## Routes

- `/` - Redirects to demo user
- `/:userId` - Homepage with networks list
- `/:userId/settings` - Apify API key configuration
- `/:userId/networks/new` - Create new network
- `/:userId/networks/:networkId` - Network detail and expansion

## Tech Stack

- **React 18** - Modern React with hooks and functional components
- **React Router DOM** - Client-side routing and navigation
- **Vite** - Fast build tool and development server
- **CSS3** - Modern CSS with professional design system
- **Fetch API** - HTTP requests and API integration

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ApifyUsageFooter.jsx
├── pages/              # Page components
│   ├── HomePage.jsx
│   ├── SettingsPage.jsx
│   ├── NetworkCreationPage.jsx
│   └── NetworkDetailPage.jsx
├── services/           # API and external services
│   └── api.js
├── App.jsx            # Main app component
└── main.jsx           # App entry point
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Open `http://localhost:5173`

## Features in Detail

### Network Management

- Create multiple networks with custom titles
- Seed networks with LinkedIn profile URLs
- View network creation dates and metadata

### Profile Discovery

- Intelligent analysis of LinkedIn profiles
- Discovery of related active creators
- Relevance scoring and ranking

### Usage Monitoring

- Real-time Apify API usage tracking
- Monthly limit monitoring ($5/month free tier)
- Usage progress visualization
- Reset date tracking

### Professional UI

- Enterprise-grade design system
- Responsive layouts for all devices
- Clean typography and spacing
- Subtle animations and transitions
