#!/bin/bash
# EC2 user-data (cloud-init): installs Docker + nginx on Ubuntu 22.04/24.04.
# Runs once, as root, on first boot.
set -euxo pipefail

apt-get update -y
apt-get upgrade -y

apt-get install -y ca-certificates curl gnupg git

# Docker's official apt repo (newer + more reliable than Ubuntu's docker.io)
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker
usermod -aG docker ubuntu

apt-get install -y nginx
systemctl enable --now nginx

# Marker file so a deploy script can poll for cloud-init completion.
touch /home/ubuntu/user-data-complete
chown ubuntu:ubuntu /home/ubuntu/user-data-complete
