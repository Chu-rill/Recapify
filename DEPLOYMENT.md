# Recapify - Deployment Guide

This guide covers deploying Recapify using Docker and GitHub Actions CI/CD.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development with Docker](#local-development-with-docker)
- [Environment Configuration](#environment-configuration)
- [GitHub Actions Setup](#github-actions-setup)
- [Deployment Options](#deployment-options)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker Engine 20.10+ and Docker Compose 2.0+
- Node.js 20+ (for local development without Docker)
- PostgreSQL 16+ (if not using Docker)
- GitHub account (for CI/CD)

## Local Development with Docker

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/recapify.git
   cd recapify
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and update the values with your actual configuration.

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

5. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000
   - Database: localhost:5432

### Development Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild services after code changes
docker-compose up -d --build

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate

# Access backend shell
docker-compose exec backend sh

# Access database shell
docker-compose exec postgres psql -U recapify -d recapify_db

# Clean up everything (including volumes)
docker-compose down -v
```

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
POSTGRES_USER=recapify
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=recapify_db
DATABASE_URL=postgresql://recapify:your_secure_password@postgres:5432/recapify_db?schema=public
DIRECT_URL=postgresql://recapify:your_secure_password@postgres:5432/recapify_db?schema=public

# Application Configuration
NODE_ENV=production
PORT=3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-min-32-characters

# Frontend Configuration
FRONTEND_URL=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com/api/v1

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.yourdomain.com/api/v1/auth/google/callback

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_BUCKET=recapify-documents

# AI Services
GEMINI_API_KEY=your-gemini-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Email Configuration
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### Frontend Environment Variables

The frontend uses Vite, so environment variables must be prefixed with `VITE_`:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## GitHub Actions Setup

### Required Secrets

Configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

#### Docker Registry (using GitHub Container Registry)
- `GITHUB_TOKEN` - Automatically provided by GitHub Actions

#### Deployment Secrets (Production)
- `PRODUCTION_HOST` - Your production server IP/hostname
- `PRODUCTION_USER` - SSH username
- `PRODUCTION_SSH_KEY` - Private SSH key for deployment
- `PRODUCTION_URL` - Production URL (for environment display)

#### Deployment Secrets (Staging)
- `STAGING_HOST` - Your staging server IP/hostname
- `STAGING_USER` - SSH username
- `STAGING_SSH_KEY` - Private SSH key for deployment
- `STAGING_URL` - Staging URL (for environment display)

#### Optional Secrets
- `CODECOV_TOKEN` - For code coverage reporting
- `VITE_API_URL` - Frontend API URL (if different from default)

### Workflow Overview

The CI/CD pipeline includes:

1. **PR Checks** (`pr-checks.yml`)
   - Runs on every pull request
   - Lints and tests both frontend and backend
   - Tests Docker builds
   - Runs security audits
   - Checks PR title format

2. **CI/CD Pipeline** (`ci-cd.yml`)
   - Runs on push to `master` or `dev` branches
   - Tests and builds applications
   - Builds and pushes Docker images to GitHub Container Registry
   - Runs security scans with Trivy
   - Deploys to staging (dev branch) or production (master branch)

### Enabling GitHub Container Registry

1. Go to your repository Settings → Actions → General
2. Scroll to "Workflow permissions"
3. Select "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"
5. Save changes

## Deployment Options

### Option 1: Deploy to VPS/VM

#### Prerequisites
- Ubuntu 20.04+ server
- Docker and Docker Compose installed
- Domain name pointing to your server
- SSL certificate (Let's Encrypt recommended)

#### Setup Steps

1. **Prepare the server**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Create application directory**
   ```bash
   sudo mkdir -p /opt/recapify
   sudo chown $USER:$USER /opt/recapify
   cd /opt/recapify
   ```

3. **Copy docker-compose.yml and .env**
   ```bash
   # Copy files to server or clone repository
   git clone https://github.com/yourusername/recapify.git .

   # Create .env file with production values
   nano .env
   ```

4. **Setup SSH key for GitHub Actions**
   ```bash
   # On your local machine, generate SSH key pair
   ssh-keygen -t ed25519 -f github-actions-key

   # Add public key to server's authorized_keys
   ssh-copy-id -i github-actions-key.pub user@your-server

   # Add private key to GitHub Secrets as PRODUCTION_SSH_KEY
   ```

5. **Setup Nginx (recommended)**
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx

   # Configure Nginx reverse proxy
   sudo nano /etc/nginx/sites-available/recapify
   ```

   Example Nginx configuration:
   ```nginx
   server {
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }

   server {
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/recapify /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx

   # Get SSL certificate
   sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
   ```

6. **First deployment**
   ```bash
   cd /opt/recapify
   docker-compose up -d
   docker-compose exec backend npx prisma migrate deploy
   ```

### Option 2: Deploy to AWS ECS

1. Create ECS cluster
2. Create task definitions for backend and frontend
3. Setup RDS PostgreSQL instance
4. Configure Application Load Balancer
5. Update GitHub Actions workflow with ECS deployment steps

### Option 3: Deploy to Kubernetes

1. Create Kubernetes manifests (deployments, services, ingress)
2. Setup PostgreSQL (managed service or StatefulSet)
3. Configure secrets and ConfigMaps
4. Update GitHub Actions workflow with kubectl deployment

### Option 4: Deploy to Railway/Render/Fly.io

These platforms support Docker and can deploy directly from GitHub:

1. Connect your GitHub repository
2. Configure environment variables in the platform dashboard
3. Platform will automatically deploy on push to main branch

## Database Migrations

### Running Migrations

```bash
# In production
docker-compose exec backend npx prisma migrate deploy

# Locally
cd server
npx prisma migrate deploy
```

### Creating New Migrations

```bash
# Create migration
cd server
npx prisma migrate dev --name migration_name

# Generate Prisma client
npx prisma generate
```

## Health Checks

The application includes health check endpoints:

- **Backend**: `GET /api/v1/health` (returns 200 OK)
- **Frontend**: `GET /health` (returns 200 OK)
- **Database**: Built-in PostgreSQL health check

Docker Compose and Kubernetes will automatically restart unhealthy containers.

## Monitoring and Logs

### Docker Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Production Monitoring

Consider setting up:
- **Application Performance Monitoring**: Sentry, New Relic, Datadog
- **Log Aggregation**: ELK Stack, Loki, CloudWatch
- **Metrics**: Prometheus + Grafana
- **Uptime Monitoring**: UptimeRobot, Pingdom

## Backup and Recovery

### Database Backups

```bash
# Create backup
docker-compose exec postgres pg_dump -U recapify recapify_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T postgres psql -U recapify recapify_db < backup_20231225_120000.sql
```

### Automated Backups

Add to crontab on server:
```bash
0 2 * * * cd /opt/recapify && docker-compose exec -T postgres pg_dump -U recapify recapify_db | gzip > /backups/recapify_$(date +\%Y\%m\%d).sql.gz
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Use load balancer (Nginx, HAProxy, or cloud load balancer)
```

### Vertical Scaling

Update resource limits in docker-compose.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Check container status
docker-compose ps

# Restart service
docker-compose restart backend
```

### Database Connection Issues

```bash
# Check if database is running
docker-compose ps postgres

# Test database connection
docker-compose exec postgres psql -U recapify -d recapify_db -c "SELECT 1;"

# Check DATABASE_URL environment variable
docker-compose exec backend printenv DATABASE_URL
```

### Build Failures

```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Port Conflicts

```bash
# Find process using port
lsof -i :3000
sudo netstat -tulpn | grep :3000

# Kill process or change port in docker-compose.yml
```

### Memory Issues

```bash
# Check Docker memory usage
docker stats

# Increase Docker memory limit (Docker Desktop)
# Settings → Resources → Advanced → Memory
```

## Security Best Practices

1. **Never commit .env files** - Use .env.example as template
2. **Use strong passwords** - Generate with: `openssl rand -base64 32`
3. **Keep dependencies updated** - Run `npm audit` regularly
4. **Enable firewall** - Only expose necessary ports
5. **Use HTTPS** - Always use SSL/TLS in production
6. **Regular backups** - Automate database backups
7. **Monitor logs** - Watch for suspicious activity
8. **Update Docker images** - Keep base images current

## Support

For issues or questions:
- GitHub Issues: https://github.com/yourusername/recapify/issues
- Documentation: [README.md](README.md)
