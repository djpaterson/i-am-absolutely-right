# "You're absolutely right!" counter

A fun webpage that tracks how many times Claude Code says "You're absolutely right!" with a beautiful counter display and histogram showing daily activity. 

🔗 [absolutely-right.djpaterson.dev](https://absolutely-right.djpaterson.dev)

## Tech Stack

- Next.js 14, React, TypeScript, Tailwind CSS
- Redis database via Vercel
- Recharts for the histogram
- Claude Code hook for automatic detection

## Local Development

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose

### Setup

```bash
git clone https://github.com/djpaterson/i-am-absolutely-right.git
cd i-am-absolutely-right
npm install

# Start local Redis with Docker
docker-compose up -d

# Get environment variables from Vercel (if you have access)
vercel env pull .env.development.local

# Or manually create .env.development.local with:
# API_SECRET=your-secret
# REDIS_URL=redis://default:devpassword@localhost:6379
# COUNTER_API_URL=https://your-domain.com/api/increment

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Docker Services

- **Redis**: `localhost:6379` (password: `devpassword`)
- View Redis data: `docker exec -it absolutely-right-redis redis-cli -a devpassword`
- Stop services: `docker-compose down`

## Vercel Deployment

1. Create new Vercel project from GitHub repo
2. Add Redis database in Storage tab
3. Set `API_SECRET` environment variable (`openssl rand -base64 32`)
4. Add custom domain if desired
5. Deploy

## Claude Code Hook

Use the Claude Code hooks wizard to add a `Stop` event hook:

**Command**: `/path/to/your/project/claude-hook.js`

Or test manually:
```bash
node claude-hook.js --test
```

## License

GPL-3.0 License - see LICENSE file for details.

---

Made with ❤️ and Claude Code enthusiasm 🤖