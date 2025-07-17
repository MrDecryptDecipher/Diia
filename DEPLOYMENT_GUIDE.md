# 🚀 **OMNI Deployment Guide**

## 📋 **Prerequisites**

### 🖥️ **System Requirements**
- **OS**: Ubuntu 20.04 LTS or higher
- **RAM**: Minimum 2GB (4GB recommended)
- **CPU**: 1 vCPU (2 vCPU recommended)
- **Storage**: 60GB SSD
- **Network**: Public IP address for production

### 📦 **Software Dependencies**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install PM2 globally
sudo npm install -g pm2

# Install NGINX
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

## 🔧 **Installation Steps**

### 1️⃣ **Clone Repository**
```bash
# Clone the OMNI repository
git clone https://github.com/MrDecryptDecipher/Diia.git
cd Diia

# Verify repository structure
ls -la
```

### 2️⃣ **Install Dependencies**
```bash
# Install backend dependencies
cd ui/dashboard-backend
npm install

# Install frontend dependencies
cd ../dashboard
npm install

# Build Rust trading engine
cd ../../
cargo build --release
```

### 3️⃣ **Configure Environment**
```bash
# Create environment configuration
cp Webmcps.txt.example Webmcps.txt

# Edit configuration with your API keys
nano Webmcps.txt
```

**Required API Keys in Webmcps.txt:**
```
# Bybit Demo Trading API
BYBIT_API_KEY=your_bybit_api_key
BYBIT_SECRET=your_bybit_secret

# MCP Service Keys
EXA_SEARCH_API_KEY=your_exa_search_key
BROWSERBASE_API_KEY=your_browserbase_key
SCRAPEGRAPH_API_KEY=your_scrapegraph_key

# Social Media APIs
TWITTER_USERNAME=your_twitter_username
TWITTER_EMAIL=your_twitter_email
TWITTER_PASSWORD=your_twitter_password

# AI Services
GEMINI_API_KEY=your_gemini_api_key
```

### 4️⃣ **Build Frontend**
```bash
cd ui/dashboard
npm run build
```

### 5️⃣ **Configure PM2**
```bash
# Start services with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 6️⃣ **Configure NGINX**
```bash
# Copy NGINX configuration
sudo cp omni-nginx-corrected.conf /etc/nginx/sites-available/omni

# Enable the site
sudo ln -s /etc/nginx/sites-available/omni /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test NGINX configuration
sudo nginx -t

# Restart NGINX
sudo systemctl restart nginx
```

## 🌐 **Production Deployment**

### ☁️ **AWS Lightsail Setup**
```bash
# Create Lightsail instance
# - Choose Ubuntu 20.04 LTS
# - Select 2GB RAM, 1 vCPU plan
# - Configure networking (open ports 80, 443, 22)
# - Assign static IP address

# Connect to instance
ssh -i your-key.pem ubuntu@your-instance-ip
```

### 🔒 **Security Configuration**
```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Secure SSH (optional)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Set: PermitRootLogin no
sudo systemctl restart ssh
```

### 🔐 **SSL/TLS Setup (Optional)**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 **Service Management**

### 🔍 **Check Service Status**
```bash
# PM2 status
pm2 status

# NGINX status
sudo systemctl status nginx

# System resources
htop
df -h
free -h
```

### 📝 **View Logs**
```bash
# PM2 logs
pm2 logs
pm2 logs omni-api
pm2 logs omni-websocket
pm2 logs omni-grpc
pm2 logs omni-dashboard-frontend

# NGINX logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### 🔄 **Service Operations**
```bash
# Restart services
pm2 restart all
pm2 restart omni-api

# Stop services
pm2 stop all
pm2 stop omni-api

# Reload PM2 configuration
pm2 reload ecosystem.config.js

# Restart NGINX
sudo systemctl restart nginx
sudo systemctl reload nginx
```

## 🔧 **Troubleshooting**

### ❌ **Common Issues**

#### **Port Already in Use**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :10001

# Kill process using port
sudo kill -9 PID_NUMBER
```

#### **PM2 Services Not Starting**
```bash
# Check PM2 logs
pm2 logs

# Restart PM2 daemon
pm2 kill
pm2 start ecosystem.config.js
```

#### **NGINX Configuration Errors**
```bash
# Test NGINX configuration
sudo nginx -t

# Check NGINX error logs
sudo tail -f /var/log/nginx/error.log
```

#### **Memory Issues**
```bash
# Check memory usage
free -h

# Restart services to free memory
pm2 restart all
```

### 🔍 **Health Checks**
```bash
# Test API endpoints
curl http://localhost:10002/health
curl http://localhost:10002/api/system/status

# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:10003/socket.io/

# Test frontend
curl http://localhost:10001
```

## 📈 **Performance Optimization**

### ⚡ **System Optimization**
```bash
# Increase file descriptor limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize TCP settings
echo "net.core.somaxconn = 65536" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 🚀 **PM2 Optimization**
```bash
# Enable cluster mode for API server
pm2 start ecosystem.config.js --env production

# Monitor performance
pm2 monit

# Enable PM2 web monitoring
pm2 web
```

### 🌐 **NGINX Optimization**
```nginx
# Add to NGINX configuration
worker_processes auto;
worker_connections 1024;

# Enable gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔄 **Backup & Recovery**

### 💾 **Backup Strategy**
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/omni_app_$DATE.tar.gz \
    --exclude=node_modules \
    --exclude=target \
    --exclude=build \
    /home/ubuntu/Diia

# Backup PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 $BACKUP_DIR/pm2_dump_$DATE.pm2

# Backup NGINX configuration
sudo cp /etc/nginx/sites-available/omni $BACKUP_DIR/nginx_omni_$DATE.conf

echo "Backup completed: $DATE"
EOF

chmod +x backup.sh
```

### 🔄 **Automated Backups**
```bash
# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

## 📞 **Support & Monitoring**

### 📊 **Monitoring Setup**
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Setup log rotation
sudo nano /etc/logrotate.d/omni
```

### 🚨 **Alerting**
```bash
# Create monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
# Check if services are running
pm2 jlist | jq -r '.[] | select(.pm2_env.status != "online") | .name'

# Check disk space
df -h | awk '$5 > 80 {print "Disk usage warning: " $0}'

# Check memory usage
free | awk 'NR==2{printf "Memory usage: %.2f%%\n", $3*100/$2}'
EOF

chmod +x monitor.sh
```

### 📱 **Access URLs**
- **Frontend**: `http://your-server-ip:10001`
- **API Health**: `http://your-server-ip:10002/health`
- **PM2 Monitoring**: `http://your-server-ip:9615` (if enabled)
- **Live Demo**: `http://3.111.22.56:10001`

## ✅ **Deployment Checklist**

- [ ] System dependencies installed
- [ ] Repository cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Frontend built successfully
- [ ] PM2 services started and saved
- [ ] NGINX configured and running
- [ ] Firewall configured
- [ ] SSL certificate installed (production)
- [ ] Backup strategy implemented
- [ ] Monitoring setup completed
- [ ] Health checks passing
- [ ] Performance optimization applied

## 🎯 **Post-Deployment Verification**

```bash
# Verify all services are running
pm2 status
sudo systemctl status nginx

# Test API endpoints
curl http://your-server-ip:10002/health
curl http://your-server-ip:10002/api/system/status

# Check frontend accessibility
curl -I http://your-server-ip:10001

# Monitor logs for errors
pm2 logs --lines 50
```

**🎉 Congratulations! Your OMNI Super Intelligent Trading System is now deployed and ready for quantum-enhanced trading!**
