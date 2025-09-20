# SafeHaven Connect - Developer Quick Start Guide

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange.svg)](https://aws.amazon.com/)
[![FirstNet](https://img.shields.io/badge/FirstNet-Compatible-blue.svg)](https://www.firstnet.com/)
[![Hackathon](https://img.shields.io/badge/Breaking%20Barriers-2025-green.svg)]()

> **⚡ Quick Start for Hackathon Teams**  
> *Get your development environment running in under 10 minutes*

## 🚀 Instant Setup

```bash
# Clone and setup everything
git clone https://github.com/49115566/SafeHaven.git
cd SafeHaven
./scripts/setup.sh

# Start developing immediately
npm run dev
```

## 📁 Project Structure

```
SafeHaven/
├── 📱 mobile/           # React Native app (Shelter operators)
├── 🌐 dashboard/        # React web app (First responders)
├── ⚡ backend/          # AWS serverless backend
├── 🔄 shared/          # Shared TypeScript types
├── 📚 docs/            # Documentation
└── 🛠️ scripts/         # Build and deployment scripts
```

## 🎯 Team Workflow

### For Backend Developers
```bash
cd backend
npm run dev          # Start serverless offline
npm run deploy:dev   # Deploy to AWS dev environment
npm test            # Run backend tests
```

### For Mobile Developers  
```bash
cd mobile
npm run start       # Start Expo dev server
npm run ios         # Run on iOS simulator
npm run android     # Run on Android emulator
```

### For Frontend Developers
```bash
cd dashboard
npm start           # Start React dev server
npm run build       # Build for production
npm test           # Run frontend tests
```

## 🔧 Essential Configuration

### 1. Backend Setup
```bash
# Configure AWS credentials
aws configure

# Set environment variables
cp .env.example backend/.env
# Edit backend/.env with your AWS settings
```

### 2. Dashboard Setup
```bash
# Configure AWS Location Service (no separate API key needed)
cp ../.env.example .env

# AWS Location Service resources will be created automatically via serverless.yml
# Map Name: safehaven-backend-map-dev 
# Place Index: safehaven-backend-places-dev
```

### 3. Mobile Setup
```bash
# Configure API endpoints
cp .env.example mobile/.env
# Edit mobile/.env with backend URL
```

## 🎨 Component Library

### Mobile Components (React Native)
- `StatusUpdateCard` - Quick shelter status updates
- `ResourceMeter` - Visual resource level indicators  
- `EmergencyButton` - One-tap emergency alerts
- `OfflineIndicator` - Network status display

### Dashboard Components (React)
- `ShelterMap` - Interactive shelter map with pins
- `AlertPanel` - Real-time alert notifications
- `FilterControls` - Shelter filtering interface
- `StatusDashboard` - Overview metrics display

## 📡 API Endpoints

### Authentication
```typescript
POST /auth/login
POST /auth/register
```

### Shelters
```typescript
GET  /shelters              # List all shelters
POST /shelters              # Create shelter
GET  /shelters/:id          # Get shelter details
PUT  /shelters/:id/status   # Update shelter status
```

### Alerts
```typescript
GET  /alerts               # List alerts
POST /alerts               # Create alert
PUT  /alerts/:id/ack       # Acknowledge alert
```

## 🔄 Real-time Features

### WebSocket Events
```typescript
// Shelter status updates
ws.on('SHELTER_UPDATE', (shelter) => {
  // Update UI with new shelter data
});

// Emergency alerts
ws.on('ALERT', (alert) => {
  // Show critical alert notification
});
```

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test                 # Run all tests
npm run test:backend     # Backend only
npm run test:mobile      # Mobile only
npm run test:dashboard   # Dashboard only
```

### Integration Tests
```bash
npm run test:integration # E2E testing
```

## 🚀 Deployment

### Development
```bash
npm run deploy:dev      # Deploy to dev environment
```

### Production
```bash
npm run deploy          # Deploy to production
```

## 🛠️ Troubleshooting

### Common Issues

**Backend won't start?**
```bash
# Check AWS credentials
aws sts get-caller-identity

# Install dependencies
cd backend && npm install
```

**Mobile app crashes?**
```bash
# Clear Metro cache
cd mobile && npx react-native start --reset-cache

# Check Expo CLI
npm install -g @expo/cli
```

**Dashboard not loading?**
```bash
# Check Node version (18+)
node -v

# Clear browser cache and restart
npm start
```

## 📞 Team Communication

### Development Channels
- **Backend**: Focus on AWS Lambda functions and DynamoDB
- **Mobile**: React Native screens and offline storage
- **Frontend**: React dashboard and mapping features
- **Integration**: WebSocket connections and API contracts

### Code Standards
- Use TypeScript for all new code
- Follow existing file naming conventions
- Add JSDoc comments for public functions
- Write tests for critical features

## ⏰ Hackathon Timeline

### Day 1 (Sep 19)
- [ ] Environment setup complete
- [ ] Basic authentication working
- [ ] Database schema deployed
- [ ] UI wireframes implemented

### Day 2 (Sep 20)  
- [ ] Core shelter management features
- [ ] Real-time updates working
- [ ] Mobile app functional
- [ ] Dashboard showing live data

### Day 3 (Sep 21)
- [ ] Alert system complete
- [ ] Offline functionality
- [ ] Performance optimization
- [ ] Demo preparation

---

*SafeHaven Connect - Connecting safety, saving lives*
