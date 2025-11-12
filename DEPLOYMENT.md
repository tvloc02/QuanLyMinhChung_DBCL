# Hướng Dẫn Deploy GitLab CI/CD

## 📋 Yêu Cầu Trước Deploy

### 1. Chuẩn Bị GitLab Variables
Truy cập: `https://gitlab.cmc-u.edu.vn/tvloc02/quanlyminhchung/-/settings/ci_cd`

**Protected Variables** (Dùng cho Production):
- `DEPLOY_SSH_KEY` - Private SSH key (protected)
- `DEPLOY_USER` - SSH username
- `DEPLOY_HOST` - Server IP/Domain
- `DEPLOY_PATH` - App path on server
- `MONGODB_PASSWORD` - Strong password
- `JWT_SECRET` - Minimum 32 characters
- `REDIS_PASSWORD` - Strong password

**Non-Protected Variables** (Dùng cho cả Staging & Production):
- `REGISTRY` - Docker registry URL
- `IMAGE_BACKEND` - Backend image path
- `IMAGE_FRONTEND` - Frontend image path

### 2. Chuẩn Bị Server

#### SSH Key Setup
```bash
# Trên local machine, generate SSH key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/deploy_key -N ""

# Copy public key sang server
ssh-copy-id -i ~/.ssh/deploy_key.pub deploy_user@server_ip

# Lấy private key (copy vào GitLab Variable DEPLOY_SSH_KEY)
cat ~/.ssh/deploy_key
```

#### Server Preparation
```bash
# SSH vào server
ssh deploy_user@server_ip

# Tạo directories
sudo mkdir -p /var/www/quanlyminhchung/{uploads,logs,ssl}
sudo chown -R deploy_user:deploy_user /var/www/quanlyminhchung

# Clone repository
cd /var/www/quanlyminhchung
git clone git@gitlab.cmc-u.edu.vn:tvloc02/quanlyminhchung.git .

# Chuẩn bị .env
cp .env.prod .env

# Chỉnh sửa .env với giá trị thực
nano .env

# SSL certificates (nếu không có)
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes

# Test Docker
docker --version
docker-compose --version
```

---

## 🚀 Quy Trình Deploy

### Staging Deploy (Manual)
1. Commit code lên branch `develop`
   ```bash
   git add .
   git commit -m "feat: new feature"
   git push origin develop
   ```

2. Vào GitLab → CI/CD → Pipelines
3. Tìm pipeline cho develop branch
4. Click **"Deploy to Staging"** button (manual trigger)
5. Kiểm tra logs: `docker-compose -f docker-compose.prod.yml logs -f backend`

### Production Deploy (Manual)
1. Tạo Merge Request: `develop` → `main`
2. Review & Merge
3. Tag version (optional but recommended):
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```
4. Vào GitLab → CI/CD → Pipelines
5. Click **"Deploy to Production"** button

---

## 📊 Pipeline Stages

