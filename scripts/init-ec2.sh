#!/bin/bash
# LUMIX OS - EC2 Initialization Script
# This script installs Docker and Docker Compose on a fresh Ubuntu instance.

echo "--- Updating System ---"
sudo apt-get update && sudo apt-get upgrade -y

echo "--- Installing Docker ---"
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "--- Installing Docker Compose ---"
sudo apt-get install -y docker-compose

echo "--- Configuring User ---"
sudo usermod -aG docker $USER

echo "--- Setup Complete ---"
echo "Please log out and log back in for docker group changes to take effect."
