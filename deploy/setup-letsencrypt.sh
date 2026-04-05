#!/bin/bash
# =============================================================================
# Let's Encrypt 证书自动申请脚本
# =============================================================================
# 使用前提：
#   1. 已有真实域名（如 exam.example.com），DNS 已指向本服务器
#   2. 80 端口对外开放
#   3. 已安装 certbot: apt install certbot python3-certbot-nginx
#
# 使用方式：
#   ./setup-letsencrypt.sh exam.example.com
#
# 申请成功后会自动：
#   - 证书存放到 ./ssl/live/<domain>/
#   - 更新 nginx.conf 使用真实证书
#   - 重启 nginx 容器
# =============================================================================

set -e

DOMAIN="${1:-}"
EMAIL="${2:-admin@${DOMAIN:-example.com}}"

if [ -z "$DOMAIN" ]; then
    echo "用法: $0 <域名> [邮箱]"
    echo "示例: $0 exam.example.com admin@exam.example.com"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="${SCRIPT_DIR}/ssl"
CERT_DIR="${SSL_DIR}/live/${DOMAIN}"

echo "============================================"
echo " Let's Encrypt 证书申请"
echo " 域名: ${DOMAIN}"
echo " 邮箱: ${EMAIL}"
echo "============================================"

# 检查 certbot
if ! command -v certbot &> /dev/null; then
    echo "[ERROR] certbot 未安装"
    echo "安装命令: apt install certbot python3-certbot-nginx"
    exit 1
fi

# 检查 80 端口是否可用
if ! nc -z 127.0.0.1 80 2>/dev/null; then
    echo "[WARN] 80 端口未被占用，确保证书申请前 nginx 已启动"
else
    echo "[INFO] 80 端口已被占用（可能是 nginx）"
fi

# 申请证书（standalone 模式，nginx 需先暂停）
echo "[STEP 1] 暂停 nginx..."
docker stop exam-nginx 2>/dev/null || true

echo "[STEP 2] 申请 Let's Encrypt 证书..."
certbot certonly \
    --standalone \
    --preferred-challenges http-01 \
    --domains "${DOMAIN}" \
    --email "${EMAIL}" \
    --agree-tos \
    --no-eff-email \
    --keep-until-expiring \
    -d "${DOMAIN}"

# 证书路径
FULLCHAIN="${CERT_DIR}/fullchain.pem"
PRIVKEY="${CERT_DIR}/privkey.pem"

if [ ! -f "$FULLCHAIN" ] || [ ! -f "$PRIVKEY" ]; then
    echo "[ERROR] 证书申请失败，文件不存在"
    exit 1
fi

echo "[STEP 3] 链接证书到 ssl/ 目录..."
mkdir -p "${SSL_DIR}"
ln -sf "${CERT_DIR}/fullchain.pem" "${SSL_DIR}/tls.crt"
ln -sf "${CERT_DIR}/privkey.pem" "${SSL_DIR}/tls.key"
chmod -s "${SSL_DIR}/tls.key" 2>/dev/null || true

echo "[STEP 4] 更新 nginx.conf 的 HTTPS server_name..."
sed -i "s/server_name exam.local localhost;/server_name ${DOMAIN};/" "${SCRIPT_DIR}/nginx.conf"
sed -i "s/ALLOWED_ORIGINS:-localhost/ALLOWED_ORIGINS:-${DOMAIN}/" "${SCRIPT_DIR}/nginx.conf"

echo "[STEP 5] 启动 nginx..."
docker start exam-nginx

echo "[STEP 6] 启用 HTTP → HTTPS 重定向（取消注释）..."
sed -i 's/# return 301 https:\/\/\$host\$request_uri;/return 301 https:\/\/$host$request_uri;/' "${SCRIPT_DIR}/nginx.conf"
docker restart exam-nginx

echo ""
echo "============================================"
echo " ✅ Let's Encrypt 证书配置完成"
echo " 域名: ${DOMAIN}"
echo " 证书: ${CERT_DIR}"
echo " HTTPS: https://${DOMAIN}"
echo ""
echo " 注意：证书有效期 90 天，certbot 会自动添加 cron 续期任务"
echo " 手动续期: certbot renew"
echo "============================================"
