# SafeHaven Connect
[![AWS](https://img.shields.io/badge/AWS-Serverless-orange.svg)](https://aws.amazon.com/)
[![FirstNet](https://img.shields.io/badge/FirstNet-Compatible-blue.svg)](https://www.firstnet.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **🏆 Breaking Barriers Hackathon 2025 Entry**  
> *Transforming emergency response through AI-powered communication platforms*

![image](SafeHavenLogo.png)
## 🚨 Overview

**SafeHaven Connect** is a real-time communication platform that bridges the critical gap between emergency shelters and first responders during disasters. Built for the FirstNet public safety network, our solution ensures reliable, priority communication when lives are on the line.

### The Problem

During disasters, first responders often lack real-time information about:
- Shelter capacity and availability
- Resource needs and shortages  
- Current evacuee status
- Urgent safety concerns

This communication gap leads to inefficient resource allocation, delayed response times, and potential safety risks for evacuees.

### Our Solution

SafeHaven Connect provides two integrated applications:

1. **📱 Shelter Command App** - Simple mobile interface for shelter operators
2. **🗺️ Responder Dashboard** - Real-time mapping interface for first responders

## ✨ Key Features

### For Shelter Operators
- **One-tap status updates** for capacity, resources, and urgent needs
- **Real-time notifications** to all connected responders
- **Offline capability** with sync when connection resumes
- **Simple, intuitive interface** designed for high-stress situations

### For First Responders
- **Live shelter map** with color-coded status indicators
- **Filtering and search** based on specific needs or capacity
- **Critical alerts** for urgent shelter situations
- **Route optimization** to nearest available shelters

## 🏗️ Technology Stack

### Backend Infrastructure (AWS Serverless)
- **Runtime:** Node.js 18.x on AWS Lambda
- **API Gateway:** REST APIs + WebSocket for real-time communication
- **Database:** Amazon DynamoDB with Global Secondary Indexes
- **Messaging:** Amazon SNS/SQS for pub/sub architecture
- **Location Services:** AWS Location Service with Esri data
- **AI Integration:** AWS Bedrock (Amazon Nova Micro) for resource predictions
- **Deployment:** Serverless Framework with CloudFormation
- **Monitoring:** CloudWatch logs and metrics

### Mobile Application (React Native + Expo)
- **Framework:** React Native 0.72.6 with Expo 49.0.0
- **State Management:** Redux Toolkit with Redux Persist
- **Navigation:** React Navigation 6.x
- **UI Components:** React Native Paper + custom components
- **Maps:** MapLibre React Native for offline-capable mapping
- **Storage:** AsyncStorage for offline data persistence
- **Notifications:** Expo Notifications for push alerts

### Dashboard Application (React + TypeScript)
- **Framework:** React 18.2.0 with TypeScript 5.x
- **Styling:** Tailwind CSS 3.x with component libraries
- **State Management:** React Context + React Query for server state
- **Maps:** MapLibre GL JS with AWS Location Service integration
- **Real-time:** Socket.io-client for WebSocket connections
- **Build Tool:** Create React App with custom configurations
- **Routing:** React Router DOM 6.x

### Shared Infrastructure
- **Type System:** Shared TypeScript package for consistent types
- **Code Quality:** ESLint + Prettier with consistent configurations
- **Testing:** Jest with React Testing Library
- **Documentation:** Comprehensive markdown documentation
- **Demo Tools:** Automated demo scripts and data seeding

## 📁 Project Structure

```
SafeHaven/
├── 📱 mobile/               # React Native app (Expo 49.0.0)
│   ├── src/screens/        # App screens and navigation
│   ├── src/components/     # Reusable UI components
│   ├── src/services/       # API and data services
│   ├── src/store/          # Redux Toolkit state management
│   └── src/types/          # TypeScript type definitions
│   ├── App.tsx             # Main application component
│   └── app.json            # Expo configuration
├── 🌐 dashboard/           # React 18.2.0 + TypeScript web app
│   ├── src/pages/          # Main application pages
│   ├── src/components/     # UI component library
│   ├── src/services/       # Data fetching and APIs
│   ├── src/hooks/          # Custom React hooks
│   └── public/             # Static assets
├── ⚡ backend/             # AWS Serverless (Node.js 18.x)
│   ├── src/functions/      # Lambda function handlers
│   │   ├── auth/           # Authentication services
│   │   ├── shelters/       # Shelter management
│   │   ├── alerts/         # Alert system
│   │   ├── websocket/      # Real-time WebSocket handling
│   │   ├── location/       # AWS Location Service integration
│   │   └── ai/             # AWS Bedrock AI predictions
│   ├── src/services/       # Business logic services
│   ├── src/utils/          # Utility functions
│   ├── serverless.yml      # Serverless Framework configuration
│   └── data/              # Demo and test data
├── 🔄 shared/              # Shared TypeScript types package
│   ├── types/             # Common type definitions
│   └── index.ts           # Type exports
├── 📚 docs/                # Complete project documentation
├── 🛠️ scripts/            # Build, deployment, and demo scripts
│   ├── setup.sh           # Automated project setup
│   ├── seed-demo-data.js  # Demo data population
│   └── demo-scenarios.js  # Interactive demo scenarios
└── 📋 Configuration files  # Package.json, environment, etc.
```

## 🚀 Getting Started

### ⚡ Quick Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/49115566/SafeHaven.git
cd SafeHaven

# Run automated setup script
./scripts/setup.sh

# Start all development services
npm run dev

# Or start individual components:
npm run dev:backend     # Start serverless offline
npm run dev:dashboard   # Start React web app
npm run dev:mobile      # Start Expo development server
```

### 📖 Detailed Setup

**Step 1: Install Dependencies**
```bash
# Install root dependencies and all workspaces
npm install

# Or install individually
npm run install:all
```

**Step 2: Configure AWS (Required for backend)**
```bash
# Configure AWS credentials
aws configure

# Set region and basic credentials
AWS Access Key ID: [Your Access Key]
AWS Secret Access Key: [Your Secret Key]  
Default region name: us-east-2
Default output format: json
```

**Step 3: Environment Setup**
```bash
# Copy environment examples
cp .env.example backend/.env
cp .env.example mobile/.env  
cp .env.example dashboard/.env

# Edit environment files as needed
```

**Step 4: Build and Deploy Backend**
```bash
# Build backend
npm run build:backend

# Deploy to AWS (optional - can run locally)
cd backend
npm run deploy:dev
```

**Step 5: Start Development**
```bash
# Start all services
npm run dev

# Or start individual services
npm run dev:backend     # Runs on localhost:3010
npm run dev:dashboard   # Runs on localhost:3000  
npm run dev:mobile      # Starts Expo dev server
```

### 📖 Detailed Setup

For detailed setup instructions and troubleshooting, see:
- **[Development Guide](DEVELOPMENT.md)** - Complete developer workflow
- **[Documentation](docs/README.md)** - Full project documentation

### Prerequisites

- **Node.js** (v18 or higher) - Required for all components
- **AWS CLI** configured with appropriate credentials
- **React Native development environment** (for mobile development)
  - Expo CLI: `npm install -g @expo/cli`
  - iOS: Xcode 14+ (for iOS development)
  - Android: Android Studio with API Level 28+ (for Android development)
- **Serverless Framework** (optional): `npm install -g serverless`

### Environment Variables

Create `.env` files in each directory using the provided examples:

```env
# backend/.env
AWS_REGION=us-east-2
STAGE=dev
DYNAMODB_REGION=us-east-2
SHELTERS_TABLE=safehaven-backend-shelters-dev
USERS_TABLE=safehaven-backend-users-dev
ALERTS_TABLE=safehaven-backend-alerts-dev
CONNECTIONS_TABLE=safehaven-backend-connections-dev
SHELTER_UPDATES_TOPIC=safehaven-backend-shelter-updates-dev
AWS_LOCATION_MAP_NAME=safehaven-backend-map-dev
AWS_LOCATION_PLACE_INDEX=safehaven-backend-places-dev
JWT_SECRET=hackathon-jwt-secret-change-in-production

# mobile/.env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3010
EXPO_PUBLIC_WS_URL=ws://localhost:3011

# dashboard/.env
REACT_APP_API_URL=http://localhost:3010
REACT_APP_WS_URL=ws://localhost:3011
REACT_APP_AWS_REGION=us-east-2
REACT_APP_AWS_LOCATION_MAP_NAME=safehaven-backend-map-dev
```

## 🧪 Testing

### Backend Testing
```bash
# Unit tests
cd backend
npm test

# Integration tests  
npm run test:integration

# Database connection tests
npm run test:db
```

### Mobile App Testing
```bash
# Unit tests
cd mobile
npm test

# Run on device/simulator
npm run ios          # iOS simulator
npm run android      # Android emulator
npm start            # Expo development server
```

### Dashboard Testing
```bash
# Unit tests
cd dashboard
npm test

# End-to-end testing
npm run test:e2e

# Start development server
npm start
```

### Demo and Integration Testing
```bash
# Run complete demo setup
npm run demo:setup

# Populate demo data
npm run demo:seed

# Test specific scenarios
npm run demo:capacity     # Capacity management scenario
npm run demo:resources    # Resource shortage scenario
npm run demo:medical      # Medical emergency scenario
npm run demo:coordination # Multi-shelter coordination
```

## 📖 API Documentation

### Authentication Endpoints
```http
POST /auth/login
POST /auth/register
GET  /auth/verify
```

### Shelter Management
```http
GET    /shelters                    # List all shelters
POST   /shelters                    # Create new shelter  
GET    /shelters/{shelterId}        # Get shelter details
PUT    /shelters/{shelterId}/status # Update shelter status
```

### Alert System
```http
POST /alerts                       # Create new alert
GET  /alerts                       # List active alerts
PUT  /alerts/{id}/acknowledge      # Acknowledge alert
PUT  /alerts/{id}/resolve          # Resolve alert
```

### Location Services
```http
POST /location/search              # Search places
GET  /location/mapstyle            # Get map style configuration
```

### AI Predictions
```http
POST /ai/predict-resources         # Get AI resource predictions
```

### WebSocket Events
```javascript
// Real-time events
'shelter.status.updated'           // Shelter status changed
'shelter.alert.created'            # New emergency alert
'alert.acknowledged'               # Alert acknowledgment
'dashboard.refresh'                # Force dashboard refresh
```

### Example: Shelter Status Update
```http
PUT /shelters/{shelterId}/status
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "capacity": {
    "current": 150,
    "maximum": 200
  },
  "resources": {
    "food": "adequate",
    "water": "low", 
    "medical": "adequate"
  },
  "urgentNeeds": ["medical supplies"],
  "timestamp": "2025-09-19T10:30:00Z"
}
```

### Example: Get All Shelters
```http
GET /shelters
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "data": [
    {
      "shelterId": "shelter-001",
      "name": "Dallas Convention Center",
      "location": {
        "latitude": 32.7767,
        "longitude": -96.7970,
        "address": "650 S Griffin St, Dallas, TX 75202"
      },
      "status": "available", 
      "capacity": {
        "current": 150,
        "maximum": 200
      },
      "resources": {
        "food": "adequate",
        "water": "low",
        "medical": "adequate"
      },
      "lastUpdated": "2025-09-19T10:30:00Z"
    }
  ],
  "timestamp": "2025-09-19T10:30:00Z"
}
```

## 🎯 Challenge Alignment

SafeHaven Connect directly addresses **Challenge 2: Community Safety & Health Innovation** by:

- ✅ **Connecting first responders with real-time data** from shelter operations
- ✅ **Enabling faster coordination** between emergency services and shelters  
- ✅ **Improving disaster preparedness** through better resource visibility
- ✅ **Creating new interaction methods** between communities and emergency services

## 🌟 Impact & Future Vision

### Immediate Benefits
- **Reduced response times** through real-time shelter visibility
- **Optimized resource allocation** based on actual needs
- **Enhanced evacuee safety** through better coordination
- **Improved decision-making** with actionable data

### Future Enhancements
- 🌡️ **IoT sensor integration** for automated environmental monitoring
- 🔥 **Weather and fire-line data** integration
- 🤖 **AI-powered predictive analytics** for resource forecasting
- 📊 **Advanced reporting** and post-incident analysis
- 🌍 **Multi-language support** for diverse communities

## 👥 Team SaveHaven

- **Ryan Chui** - Full-Stack Developer
- **Craig Truitt** - Backend Engineer  
- **Muxin Ge** - Frontend Developer
- **Rashedul Islam Seum** - Mobile Developer

## 🏆 Breaking Barriers Hackathon 2025

This project was developed for the Breaking Barriers hackathon hosted by AWS, AT&T, and Deloitte at Southern Methodist University (September 19-21, 2025). The hackathon focused on transforming the future of networks through agents and generative AI for FirstNet applications.


## 📞 Support

For questions or support related to this hackathon project, please contact Team SaveHaven:
- GitHub Issues: [Create an issue](https://github.com/49115566/SafeHaven/issues)

---

**Built with ❤️ for first responders and the communities they serve**

*SafeHaven Connect - Connecting safety, saving lives*

![image](IMG_3361.jpg)
