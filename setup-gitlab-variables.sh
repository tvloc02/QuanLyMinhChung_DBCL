#!/bin/bash

# Script này giúp bạn thiết lập các CI/CD variables trong GitLab

echo "🔧 Thiết lập GitLab CI/CD Variables"
echo "===================================="
echo ""
echo "Vui lòng truy cập: https://gitlab.cmc-u.edu.vn/tvloc02/quanlyminhchung/-/settings/ci_cd"
echo ""
echo "Thêm các Variables sau (Protected & Masked):"
echo ""

variables=(
    "DEPLOY_SSH_KEY|SSH private key cho production server"
    "DEPLOY_SSH_KEY_STAGING|SSH private key cho staging server"
    "DEPLOY_USER|SSH username (e.g., deploy)"
    "DEPLOY_HOST|Production server IP/domain"
    "DEPLOY_HOST_STAGING|Staging server IP/domain"
    "DEPLOY_PATH|Path trên production server (e.g., /var/www/quanlyminhchung)"
    "DEPLOY_PATH_STAGING|Path trên staging server"
    "MONGODB_PASSWORD|MongoDB root password (mạnh)"
    "JWT_SECRET|JWT secret key (min 32 ký tự)"
    "REDIS_PASSWORD|Redis password (mạnh)"
    "REGISTRY|Docker registry (registry.gitlab.com)"
)

for var in "${variables[@]}"; do
    IFS='|' read -r name description <<< "$var"
    echo "✅ $name"
    echo "   📝 Mô tả: $description"
    echo ""
done

echo "Sau khi thêm tất cả variables, bạn có thể commit & push để chạy pipeline!"
