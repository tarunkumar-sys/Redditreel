# Deployment Guide

This guide covers deploying Reddit Reel AI to production environments.

## 🚀 Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Select the project

### 3. Configure Environment Variables

In Vercel dashboard, go to **Settings → Environment Variables** and add:

```env
AUTH_SECRET=your-generated-secret
DATABASE_URL=file:./prisma/dev.db
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
REDDIT_CLIENT_ID=your-reddit-app-id
REDDIT_CLIENT_SECRET=your-reddit-app-secret
```

### 4. Deploy

Click **Deploy** and wait for the build to complete.

### 5. Database Setup

After first deployment, run migrations:

```bash
vercel env pull  # Pull environment variables
npx prisma db push  # Run migrations
```

---

## 🐳 Docker

Deploy using Docker containers.

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

### 2. Create .dockerignore

```
node_modules
.next
.git
.env.local
.env
```

### 3. Build & Run

```bash
# Build image
docker build -t reddit-reel-ai .

# Run container
docker run -p 3000:3000 \
  -e AUTH_SECRET=your-secret \
  -e DATABASE_URL=file:./prisma/dev.db \
  reddit-reel-ai
```

---

## ☁️ AWS EC2

Deploy to AWS EC2 instance.

### 1. Launch EC2 Instance

- AMI: Ubuntu 22.04 LTS
- Instance Type: t3.medium (or larger)
- Security Group: Allow ports 80, 443, 3000

### 2. Connect & Setup

```bash
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Clone repository
git clone https://github.com/yourusername/reddit-reel-ai.git
cd reddit-reel-ai
```

### 3. Install Dependencies

```bash
npm install
npm run build
```

### 4. Setup Environment

```bash
nano .env.local
# Add your environment variables
```

### 5. Setup PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Start application
pm2 start npm --name "reddit-reel-ai" -- start

# Setup auto-restart
pm2 startup
pm2 save
```

### 6. Setup Nginx (Reverse Proxy)

```bash
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/default
```

Add:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Restart Nginx:

```bash
sudo systemctl restart nginx
```

### 7. Setup SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d your-domain.com
```

---

## 🔧 Environment Variables

### Required

```env
AUTH_SECRET=your-secret-key
DATABASE_URL=file:./prisma/dev.db
```

### Optional

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
REDDIT_CLIENT_ID=your-id
REDDIT_CLIENT_SECRET=your-secret
```

---

## 📊 Monitoring

### Vercel Analytics

- Built-in performance monitoring
- Real-time error tracking
- Usage analytics

### PM2 Monitoring

```bash
# View logs
pm2 logs reddit-reel-ai

# Monitor resources
pm2 monit

# View status
pm2 status
```

---

## 🔄 Continuous Deployment

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 🚨 Troubleshooting

### Build Fails

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Database Issues

```bash
# Reset database
npx prisma db push --force-reset

# View database
npx prisma studio
```

### Memory Issues

- Increase instance size
- Enable swap space
- Optimize images

### Slow Performance

- Enable caching
- Optimize database queries
- Use CDN for static assets

---

## 📋 Pre-Deployment Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] SSL certificate configured
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Error tracking setup

---

## 🆘 Support

For deployment issues:
1. Check logs: `pm2 logs` or Vercel dashboard
2. Review error messages
3. Check environment variables
4. Verify database connection
5. Open an issue on GitHub

---

**Happy deploying! 🚀**
