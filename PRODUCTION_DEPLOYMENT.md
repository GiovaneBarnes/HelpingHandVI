# Production Deployment Guide for HelpingHand

## Overview
HelpingHand is a full-stack application consisting of:
- **Frontend**: React/Vite application (serves static files)
- **Backend**: Express.js API server
- **Database**: PostgreSQL database

## Quick Local Production Test

1. **Configure Environment**:
   ```bash
   cp .env.production .env
   # Edit .env with your production values
   ```

2. **Run Deployment Script**:
   ```bash
   ./deploy.sh
   ```

3. **Access Application**:
   - Web App: http://localhost:3000
   - API: http://localhost:3000/api

## Production Hosting Options

### Option 1: VPS/Cloud Server (Recommended)

**Services**: DigitalOcean, AWS EC2, Linode, etc.

**Setup**:
1. Provision server with Node.js and PostgreSQL
2. Upload your code
3. Configure environment variables
4. Run deployment script
5. Set up reverse proxy (nginx) for production

**Example with DigitalOcean**:
```bash
# Install dependencies
sudo apt update
sudo apt install nodejs npm postgresql nginx

# Setup database
sudo -u postgres createdb helpinghand_prod
sudo -u postgres psql -c "CREATE USER app_user WITH PASSWORD 'secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE helpinghand_prod TO app_user;"

# Deploy application
git clone your-repo
cd helpinghand
cp .env.production .env
# Edit .env with production DATABASE_URL
./deploy.sh
```

### Option 2: Platform as a Service (PaaS)

**Vercel + Railway/Supabase**:
- **Frontend**: Deploy to Vercel (free tier available)
- **Backend**: Deploy API to Railway or Render
- **Database**: Use Supabase or Railway PostgreSQL

**Deployment Steps**:
1. **Frontend**: Connect GitHub repo to Vercel, set build command: `npm run build`
2. **Backend**: Deploy API to Railway/Render with build command: `npm run build && npm start`
3. **Database**: Set up PostgreSQL instance and run migrations

### Option 3: Docker Deployment

**Create Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy source code
COPY . .

# Build applications
RUN pnpm --filter api build
RUN pnpm --filter web build

# Expose port
EXPOSE 3000

# Start application
CMD ["./deploy.sh"]
```

**Deploy with Docker**:
```bash
docker build -t helpinghand .
docker run -p 3000:3000 -e DATABASE_URL=your_db_url helpinghand
```

## Environment Variables Required

See `.env.production` for all required variables. Key ones:

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Set to 'production'
- `FRONTEND_URL`: Your production domain
- `VITE_*`: Frontend environment variables (prefixed with VITE_)

## Database Setup

The deployment script automatically runs migrations and seeds. For manual setup:

```bash
cd apps/api
NODE_ENV=production node run-migrations.js
```

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **Database**: Use strong passwords, restrict network access
3. **HTTPS**: Always use HTTPS in production
4. **Firewall**: Configure firewall rules appropriately
5. **Updates**: Keep dependencies updated

## Monitoring & Maintenance

- Set up logs aggregation (e.g., Papertrail, LogDNA)
- Configure backups for database
- Monitor server resources
- Set up error tracking (e.g., Sentry)

## Troubleshooting

**Build Issues**: Ensure all dependencies are installed with `pnpm install`

**Database Connection**: Verify DATABASE_URL format and credentials

**Port Conflicts**: Check if port 3000 is available

**Memory Issues**: Increase server RAM for larger deployments