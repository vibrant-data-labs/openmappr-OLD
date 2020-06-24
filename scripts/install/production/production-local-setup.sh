#!/bin/bash
#
#                 The only thing you need to install here is cURL.
#                          `sudo apt install curl -y`
#
#
#
# Get all updates (unattended)
export DEBIAN_FRONTEND=noninteractive
export DEBIAN_PRIORITY=critical
sudo -E apt-get -qy update
sudo -E apt-get -qy -o "Dpkg::Options::=--force-confdef" -o "Dpkg::Options::=--force-confold" upgrade
sudo -E apt-get -qy autoclean
# remove old versions of docker dependencies
apt remove docker docker-engine docker.io containerd runc -y
# Install dependencies
apt update -y
# Install docker
## curl -fsSL https://get.docker.com -o get-docker.sh
## sh get-docker.sh
curl -fsSL https://get.docker.com -o get-docker.sh &&
sudo sh get-docker.sh &&
rm -rf get-docker.sh
# Install docker-compose
curl -L "https://github.com/docker/compose/releases/download/1.25.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
# Start Docker automatically
sudo systemctl start docker && sudo systemctl enable docker
###
# Install NGINX
sudo apt remove nginx nginx-common nginx-full nginx-core &&
sudo add-apt-repository ppa:nginx/stable &&
sudo apt update -y &&
sudo apt install nginx -y
# Enable and Start NGINX
sudo systemctl start nginx && sudo systemctl enable nginx
read -p 'Please enter your domain name as "example.com", "sub.example.com" or "*.example.com": ' nginx_conf_domain
# Set NGNX self-signed certificates
### CHANGE --- old part --- TO BE DELETED ### openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout \
### CHANGE --- old part --- TO BE DELETED ### /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt
### CHANGE --- below is the (openssl) slef-signed cert NO PROMPT script
openssl req -new -newkey rsa:4096 -days 3650 -nodes -x509 -subj "/C=US/ST=SelfSigned/L=Springfield/O=Dis/CN=self-signed.xyz" -keyout /etc/nginx/nginx-selfsigned.key -out /etc/nginx/nginx-selfsigned.crt 
# Generate a strong key
openssl dhparam -out /etc/nginx/dhparam.pem 4096
# Create Params file with
# Create directory, -p 
sudo mkdir -p /etc/nginx/snippets/
sudo touch /etc/nginx/snippets/ssl-params.conf
# Create Params file with
# Create directory, -p 
sudo mkdir -p /etc/nginx/snippets/
### CHANGE --- No ned it since we will create with with 'cat 'EOF' later
#sudo touch /etc/nginx/snippets/ssl-params.conf
# Add in Parameters
### CHANGE --- made >> to > since will be new file
cat <<EOT > /etc/nginx/snippets/ssl-params.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_dhparam /etc/nginx/dhparam.pem;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
ssl_ecdh_curve secp384r1; # Requires nginx >= 1.1.0
ssl_session_timeout  10m;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off; # Requires nginx >= 1.5.9
ssl_stapling on; # Requires nginx >= 1.3.7
ssl_stapling_verify on; # Requires nginx => 1.3.7
resolver 1.1.1.1 1.0.0.1 valid=300s;
resolver_timeout 5s;
# We use Cloudflare for strict transport.
# add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
EOT
# Create NGINX domain 
sudo mkdir -p /etc/nginx/sites-available/
### CHANGE --- no need because we will create this file with EOF ### sudo touch /etc/nginx/sites-available/openmappr.conf
# Prompt for Domain
### CHANGE --- prompt (below) for domain moved before setting thee conf
#read -p 'Please enter your domain name as "example.com", "sub.example.com" or "*.example.com": ' nginx_conf_domain
# check the domain is valid!
### CHANGE #### to be remooved ### PATTERN="^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$";
PATTERN="^((\*)|((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|((\*\.)?([a-zA-Z0-9-]+\.){0,5}[a-zA-Z0-9-][a-zA-Z0-9-]+\.[a-zA-Z]{2,63}?))$"
if [[ "$nginx_conf_domain" =~ $PATTERN ]]; then
	nginx_conf_domain=`echo $nginx_conf_domain | tr '[A-Z]' '[a-z]'`
### CHANGE --- I've edited the EOT as EOF as more common and also templated it as @@@nginx_conf_domain@@@ and added sed to replace the nginx_conf_domain with the value it should be
cat <<'EOF' > /etc/nginx/sites-available/openmappr.conf
server {
listen 80;
listen [::]:80;
server_name @@@nginx_conf_domain@@@;
# force to https
if ($scheme = http) {
    return 301 https://$host$request_uri;  
}
}
server {
listen 443 ssl http2;
listen  [::]:443 ssl http2;
server_name @@@nginx_conf_domain@@@;
# ssl configuration
### CHANGE --- remove "ssl on;"
client_max_body_size 100M;
#ssl on;
ssl_certificate /etc/nginx/nginx-selfsigned.crt; 
ssl_certificate_key /etc/nginx/nginx-selfsigned.key;
include snippets/ssl-params.conf;
access_log /var/log/nginx/openmappr-access.log;
error_log /var/log/nginx/openmappr-error.log warn;
location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_pass http://127.0.0.1:8080;
}
}
EOF
# Replacing 
sed -i "s/@@@nginx_conf_domain@@@/${nginx_conf_domain}/g" /etc/nginx/sites-available/openmappr.conf
else
	echo "invalid domain name"
	exit 1
fi
# Create a symlink
ln -s /etc/nginx/sites-available/openmappr.conf /etc/nginx/sites-enabled/openmappr.conf
# Reload NGINX
service nginx restart
# Start Watchtower for automatic upgrades
docker run -d --restart=always --name watchtower -v \
/var/run/docker.sock:/var/run/docker.sock containrrr/watchtower
# Clone openMappr repo
git clone https://github.com/selfhostedworks/openmappr
cd openmappr
# Grab environment from user
read -p 'Please enter your environment (latest,staging,etc): ' environ
cp .env.sample .env
sed -i "s/ENVIRONMENT=latest/ENVIRONMENT=${environ}/g" .env
# Start server
docker-compose up -d
