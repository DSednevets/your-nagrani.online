#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# 1. Push code to GitHub
echo "📤 Pushing to GitHub..."
git add .
git commit -m "Deploy update: $(date +%Y-%m-%d\ %H:%M:%S)" || true
git push origin main

# 2. SSH на сервер и деплой
echo "🔧 Deploying on server..."
ssh mila-deploy@161.35.216.172 << 'DEPLOY_SCRIPT'
  cd /home/mila-deploy/your-nagrani-online

  echo "📥 Pulling latest code..."
  git pull origin main

  echo "🛑 Stopping old container..."
  sudo docker stop your-nagrani-site || true
  sudo docker rm your-nagrani-site || true

  echo "🔨 Building new image..."
  sudo docker build -t your-nagrani:latest .

  echo "▶️  Starting new container..."
  sudo docker run -d \
    --env-file .env.production \
    -p 127.0.0.1:3000:3000 \
    --name your-nagrani-site \
    --restart always \
    your-nagrani:latest

  echo "✅ Container started!"
  sleep 2
  sudo docker logs your-nagrani-site | tail -20
DEPLOY_SCRIPT

echo "✨ Deployment completed!"
echo "🌐 Check: https://your-nagrani.online"
