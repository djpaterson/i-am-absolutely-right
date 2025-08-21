# "You're absolutely right!" counter

A fun webpage that tracks how many times Claude Code says "You're absolutely right!" with a beautiful counter display and histogram showing daily activity.

🔗 **Live site**: [absolutely-right.lefley.dev](https://absolutely-right.lefley.dev)

## Features

- 📊 Real-time counter with smooth animations
- 📈 Interactive histogram showing last 30 days of activity  
- 🔒 Protected API endpoint for secure increments
- 🎨 Beautiful responsive design with Tailwind CSS
- ⚡ Built with Next.js 14 and Vercel KV for blazing fast performance

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Charts**: Recharts
- **Database**: Redis (via Vercel)
- **Hosting**: Vercel
- **Security**: Bearer token authentication

## Local Development

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/TomLefley/i-am-absolutely-right.git
   cd i-am-absolutely-right
   npm install
   ```

2. **Set up environment variables**:
   If you have access to the Vercel project:
   ```bash
   vercel env pull .env.development.local
   ```
   
   Or manually create `.env.development.local` with:
   ```
   API_SECRET=your-generated-secret
   REDIS_URL=redis://default:password@host:port
   COUNTER_API_URL=https://absolutely-right.lefley.dev/api/increment
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Vercel Deployment

### 1. Create New Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: **Next.js**
   - Root Directory: **.**
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 2. Enable Redis Storage

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database**
3. Select **Redis** (Serverless Redis)
4. Choose a database name (e.g., `redis-i-am-absolutely-right`)
5. Select your preferred region
6. Click **Create**

Vercel will automatically add the Redis environment variables to your project.

### 3. Add Environment Variables

In your Vercel project settings, add:

- `API_SECRET`: Generate a secure random string (use `openssl rand -base64 32`)

### 4. Configure Custom Domain

1. In Vercel project settings, go to **Domains**
2. Add custom domain: `absolutely-right.lefley.dev`
3. Follow Vercel's instructions to configure DNS (add CNAME record)

### 5. Deploy

1. Push your code to GitHub
2. Vercel will automatically deploy
3. Your site will be live at `https://absolutely-right.lefley.dev`

## Setting Up Claude Code Hook

The hook automatically loads configuration from `.env.development.local`.

### Setup Steps

1. **Pull environment variables** (if you have Vercel access):
   ```bash
   vercel env pull .env.development.local
   ```

2. **Test the hook**:
   ```bash
   node claude-hook.js --test
   ```

3. **Configure as Claude Code hook**:
   - Add the script path to your Claude Code hook configuration
   - Or pipe Claude Code output through the script:
     ```bash
     claude-code | node claude-hook.js
     ```

4. **Monitor in real-time**:
   ```bash
   node claude-hook.js
   # Then use Claude Code - the hook will detect "You're absolutely right!"
   ```

### Manual Configuration

If you can't use `vercel env pull`, create `.env.development.local` with:
```
API_SECRET=your-generated-secret
COUNTER_API_URL=https://absolutely-right.lefley.dev/api/increment
```

Note: The hook only needs these two variables - the Redis connection is not required for the hook itself.

## API Endpoints

### GET /api/stats
Public endpoint that returns current statistics:
```json
{
  "total": 42,
  "dailyCounts": [
    { "date": "2024-01-20", "count": 3 },
    { "date": "2024-01-21", "count": 5 }
  ],
  "lastUpdated": "2024-01-21T10:30:00.000Z"
}
```

### POST /api/increment
Protected endpoint to increment the counter:
- Requires `Authorization: Bearer <API_SECRET>` header
- Returns updated counts
- Automatically tracks daily statistics

## Security Features

- 🔐 Bearer token authentication for increment endpoint
- 🛡️ Input validation and sanitization
- 🔒 Environment-based secret management
- 🚫 CORS configuration for public endpoints only
- ⏱️ Request timeouts and rate limiting ready

## Data Storage

Uses Redis with:
- `counter:total` - Overall counter value
- `daily:YYYY-MM-DD` - Daily counts with 60-day TTL
- Atomic increment operations for consistency

## Monitoring & Analytics

- Real-time counter updates every 30 seconds
- Historical data visualization (30 days)
- Activity statistics (peak day, average, active days)
- Responsive design for all devices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

GPL-3.0 License - see LICENSE file for details.

---

Made with ❤️ and Claude Code enthusiasm 🤖