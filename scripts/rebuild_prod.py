import os
import sys
import time

import paramiko

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(
    os.environ["DEPLOY_HOST"],
    username=os.environ["DEPLOY_USER"],
    password=os.environ["DEPLOY_PASS"],
    timeout=30,
)
client.get_transport().set_keepalive(30)
cmd = """
set -euo pipefail
cd /var/www/elenapsiholog
export NODE_OPTIONS=--max-old-space-size=1536
npm run build
pm2 restart elenapsiholog --update-env
echo REBUILD_OK
"""
stdin, stdout, stderr = client.exec_command(cmd, timeout=600, get_pty=True)
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
