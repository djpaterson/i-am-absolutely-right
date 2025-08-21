# "You're Absolutely Right!" Counter

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
- **Database**: Vercel KV (Redis)
- **Hosting**: Vercel
- **Security**: Bearer token authentication

## Local Development

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/your-username/i-am-absolutely-right.git
   cd i-am-absolutely-right
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add:
   ```
   API_SECRET=your-super-secret-api-key-here
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

### 2. Enable Vercel KV Storage

1. In your Vercel project dashboard, go to **Storage** tab
2. Click **Create Database**
3. Select **KV** (Key-Value Store)
4. Choose a database name: `absolutely-right-counter`
5. Select your preferred region
6. Click **Create**

Vercel will automatically add the KV environment variables to your project.

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

### Option 1: Environment Variables

Set up the hook with environment variables:

```bash
export COUNTER_API_URL="https://absolutely-right.lefley.dev/api/increment"
export COUNTER_API_SECRET="your-api-secret-here"
```

### Option 2: Claude Code Hook Configuration

1. **Test the hook**:
   ```bash
   node claude-hook.js --test
   ```

2. **Configure as Claude Code hook**:
   - Add the script path to your Claude Code hook configuration
   - Or pipe Claude Code output through the script:
     ```bash
     claude-code | node claude-hook.js
     ```

3. **Monitor in real-time**:
   ```bash
   node claude-hook.js
   # Then use Claude Code - the hook will detect "You're absolutely right!"
   ```

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

Uses Vercel KV (Redis) with:
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

MIT License - see LICENSE file for details.

---

Made with ❤️ and Claude Code enthusiasm 🤖