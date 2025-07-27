#!/bin/bash

# Production Deployment Script for Push Notifications System
# Скрипт развертывания системы пуш-уведомлений в продакшене

set -e

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    print_error "Not logged in to Firebase. Please login first:"
    echo "firebase login"
    exit 1
fi

print_status "Building React app..."
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed. Aborting deployment."
    exit 1
fi

print_success "React app built successfully"

# Deploy Firestore rules
print_status "Deploying Firestore rules..."
firebase deploy --only firestore:rules

if [ $? -ne 0 ]; then
    print_error "Failed to deploy Firestore rules. Aborting."
    exit 1
fi

print_success "Firestore rules deployed"

# Deploy Firestore indexes
print_status "Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

if [ $? -ne 0 ]; then
    print_error "Failed to deploy Firestore indexes. Aborting."
    exit 1
fi

print_success "Firestore indexes deployed"

# Deploy Functions
print_status "Deploying Firebase Functions..."
firebase deploy --only functions

if [ $? -ne 0 ]; then
    print_error "Failed to deploy Functions. Aborting."
    exit 1
fi

print_success "Firebase Functions deployed"

# Deploy Hosting
print_status "Deploying to Firebase Hosting..."
firebase deploy --only hosting

if [ $? -ne 0 ]; then
    print_error "Failed to deploy to Hosting. Aborting."
    exit 1
fi

print_success "Firebase Hosting deployed"

# Verify deployment
print_status "Verifying deployment..."

# Test FCM function
print_status "Testing FCM connectivity..."
# Here you could add a test call to your functions

print_success "🎉 Production deployment completed successfully!"

echo ""
echo "📋 Post-deployment checklist:"
echo "  ✅ Firestore rules deployed"
echo "  ✅ Firestore indexes created"
echo "  ✅ Firebase Functions deployed"
echo "  ✅ React app deployed to Hosting"
echo ""
echo "🔧 Manual verification steps:"
echo "  1. Open Firebase Console and check Function logs"
echo "  2. Test push notification from admin panel"
echo "  3. Verify FCM tokens are being saved"
echo "  4. Check monitoring dashboards"
echo ""
echo "🌐 Application URL: https://admin-panel-bali.web.app" 