# "You're absolutely right!" counter

A fun webpage that tracks how many times Claude Code says "You're absolutely right!" with a beautiful counter display and histogram showing daily activity. 

🔗 [absolutely-right.lefley.dev](https://absolutely-right.lefley.dev)

## Tech Stack

- Next.js 14, React, TypeScript, Tailwind CSS
- Redis database via Vercel
- Recharts for the histogram
- Claude Code hook for automatic detection

## Local Installation

```bash
git clone https://github.com/TomLefley/i-am-absolutely-right.git
cd i-am-absolutely-right
npm install

# Get environment variables from Vercel (if you have access)
vercel env pull .env.development.local

# Or manually create .env.development.local with:
# API_SECRET=your-secret
# REDIS_URL=redis://...
# COUNTER_API_URL=https://your-domain.com/api/increment

npm run dev
```

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