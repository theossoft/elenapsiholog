import os
import secrets
import sys
import time

import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ["DEPLOY_HOST"]
USER = os.environ["DEPLOY_USER"]
PASSWORD = os.environ["DEPLOY_PASS"]

ADMIN_PASSWORD = secrets.token_urlsafe(14)
NEXTAUTH_SECRET = secrets.token_hex(32)
SITE_URL = f"http://{HOST}"

REMOTE_SCRIPT = r"""
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
dpkg --configure -a || true

if ! swapon --show | grep -q swapfile; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

apt-get update -y
apt-get install -y nginx git curl ca-certificates ufw

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

node -v
npm -v

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

mkdir -p /var/www
if [ ! -d /var/www/elenapsiholog/.git ]; then
  rm -rf /var/www/elenapsiholog
  git clone https://github.com/theossoft/elenapsiholog.git /var/www/elenapsiholog
else
  git -C /var/www/elenapsiholog fetch origin
  git -C /var/www/elenapsiholog reset --hard origin/main
fi

cat > /var/www/elenapsiholog/.env << 'ENVEOF'
__ENV_BODY__
ENVEOF

cd /var/www/elenapsiholog
export NODE_OPTIONS=--max-old-space-size=1536
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run build

pm2 delete elenapsiholog >/dev/null 2>&1 || true
pm2 start npm --name elenapsiholog --cwd /var/www/elenapsiholog -- start
pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

cat > /etc/nginx/sites-available/elenapsiholog << 'NGX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name 72.56.9.221 elenapsiholog.ru www.elenapsiholog.ru _;

    client_max_body_size 8m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
NGX

rm -f /etc/nginx/sites-enabled/default
ln -sfn /etc/nginx/sites-available/elenapsiholog /etc/nginx/sites-enabled/elenapsiholog
nginx -t
systemctl enable nginx
systemctl restart nginx

ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

pm2 status
curl -sI http://127.0.0.1:3000 | head -n 5
echo DEPLOY_OK
"""

env_body = f"""DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="{NEXTAUTH_SECRET}"
NEXTAUTH_URL="{SITE_URL}"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="{ADMIN_PASSWORD}"
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
NEXT_PUBLIC_SITE_URL="{SITE_URL}"
NEXT_PUBLIC_METRIKA_ID=""
YANDEX_VERIFICATION=""
"""

script = REMOTE_SCRIPT.replace("__ENV_BODY__", env_body.strip())

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
transport = client.get_transport()
transport.set_keepalive(30)

stdin, stdout, stderr = client.exec_command(script, timeout=900, get_pty=True)
stdin.close()

while not stdout.channel.exit_status_ready():
    chunk = stdout.channel.recv(4096)
    if chunk:
        sys.stdout.buffer.write(chunk)
        sys.stdout.buffer.flush()
    else:
        time.sleep(0.3)

rest = stdout.read().decode("utf-8", errors="replace")
err = stderr.read().decode("utf-8", errors="replace")
if rest:
    print(rest)
if err:
    print(err, file=sys.stderr)

code = stdout.channel.recv_exit_status()
client.close()

print("\n---CREDENTIALS---")
print(f"SITE={SITE_URL}")
print(f"ADMIN_USER=admin")
print(f"ADMIN_PASSWORD={ADMIN_PASSWORD}")
print(f"EXIT={code}")
sys.exit(code)
