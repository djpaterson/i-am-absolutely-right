# "You're absolutely right!" counter

A fun webpage that tracks how many times Claude Code says "You're absolutely right!" with a beautiful counter display and unified chart showing daily activity comparison.

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
git clone https://github.com/yourusername/i-am-absolutely-right.git
cd i-am-absolutely-right
npm install

# Copy environment variables template
cp .env.example .env.development.local

# Edit .env.development.local with your values:
# - Set your API_SECRET (generate with: openssl rand -base64 32)
# - Update COUNTER_API_URL with your domain
# - Set your GitHub repository URL for the footer link
# - Set your site URL for Open Graph metadata

# Start local Redis with Docker
docker-compose up -d

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

The following environment variables are required:

| Variable | Description | Example |
|----------|-------------|---------|
| `API_SECRET` | Secret key for API authentication | `randombase64string` |
| `REDIS_URL` | Redis connection URL | `redis://default:devpassword@localhost:6379` |
| `COUNTER_API_URL` | API endpoint for both counters (uses type parameter) | `https://your-domain.com/api/increment` |
| `NEXT_PUBLIC_GITHUB_URL` | Your GitHub repository URL (shown in footer) | `https://github.com/yourusername/i-am-absolutely-right` |
| `NEXT_PUBLIC_SITE_URL` | Your deployed site URL (for Open Graph) | `https://your-domain.com` |

Create a `.env.development.local` file with these variables for local development.

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

The `claude-hook.js` script automatically detects phrases and increments counters via API calls. It uses different environment files based on context:

### Environment Configuration

- **Production (Claude Hook)**: Uses `.env.production.local` 
- **Development (Testing)**: Uses `.env.development.local`

Create both files with appropriate settings (you can use `vercel env pull` if you have set up environment variables in vercel for your deployment):

**.env.development.local** (for local testing):
```bash
API_SECRET=your_dev_secret_here
COUNTER_API_URL=http://localhost:3000/api/increment
```

**.env.production.local** (for Claude Code hook):
```bash
API_SECRET=your_prod_secret_here
COUNTER_API_URL=https://your-domain.com/api/increment
```

### Setup Hook in Claude Code

Use the Claude Code hooks wizard to add a `Stop` event hook:

**Command**: `NODE_ENV=production /path/to/your/project/claude-hook.js`

### Testing the Claude Hook

Use the `test-hook.js` script to test the hook functionality locally:

```bash
# Test "absolutely right" counter detection
node test-hook.js --test

# Test issue detection counter  
node test-hook.js --test-issue

# Test with custom message
node test-hook.js --text "You are absolutely correct!"

# Show help
node test-hook.js --help
```

The test script creates mock Claude Code hook input and validates the complete pipeline including phrase detection and API calls.

## License

GPL-3.0 License - see LICENSE file for details.

---

Made with ❤️ and Claude Code enthusiasm 🤖