# Azure DevOps Self-Hosted Agent — Complete Guide

## What Was Set Up On Your Machine

| Item | Value |
|------|-------|
| **Agent Name** | `boutique-local-agent` |
| **Agent Version** | v5.278.0 |
| **Pool** | `Default` |
| **Agent Folder** | `~/azagent` (`/home/vboxuser/azagent`) |
| **Service Name** | `azure-agent.service` (systemd user service) |
| **Work Folder** | `~/azagent/_work` |
| **Azure Org** | `https://dev.azure.com/makkenamqmb` |

---

## How It Was Set Up (Step by Step)

### Step 1 — Got the Download URL
We used the Azure DevOps REST API to find the latest agent download URL:
```bash
curl -s "https://dev.azure.com/makkenamqmb/_apis/distributedtask/packages/agent?platform=linux-x64&top=1&api-version=6.0-preview" \
  -H "Authorization: Basic <base64-encoded-PAT>"
```

### Step 2 — Downloaded the Agent
```bash
mkdir ~/azagent && cd ~/azagent
curl -fSL "https://download.agent.dev.azure.com/agent/5.278.0/vsts-agent-linux-x64-5.278.0.tar.gz" -o agent.tar.gz
tar zxf agent.tar.gz
```

### Step 3 — Configured the Agent (Registered with Azure DevOps)
```bash
cd ~/azagent
./config.sh \
  --unattended \
  --url "https://dev.azure.com/makkenamqmb" \
  --auth pat \
  --token "<YOUR_PAT_TOKEN>" \
  --pool "Default" \
  --agent "boutique-local-agent" \
  --work "_work" \
  --replace
```
> Output: **"Successfully added the agent"** + **"Listening for Jobs"**

### Step 4 — Created a systemd User Service (Auto-start)
```bash
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/azure-agent.service << 'EOF'
[Unit]
Description=Azure DevOps Self-Hosted Agent (boutique-local-agent)
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/vboxuser/azagent
ExecStart=/home/vboxuser/azagent/run.sh
Restart=always
RestartSec=10
Environment=HOME=/home/vboxuser
Environment=USER=vboxuser

[Install]
WantedBy=default.target
EOF
```

### Step 5 — Enabled and Started It
```bash
systemctl --user daemon-reload
systemctl --user enable azure-agent   # auto-start on login
systemctl --user start azure-agent    # start now
```

### Step 6 — Updated All Pipeline YAMLs
Changed `vmImage: 'ubuntu-latest'` → `name: Default` in **7 files** across 2 repos:

**boutique-app:**
- `azure/templates/detect-changes.yml`
- `azure/templates/build-push.yml`
- `azure/templates/update-gitops.yml`

**boutique-infra:**
- `azure-pipelines-infra.yml`
- `azure/templates/terraform-deploy.yml`
- `azure/templates/terraform-destroy.yml`

Also fixed `sudo` issue — replaced `sudo apt install terraform` with `terraform version`
since Terraform is already installed on this machine.

---

## 🟢 START the Agent

### Option A — Using systemd (Recommended)
```bash
systemctl --user start azure-agent
```

### Option B — Run Manually (Foreground — shows live logs)
```bash
cd ~/azagent
./run.sh
```
> Press `Ctrl+C` to stop. Useful for debugging.

---

## 🔴 STOP the Agent

### Graceful Stop (waits for current job to finish)
```bash
systemctl --user stop azure-agent
```

### Force Kill (immediate)
```bash
systemctl --user kill azure-agent
```

---

## 🔁 RESTART the Agent

```bash
systemctl --user restart azure-agent
```
> Use this after changing the service file or agent config.

---

## 📋 CHECK STATUS

### Is it running?
```bash
systemctl --user status azure-agent
```
You'll see:
- `Active: active (running)` → ✅ Running
- `Active: inactive (dead)` → ❌ Stopped
- `Active: failed` → ❌ Crashed (check logs)

### Check Live Logs
```bash
# Last 50 lines
journalctl --user -u azure-agent -n 50 --no-pager

# Follow logs in real-time (like tail -f)
journalctl --user -u azure-agent -f
```

### Quick one-liner check
```bash
systemctl --user is-active azure-agent
```
Returns `active` or `inactive`.

---

## 🔄 ENABLE / DISABLE Auto-Start

### Enable auto-start on boot/login
```bash
systemctl --user enable azure-agent
```

### Disable auto-start
```bash
systemctl --user disable azure-agent
```

> **Note:** For systemd user services to auto-start even without logging in graphically, run:
> ```bash
> sudo loginctl enable-linger vboxuser
> ```

---

## ♻️ RECONFIGURE the Agent (New PAT / New Pool)

If your PAT expires or you want to change settings:

```bash
# Step 1 — Remove current registration
cd ~/azagent
./config.sh remove --unattended --auth pat --token "<OLD_OR_NEW_PAT>"

# Step 2 — Re-register with new details
./config.sh \
  --unattended \
  --url "https://dev.azure.com/makkenamqmb" \
  --auth pat \
  --token "<NEW_PAT>" \
  --pool "Default" \
  --agent "boutique-local-agent" \
  --work "_work" \
  --replace

# Step 3 — Restart service
systemctl --user restart azure-agent
```

---

## 🗑️ COMPLETELY REMOVE the Agent

```bash
# Stop and disable service
systemctl --user stop azure-agent
systemctl --user disable azure-agent

# Remove service file
rm ~/.config/systemd/user/azure-agent.service
systemctl --user daemon-reload

# Unregister from Azure DevOps
cd ~/azagent
./config.sh remove --unattended --auth pat --token "<YOUR_PAT>"

# Delete agent folder (optional)
rm -rf ~/azagent
```

---

## 🔍 VERIFY Agent in Azure DevOps Portal

1. Go to → `https://dev.azure.com/makkenamqmb`
2. Click **Project Settings** (bottom-left gear icon)
3. Click **Agent Pools** → **Default**
4. Click **Agents** tab
5. You should see `boutique-local-agent` with status:
   - 🟢 **Online** → Agent is running and ready
   - 🔴 **Offline** → Agent is stopped → run `systemctl --user start azure-agent`

---

## 🛠️ TROUBLESHOOTING

| Problem | Fix |
|---------|-----|
| Agent shows **Offline** in Azure DevOps | `systemctl --user start azure-agent` |
| `sudo: terminal required` error in pipeline | Tool is already installed — remove sudo install step |
| Agent **crashed** / failed | `journalctl --user -u azure-agent -n 100` to see why |
| PAT **expired** | Reconfigure with new PAT (see Reconfigure section above) |
| Pipeline job **stuck in queue** | Check agent is `active` and pool name matches pipeline YAML |
| Agent **won't start after reboot** | Run `sudo loginctl enable-linger vboxuser` |

---

## 📁 Important File Locations

| File / Folder | Purpose |
|---------------|---------|
| `~/azagent/` | Agent installation |
| `~/azagent/run.sh` | Manual start script |
| `~/azagent/config.sh` | Config/unregister script |
| `~/azagent/_work/` | Build workspace (all jobs run here) |
| `~/.config/systemd/user/azure-agent.service` | Service file |
| `~/.git-credentials` | Git auth (PAT stored here) |

---

## ⚡ Quick Reference Cheat Sheet

```bash
# Start
systemctl --user start azure-agent

# Stop
systemctl --user stop azure-agent

# Restart
systemctl --user restart azure-agent

# Status
systemctl --user status azure-agent

# Live logs
journalctl --user -u azure-agent -f

# Check if running (one word output)
systemctl --user is-active azure-agent
```

---

## ⚠️ Important Notes

- Your PC **must be ON and logged in** for pipelines to run.
- If you shut down or suspend the machine, the agent goes **offline** and pipeline jobs will queue until it comes back.
- The PAT token expires in **1 year** — reconfigure before it expires.
- Never commit PAT tokens to the repo — store them securely.
