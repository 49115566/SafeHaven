# SafeHaven Connect

[![AWS](https://img.shields.io/badge/AWS-Serverless-orange.svg)](https://aws.amazon.com/)
[![FirstNet](https://img.shields.io/badge/FirstNet-Compatible-blue.svg)](https://www.firstnet.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **🏆 Breaking Barriers Hackathon 2025 Entry**  
> *Transforming emergency response through AI-powered communication platforms*

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

## 🏗️ Technical Architecture

SafeHaven Connect leverages AWS serverless architecture for maximum scalability and reliability:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Shelter App   │    │   FirstNet       │    │ Responder App   │
│   (Mobile)      │◄──►│   Network        │◄──►│ (Dashboard)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                     ┌──────────────────┐
                     │   AWS Cloud      │
                     │                  │
                     │  ┌─────────────┐ │
                     │  │   API       │ │
                     │  │  Gateway    │ │
                     │  └─────────────┘ │
                     │         │        │
                     │  ┌─────────────┐ │
                     │  │   Lambda    │ │
                     │  │ Functions   │ │
                     │  └─────────────┘ │
                     │         │        │
                     │  ┌─────────────┐ │
                     │  │  DynamoDB   │ │
                     │  └─────────────┘ │
                     │         │        │
                     │  ┌─────────────┐ │
                     │  │  SNS/SQS    │ │
                     │  │ Messaging   │ │
                     │  └─────────────┘ │
                     └──────────────────┘
```

### Core Technologies

- **🚀 AWS Lambda** - Serverless compute for backend logic
- **📊 Amazon DynamoDB** - Fast, scalable NoSQL database
- **📡 Amazon SNS/SQS** - Real-time pub/sub messaging
- **🔐 AWS API Gateway** - Secure API management
- **🌐 FirstNet Network** - Priority public safety communications
- **📱 React Native** - Cross-platform mobile development
- **⚛️ React** - Web dashboard interface

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- AWS CLI configured
- React Native development environment
- FirstNet device access (for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SafeHaven/safehaven-connect.git
   cd safehaven-connect
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Mobile app dependencies
   cd ../mobile
   npm install
   
   # Dashboard dependencies
   cd ../dashboard
   npm install
   ```

3. **Configure AWS services**
   ```bash
   # Deploy AWS infrastructure
   cd backend
   npm run deploy
   ```

4. **Start development servers**
   ```bash
   # Start mobile app (iOS/Android)
   cd mobile
   npx react-native run-ios
   # or
   npx react-native run-android
   
   # Start web dashboard
   cd dashboard
   npm start
   ```

### Environment Variables

Create `.env` files in each directory:

```env
# backend/.env
AWS_REGION=us-east-1
DYNAMODB_TABLE=SafeHaven-Shelters
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789:SafeHaven-Updates

# mobile/.env
API_BASE_URL=https://api.safehaven.example.com
FIRSTNET_ENDPOINT=https://firstnet.api.endpoint

# dashboard/.env
REACT_APP_API_URL=https://api.safehaven.example.com
REACT_APP_MAPS_API_KEY=your_maps_api_key
```

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run mobile app tests
cd mobile
npm test

# Run dashboard tests
cd dashboard
npm test

# Integration tests
npm run test:integration
```

## 📖 API Documentation

### Shelter Status Update
```http
POST /api/shelters/{shelterId}/status
Content-Type: application/json

{
  "capacity": {
    "current": 150,
    "maximum": 200
  },
  "resources": {
    "food": "adequate",
    "water": "low",
    "medical": "critical"
  },
  "urgentNeeds": ["medical supplies", "generators"],
  "timestamp": "2025-09-19T10:30:00Z"
}
```

### Get All Shelters
```http
GET /api/shelters
Authorization: Bearer {firstnet_token}

Response:
{
  "shelters": [
    {
      "id": "shelter-001",
      "name": "Dallas Convention Center",
      "location": {
        "latitude": 32.7767,
        "longitude": -96.7970
      },
      "status": "available",
      "lastUpdated": "2025-09-19T10:30:00Z"
    }
  ]
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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## 📞 Support

For questions or support, please contact us at:
- Email: team@safehaven.example.com
- GitHub Issues: [Create an issue](https://github.com/SafeHaven/safehaven-connect/issues)

---

**Built with ❤️ for first responders and the communities they serve**

*SafeHaven Connect - Connecting safety, saving lives*