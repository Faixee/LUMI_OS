#!/bin/bash
# LUMIX OS - EC2 Provisioning Script
# This script automates the setup of an AWS EC2 instance for the backend.
# Usage: ./setup-ec2.sh <region> <instance-type> <key-name>

REGION=${1:-"us-east-1"}
INSTANCE_TYPE=${2:-"t3.medium"}
KEY_NAME=$3

if [ -z "$KEY_NAME" ]; then
    echo "Error: KEY_NAME is required."
    echo "Usage: ./setup-ec2.sh <region> <instance-type> <key-name>"
    exit 1
fi

echo "--- 1. Creating Security Group ---"
SG_ID=$(aws ec2 create-security-group \
    --group-name "lumix-backend-sg" \
    --description "Security group for LUMIX OS Backend" \
    --region $REGION \
    --query 'GroupId' \
    --output text)

echo "Security Group Created: $SG_ID"

# Allow SSH
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 22 \
    --cidr 0.0.0.0/0 \
    --region $REGION

# Allow Backend Port (8000)
aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID \
    --protocol tcp \
    --port 8000 \
    --cidr 0.0.0.0/0 \
    --region $REGION

echo "--- 2. Launching EC2 Instance ---"
# Using Ubuntu 22.04 LTS AMI (may vary by region)
AMI_ID=$(aws ec2 describe-images \
    --owners 099720109477 \
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --region $REGION \
    --output text)

echo "Using AMI: $AMI_ID"

INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SG_ID \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo "Instance Launched: $INSTANCE_ID"

echo "Waiting for instance to be running..."
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo "--- Setup Complete ---"
echo "Instance ID: $INSTANCE_ID"
echo "Public IP: $PUBLIC_IP"
echo ""
echo "Next Steps:"
echo "1. SSH into your instance: ssh -i $KEY_NAME.pem ubuntu@$PUBLIC_IP"
echo "2. Run the initialization script: curl -s https://raw.githubusercontent.com/Faixee/LUMI_OS/main/scripts/init-ec2.sh | bash"
echo "3. Update your Vercel VITE_API_URL environment variable to: http://$PUBLIC_IP:8000"
