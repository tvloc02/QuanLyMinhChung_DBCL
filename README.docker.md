# Docker Deployment Guide - Quản Lý Minh Chứng

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- Git
- SSH access to production server (for deployment)

## Local Development

### 1. Setup Environment
\`\`\`bash
cp .env.example .env.local
\`\`\`

### 2. Start Services
\`\`\`bash
docker-compose up -d
\`\`\`

### 3. Initialize Database
\`\`\`bash
docker-compose exec backend npm run migrate
\`\`\`

### 4. View Logs
\`\`\`bash
docker-compose logs -f backend
\`\`\`

### 5. Stop Services
\`\`\`bash
docker-compose down
\`\`\`

## Production Deployment

### 1. Setup Production Server

\`\`\`bash
# SSH into your server
ssh user@your_server_ip

# Create app directory
sudo mkdir -p /var/www/quanlyminhchung
sudo chown $USER:$USER /var/www/quanlyminhchung

# Clone repository
cd /var/www/quanlyminhchung
git clone git@gitlab.cmc-u.edu.vn:tvloc02/quanlyminhchung.git .

# Setup SSL certificates
mkdir -p ssl
# Copy your SSL certificates to ssl/ folder
# Or generate self-signed: openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes
\`\`\`

### 2. Configure Environment
\`\`\`bash
cp .env.prod /var/www/quanlyminhchung/
# Edit .env.prod with production values
nano .env.prod
\`\`\`

### 3. Setup GitLab Runner (Optional)

For automatic deployments on push to \`main\` branch.

\`\`\`bash
# Install GitLab Runner
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt-get install gitlab-runner

# Register runner
sudo gitlab-runner register \\
  --url https://gitlab.cmc-u.edu.vn/ \\
  --registration-token YOUR_TOKEN \\
  --executor docker \\
  --docker-image alpine:latest
\`\`\`

### 4. Deploy Using GitLab CI/CD

Push to main branch and GitLab will automatically:
1. Build Docker image
2. Push to registry
3. Deploy to production (if \`deploy\` stage is run manually)

### 5. Manual Deployment

\`\`\`bash
cd /var/www/quanlyminhchung

# Pull latest changes
git pull origin main

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend
\`\`\`

## Docker Images

### Available Images

- **Backend**: Node.js API server
- **MongoDB**: Document database
- **Redis**: Caching layer
- **Nginx**: Reverse proxy & SSL termination

## Useful Commands

### Database Operations

\`\`\`bash
# Backup MongoDB
docker-compose exec mongodb mongodump --archive=/data/backup.archive

# Restore MongoDB
docker-compose exec mongodb mongorestore --archive=/data/backup.archive

# MongoDB Shell
docker-compose exec mongodb mongosh -u root -p password
\`\`\`

### Container Management

\`\`\`bash
# View container logs
docker-compose logs -f backend

# Execute command in container
docker-compose exec backend npm run seed

# Rebuild image
docker-compose build --no-cache

# Remove all volumes
docker-compose down -v
\`\`\`

### Health Check

\`\`\`bash
# Check service health
curl http://localhost:5000/health

# Check all services
docker-compose ps
\`\`\`

## Troubleshooting

### Port already in use
\`\`\`bash
# Change port in docker-compose.yml or .env
lsof -i :5000  # Find process using port
\`\`\`

### MongoDB connection error
\`\`\`bash
# Check MongoDB logs
docker-compose logs mongodb

# Verify MongoDB is running
docker-compose exec mongodb mongosh -u root -p password --eval "db.adminCommand('ping')"
\`\`\`

### File permissions
\`\`\`bash
# Fix uploads directory permissions
sudo chown -R 1001:1001 uploads/
sudo chmod -R 755 uploads/
\`\`\`

## Security Best Practices

1. **Environment Variables**: Never commit .env files with real secrets
2. **SSL/TLS**: Always use HTTPS in production
3. **MongoDB**: Change default credentials
4. **Redis**: Set strong password
5. **Firewall**: Restrict ports to necessary services only
6. **Backup**: Regular database backups
7. **Logs**: Monitor logs for suspicious activity

## Performance Optimization

1. **Enable Gzip compression** (already in nginx.conf)
2. **Implement caching** with Redis
3. **Use connection pooling** for MongoDB
4. **Monitor resource usage**:
   \`\`\`bash
   docker stats
   \`\`\`

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)
