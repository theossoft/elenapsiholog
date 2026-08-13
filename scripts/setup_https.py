import os
import sys
import time

import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

HOST = os.environ["DEPLOY_HOST"]
USER = os.environ["DEPLOY_USER"]
PASSWORD = os.environ["DEPLOY_PASS"]

PUNYCODE = "xn--80ageaqpdnlbhy7c.xn--p1ai"
SITE_URL = "https://еленапсихолог.рф"

REMOTE = f"""
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y certbot python3-certbot-nginx

python3 - << 'PY'
from pathlib import Path
p = Path("/var/www/elenapsiholog/.env")
text = p.read_text(encoding="utf-8")
lines = []
for line in text.splitlines():
    if line.startswith("NEXTAUTH_URL="):
        lines.append('NEXTAUTH_URL="{SITE_URL}"')
    elif line.startswith("NEXT_PUBLIC_SITE_URL="):
        lines.append('NEXT_PUBLIC_SITE_URL="{SITE_URL}"')
    else:
        lines.append(line)
p.write_text("\\n".join(lines) + "\\n", encoding="utf-8")
print(p.read_text(encoding="utf-8"))
PY

cat > /etc/nginx/sites-available/elenapsiholog << 'NGX'
server {{
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name {PUNYCODE} www.{PUNYCODE} еленапсихолог.рф www.еленапсихолог.рф 72.56.9.221 _;

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

certbot --nginx -d {PUNYCODE} --non-interactive --agree-tos --redirect \\
  --email elena-9081294116@yandex.ru --keep-until-expiring

pm2 restart elenapsiholog --update-env
sleep 2
pm2 status
curl -sI https://{PUNYCODE} | head -n 12
echo HTTPS_OK
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
err = stderr.read()
if rest:
    sys.stdout.buffer.write(rest)
if err:
    sys.stderr.buffer.write(err)

code = stdout.channel.recv_exit_status()
client.close()
print(f"\nEXIT={code}")
sys.exit(code)
