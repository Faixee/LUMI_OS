#!/bin/bash
# LUMIX OS - Deployment Script for EC2

echo "--- Pulling latest changes ---"
git pull origin main

echo "--- Building and starting containers ---"
docker-compose -f docker-compose.backend.yml up -d --build

echo "--- Deployment Complete ---"
docker-compose -f docker-compose.backend.yml ps
