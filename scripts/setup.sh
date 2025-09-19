#!/bin/bash

# SafeHaven Connect - Development Setup Script
# This script sets up the development environment for the team

set -e

echo "🏠 SafeHaven Connect - Development Setup"
echo "======================================="

# Check Node.js version
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    echo "💡 Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    echo "💡 Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check npm version
echo "Checking npm version..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Setup shared types first
echo "Setting up shared types..."
cd shared
npm install
npm run build
cd ..

# Setup backend
echo "Setting up backend..."
cd backend
if [ ! -f .env ]; then
    cp ../.env.example .env
    echo "📝 Backend .env file created. Please configure AWS credentials."
fi
npm install
echo "🔧 Building backend..."
npm run build || echo "⚠️  Backend build failed - install dependencies first"
cd ..

# Setup mobile app
echo "Setting up mobile app..."
cd mobile
if [ ! -f .env ]; then
    cp ../.env.example .env
    echo "📝 Mobile .env file created."
fi
npm install
cd ..

# Setup dashboard
echo "Setting up dashboard..."
cd dashboard
if [ ! -f .env ]; then
    cp ../.env.example .env
    echo "📝 Dashboard .env file created."
fi
npm install
# Create index.css if it doesn't exist
if [ ! -f src/index.css ]; then
    echo "@tailwind base; @tailwind components; @tailwind utilities;" > src/index.css
fi
cd ..

echo ""
echo "🎉 Setup complete!"
echo ""
echo "⚠️  Important Setup Notes:"
echo "1. Configure AWS credentials: aws configure"
echo "2. Configure AWS credentials: aws configure (includes Location Service access)"
echo "3. For mobile development, install Expo CLI: npm install -g @expo/cli"
echo ""
echo "🚀 Quick Start Commands:"
echo "  npm run dev           - Start backend and dashboard"
echo "  npm run dev:mobile    - Start mobile app (requires Expo CLI)"
echo "  npm run build         - Build all applications"
echo "  npm run test          - Run all tests"
echo "  npm run deploy        - Deploy backend to AWS"
echo ""
echo "📚 Documentation:"
echo "  DEVELOPMENT.md        - Developer guide"
echo "  docs/README.md        - Complete documentation"
echo ""
echo "✅ Ready to start building! Good luck Team SaveHaven! 🏆"