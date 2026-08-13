import os
import sys
import time

import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ["DEPLOY_HOST"]
USER = os.environ["DEPLOY_USER"]
PASSWORD = os.environ["DEPLOY_PASS"]

RF = "xn--80ageaqpdnlbhy7c.xn--p1ai"

REMOTE = f"""
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

cat > /etc/nginx/sites-available/elenapsiholog << 'NGX'
server {{
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name elenapsiholog.ru www.elenapsiholog.ru {RF} www.{RF} 72.56.9.221 _;

    location /.well-known/acme-challenge/ {{
        root /var/www/html;
    }}

    location / {{
        return 301 https://{RF}$request_uri;
    }}
}}
NGX

mkdir -p /var/www/html
nginx -t
systemctl reload nginx

certbot certonly --nginx -d elenapsiholog.ru -d www.elenapsiholog.ru \\
  --non-interactive --agree-tos --email elena-9081294116@yandex.ru \\
  --keep-until-expiring --expand

cat > /etc/nginx/sites-available/elenapsiholog << 'NGX'
server {{
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name elenapsiholog.ru www.elenapsiholog.ru {RF} www.{RF} 72.56.9.221 _;

    location /.well-known/acme-challenge/ {{
        root /var/www/html;
    }}

    location / {{
        return 301 https://{RF}$request_uri;
    }}
}}

server {{
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name elenapsiholog.ru www.elenapsiholog.ru;

    ssl_certificate /etc/letsencrypt/live/elenapsiholog.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/elenapsiholog.ru/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    return 301 https://{RF}$request_uri;
}}

server {{
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name {RF} www.{RF};

    ssl_certificate /etc/letsencrypt/live/{RF}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{RF}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 8m;

    location / {{
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
    }}
}}
NGX

nginx -t
systemctl reload nginx
curl -sI -H "Host: elenapsiholog.ru" http://127.0.0.1 | head -n 8
curl -sI https://elenapsiholog.ru | head -n 12
echo REDIRECT_OK
"""

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASSWORD, timeout=30)
client.get_transport().set_keepalive(30)
stdin, stdout, stderr = client.exec_command(REMOTE, timeout=300, get_pty=True)
stdin.close()
while not stdout.channel.exit_status_ready():
    chunk = stdout.channel.recv(4096)
    if chunk:
        sys.stdout.buffer.write(chunk)
        sys.stdout.buffer.flush()
    else:
        time.sleep(0.3)
rest = stdout.read()
if rest:
    sys.stdout.buffer.write(rest)
code = stdout.channel.recv_exit_status()
client.close()
print(f"\nEXIT={code}")
sys.exit(code)
