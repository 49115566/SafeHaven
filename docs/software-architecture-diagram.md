# Software Architecture Diagram
## SafeHaven Connect: Real-Time Emergency Communication Platform

**Document Version:** 1.0  
**Date:** September 19, 2025  
**Team:** SaveHaven  
**Event:** Breaking Barriers Hackathon 2025

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [System Context Diagram](#2-system-context-diagram)
3. [Application Architecture](#3-application-architecture)
4. [Data Architecture](#4-data-architecture)
5. [Communication Architecture](#5-communication-architecture)
6. [Deployment Architecture](#6-deployment-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Implementation Guidelines](#8-implementation-guidelines)

---

## 1. Architecture Overview

### 1.1 Architecture Principles

SafeHaven Connect follows modern cloud-native architecture principles optimized for rapid development and scalable emergency response:

**🏗️ Design Principles:**
- **Serverless-First**: Minimize operational overhead during hackathon
- **Event-Driven**: Real-time updates through pub/sub messaging
- **Mobile-First**: Primary interface optimized for field operations
- **Resilient**: Graceful degradation during network issues
- **Scalable**: Auto-scaling to handle emergency surge capacity

**🎯 Architecture Qualities:**
- **Availability**: 99.9% uptime target with FirstNet priority
- **Performance**: Sub-5-second real-time updates
- **Scalability**: Support 1000+ shelters and 5000+ responders
- **Security**: End-to-end encryption with role-based access
- **Maintainability**: Clear separation of concerns and modular design

### 1.2 Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Mobile App (React Native)  │   Dashboard (React + TypeScript)  │
│  • React Native 0.72.6      │   • React 18.2.0                  │
│  • Expo 49.0.0             │   • TypeScript 5.x                │
│  • Redux Toolkit            │   • Tailwind CSS 3.x             │
│  • Offline Capability       │   • MapLibre GL JS                │
│  • Push Notifications       │   • Real-time Updates             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Communication Layer                        │
├─────────────────────────────────────────────────────────────────┤
│              FirstNet Priority Network                          │
│  • Dedicated Public Safety Bandwidth                            │
│  • Priority and Preemption                                      │
│  • Enhanced Coverage and Reliability                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                               │
├─────────────────────────────────────────────────────────────────┤
│                    AWS API Gateway                              │
│  • REST APIs for CRUD operations                                │
│  • WebSocket for real-time communication                        │
│  • JWT-based authentication                                     │
│  • Rate limiting and CORS                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       Business Logic                            │
├─────────────────────────────────────────────────────────────────┤
│                   AWS Lambda (Node.js 18.x)                    │
│  • Authentication Service    │  • Alert Management Service      │
│  • Shelter Management Service│  • WebSocket Handler            │
│  • Location Service          │  • AI Prediction Service        │
│  • Notification Service      │  • Data Aggregation Service     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         AI Layer                                │
├─────────────────────────────────────────────────────────────────┤
│                     AWS Bedrock                                 │
│  • Amazon Nova Micro Model  │  • Resource Prediction           │
│  • Capacity Forecasting     │  • Emergency Response Analysis   │
│  • Pattern Recognition      │  • Intelligent Alerts            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Messaging Layer                            │
├─────────────────────────────────────────────────────────────────┤
│           Amazon SNS + SQS                                      │
│  • Real-time Pub/Sub Messaging                                  │
│  • Message Queuing and Delivery                                 │
│  • Fan-out to Multiple Subscribers                              │
│  • WebSocket Connection Management                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Location Services                          │
├─────────────────────────────────────────────────────────────────┤
│               AWS Location Service                              │
│  • Map Rendering (Esri)     │  • Place Search & Geocoding      │
│  • Route Calculation        │  • Geospatial Queries            │
│  • Custom Map Styles        │  • Location-based Analytics      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
├─────────────────────────────────────────────────────────────────┤
│           Amazon DynamoDB                                       │
│  • Shelters Table           │  • Alerts Table                   │
│  • Users Table              │  • Connections Table              │
│  • Global Secondary Indexes │  • Auto-scaling Capacity         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. System Context Diagram

### 2.1 High-Level System Context

```
                    ┌─────────────────────────────────────────────┐
                    │             External Systems                │
                    └─────────────────────────────────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
    ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
    │ AWS Location    │      │    FirstNet     │      │   AWS Cloud     │
    │      API        │      │    Network      │      │   Services      │
    │                 │      │                 │      │                 │
    │ • Mapping       │      │ • Priority      │      │ • Compute       │
    │ • Geocoding     │      │ • Preemption    │      │ • Storage       │
    │ • Routing       │      │ • QoS           │      │ • Messaging     │
    └─────────────────┘      └─────────────────┘      └─────────────────┘
              │                         │                         │
              └─────────────────────────┼─────────────────────────┘
                                        │
                              ┌─────────────────┐
                              │  SafeHaven      │
                              │   Connect       │
                              │   Platform      │
                              └─────────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              │                         │                         │
    ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
    │   Shelter       │      │   Emergency     │      │   First         │
    │  Operators      │      │  Coordinators   │      │  Responders     │
    │                 │      │                 │      │                 │
    │ • Update Status │      │ • Monitor       │      │ • View Map      │
    │ • Send Alerts   │      │ • Coordinate    │      │ • Filter Search │
    │ • Request Help  │      │ • Oversee       │      │ • Respond       │
    └─────────────────┘      └─────────────────┘      └─────────────────┘
```

### 2.2 Actor Interaction Overview

**Primary Actors:**
- **Shelter Operators**: Manage shelter status and communicate needs
- **First Responders**: Monitor shelters and coordinate response
- **Emergency Coordinators**: Oversee overall emergency response

**Supporting Systems:**
- **FirstNet Network**: Provides reliable, priority communication
- **AWS Cloud**: Hosts scalable backend infrastructure
- **AWS Location Service**: Provides mapping and location services with Esri data

---

## 3. Application Architecture

### 3.1 Mobile Application Architecture (Shelter Command App)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Shelter Command App (React Native)               │
├─────────────────────────────────────────────────────────────────────┤
│                         Presentation Layer                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   Login/Auth    │  │  Status Update  │  │  Alert System   │      │
│  │     Screen      │  │     Screen      │  │     Screen      │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│                        Component Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │  Capacity       │  │   Resource      │  │   Emergency     │      │
│  │  Counter        │  │   Status        │  │    Button       │      │
│  │  Component      │  │  Component      │  │   Component     │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│                        Service Layer                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │      API        │  │   Offline       │  │  Notification   │      │
│  │    Service      │  │    Storage      │  │    Service      │      │
│  │                 │  │    Service      │  │                 │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│                         Data Layer                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   AsyncStorage  │  │     Redux       │  │     Network     │      │
│  │   (Offline)     │  │     Store       │  │     Manager     │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │   FirstNet      │
                          │   Network       │
                          └─────────────────┘
```

**Key Components:**

**📱 Presentation Layer:**
- **Login/Auth Screen**: Secure shelter registration and authentication
- **Status Update Screen**: One-tap capacity and resource updates
- **Alert System Screen**: Emergency alert creation and management

**🔧 Service Layer:**
- **API Service**: RESTful communication with backend
- **Offline Storage Service**: Local data persistence and sync
- **Notification Service**: Push notifications and local alerts

**💾 Data Layer:**
- **AsyncStorage**: Offline data storage for network resilience
- **Redux Store**: Application state management
- **Network Manager**: Connection monitoring and retry logic

### 3.2 Web Dashboard Architecture (Responder Dashboard)

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Responder Dashboard (React + TypeScript)           │
├─────────────────────────────────────────────────────────────────────┤
│                         Presentation Layer                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │    Dashboard    │  │    Shelter      │  │     Alert       │      │
│  │      View       │  │    Details      │  │   Management    │      │
│  │                 │  │     Modal       │  │     Panel       │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│                        Component Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   Interactive   │  │    Filter       │  │   Real-time     │      │
│  │      Map        │  │    Controls     │  │   Status        │      │
│  │   Component     │  │   Component     │  │   Indicators    │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│                        Service Layer                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   WebSocket     │  │     HTTP        │  │    Map API      │      │
│  │    Service      │  │   API Client    │  │    Service      │      │
│  │                 │  │                 │  │                 │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│                         Data Layer                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │     React       │  │   Local Cache   │  │   Session       │      │
│  │    Context      │  │   (5 minutes)   │  │   Storage       │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                          ┌─────────────────┐
                          │   FirstNet      │
                          │   Network       │
                          └─────────────────┘
```

**Key Components:**

**🌐 Presentation Layer:**
- **Dashboard View**: Main interface with map and shelter overview
- **Shelter Details Modal**: Detailed information and communication
- **Alert Management Panel**: Real-time alert handling and response

**🗺️ Component Layer:**
- **Interactive Map**: AWS Location Service integration with MapLibre GL JS and custom markers
- **Filter Controls**: Search and filter functionality
- **Real-time Status Indicators**: Live status updates and notifications

**🔄 Service Layer:**
- **WebSocket Service**: Real-time data streaming
- **HTTP API Client**: RESTful API communication
- **Location Service**: AWS Location Service integration for mapping and geocoding

---

## 4. Data Architecture

### 4.1 Data Model Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DynamoDB Data Model                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         Shelters Table                              │
├─────────────────────────────────────────────────────────────────────┤
│ PK: shelterId (String)                                              │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │
│ │   Basic Info    │ │    Location     │ │    Capacity     │         │
│ │                 │ │                 │ │                 │         │
│ │ • name          │ │ • latitude      │ │ • maximum       │         │
│ │ • type          │ │ • longitude     │ │ • current       │         │
│ │ • description   │ │ • address       │ │ • available     │         │
│ │ • contactInfo   │ │ • region        │ │ • lastUpdated   │         │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘         │
│                                                                     │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │
│ │   Resources     │ │     Status      │ │   Metadata      │         │
│ │                 │ │                 │ │                 │         │
│ │ • food          │ │ • operational   │ │ • createdAt     │         │
│ │ • water         │ │ • lastHeartbeat │ │ • updatedAt     │         │
│ │ • medical       │ │ • connectivity  │ │ • version       │         │
│ │ • supplies      │ │ • priority      │ │ • tags          │         │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          Alerts Table                               │
├─────────────────────────────────────────────────────────────────────┤
│ PK: alertId (String)                                                │
│ GSI: shelterId-timestamp-index                                      │
│                                                                     │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │
│ │   Alert Info    │ │   Tracking      │ │   Resolution    │         │
│ │                 │ │                 │ │                 │         │
│ │ • shelterId     │ │ • timestamp     │ │ • status        │         │
│ │ • alertType     │ │ • priority      │ │ • acknowledgedBy│         │
│ │ • message       │ │ • severity      │ │ • resolvedAt    │         │
│ │ • category      │ │ • escalation    │ │ • resolution    │         │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          Users Table                                │
├─────────────────────────────────────────────────────────────────────┤
│ PK: userId (String)                                                 │
│ GSI: shelterId-index (for shelter operators)                        │
│                                                                     │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │
│ │  User Profile   │ │  Authorization  │ │   Session       │         │
│ │                 │ │                 │ │                 │         │
│ │ • username      │ │ • role          │ │ • lastLogin     │         │
│ │ • email         │ │ • permissions   │ │ • sessionToken  │         │
│ │ • phone         │ │ • shelterId     │ │ • deviceInfo    │         │
│ │ • organization  │ │ • region        │ │ • preferences   │         │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Relationships and Access Patterns

**Primary Access Patterns:**

1. **Get All Shelters for Dashboard**
   ```
   Scan: Shelters Table
   Filter: status = 'active'
   Projection: Basic info + current status
   ```

2. **Update Shelter Status**
   ```
   Update: Shelters Table
   Key: shelterId
   UpdateExpression: SET capacity, resources, lastHeartbeat
   ```

3. **Create Emergency Alert**
   ```
   Put: Alerts Table
   Item: Alert details + timestamp
   Trigger: SNS notification
   ```

4. **Get Shelter Alert History**
   ```
   Query: Alerts Table (GSI)
   Key: shelterId
   SortKey: timestamp (descending)
   ```

### 4.3 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Flow Diagram                            │
└─────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐                    ┌─────────────┐
    │   Shelter   │                    │  Responder  │
    │    App      │                    │  Dashboard  │
    └─────────────┘                    └─────────────┘
           │                                  │
           │ 1. Status Update                 │ 5. Real-time Display
           ▼                                  ▲
    ┌─────────────┐                    ┌─────────────┐
    │     API     │                    │  WebSocket  │
    │   Gateway   │                    │  Connection │
    └─────────────┘                    └─────────────┘
           │                                  │
           │ 2. Route to Lambda               │
           ▼                                  │
    ┌─────────────┐                           │
    │   Lambda    │─────3. Update Data──────► │
    │  Function   │                           │
    └─────────────┘                           │
           │                                  │
           │ 4. Publish Event                 │
           ▼                                  │
    ┌─────────────┐      SNS Topic      ┌─────────────┐
    │  DynamoDB   │◄────────────────────┤     SNS     │
    │   Tables    │                     │  Publisher  │
    └─────────────┘                     └─────────────┘
                                              │
                                              │ 6. Fan-out
                                              ▼
                                       ┌─────────────┐
                                       │     SQS     │
                                       │   Queues    │
                                       └─────────────┘
```

**Data Flow Steps:**
1. **Status Update**: Shelter app sends status change
2. **Route to Lambda**: API Gateway routes to appropriate function
3. **Update Data**: Lambda updates DynamoDB tables
4. **Publish Event**: Lambda publishes event to SNS topic
5. **Real-time Display**: WebSocket pushes updates to dashboard
6. **Fan-out**: SNS distributes to multiple SQS queues for processing

---

## 5. Communication Architecture

### 5.1 Real-Time Messaging Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Real-Time Communication Flow                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐                              ┌─────────────────┐
│   Shelter App   │                              │   Dashboard     │
│                 │                              │                 │
│ ┌─────────────┐ │          FirstNet            │ ┌─────────────┐ │
│ │   Update    │ │◄────────Network────────────► │ │  Real-time  │ │
│ │  Component  │ │         Priority             │ │   Updates   │ │
│ └─────────────┘ │                              │ └─────────────┘ │
└─────────────────┘                              └─────────────────┘
         │                                                │
         │ HTTP POST                              WebSocket │
         │ /api/shelters/{id}/status                      │
         ▼                                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        AWS API Gateway                              │
├─────────────────────────────────────────────────────────────────────┤
│  REST Endpoints          │        WebSocket API                     │
│  • POST /shelters        │        • Connection Management           │
│  • PUT /status           │        • Message Broadcasting            │
│  • POST /alerts          │        • Client Subscriptions            │
└─────────────────────────────────────────────────────────────────────┘
         │                                                │
         │ Invoke                                Invoke   │
         ▼                                                ▼
┌─────────────────┐                              ┌─────────────────┐
│  Status Update  │                              │   WebSocket     │
│     Lambda      │                              │     Lambda      │
│                 │                              │                 │
│ • Validate data │          Publish             │ • Manage        │
│ • Update DB     │◄────────Message─────────────►│   connections   │
│ • Trigger event │                              │ • Broadcast     │
└─────────────────┘                              └─────────────────┘
         │                                                │
         │ Write                                    Read  │
         ▼                                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           DynamoDB                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Shelters Table                  │         Connections Table        │
│  • Current status                │         • Active WebSocket       │
│  • Capacity data                 │         • Client subscriptions   │
│  • Resource levels               │         • Connection metadata    │
└─────────────────────────────────────────────────────────────────────┘
         │
         │ Stream Changes
         ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Amazon SNS    │  Push   │   Amazon SQS    │ Process │   Notification  │
│   Topic         │────────►│   Queue         │────────►│     Lambda      │
│                 │         │                 │         │                 │
│ • Fan-out       │         │ • Message       │         │ • Send push     │
│ • Pub/Sub       │         │   buffering     │         │ • Log events    │
│ • Event routing │         │ • Dead letter   │         │ • Analytics     │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### 5.2 API Communication Patterns

**REST API Endpoints:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API Endpoint Design                          │
└─────────────────────────────────────────────────────────────────────┘

Authentication & Registration:
POST   /api/auth/shelter/register     │ Register new shelter
POST   /api/auth/shelter/login        │ Shelter operator login
POST   /api/auth/responder/login      │ First responder login
POST   /api/auth/refresh              │ Refresh authentication token

Shelter Management:
GET    /api/shelters                  │ List all active shelters
GET    /api/shelters/{id}             │ Get specific shelter details
PUT    /api/shelters/{id}/status      │ Update shelter status
PUT    /api/shelters/{id}/capacity    │ Update capacity information
PUT    /api/shelters/{id}/resources   │ Update resource levels

Alert System:
POST   /api/shelters/{id}/alerts      │ Create emergency alert
GET    /api/alerts                    │ Get active alerts (responders)
PUT    /api/alerts/{id}/acknowledge   │ Acknowledge alert response
PUT    /api/alerts/{id}/resolve       │ Mark alert as resolved

Dashboard Data:
GET    /api/dashboard/live            │ Get real-time dashboard data
GET    /api/dashboard/filters         │ Get available filter options
POST   /api/dashboard/search          │ Search shelters with criteria

WebSocket Events:
shelter.status.updated                │ Shelter status changed
shelter.alert.created                 │ New emergency alert
alert.acknowledged                    │ Alert acknowledgment
dashboard.refresh                     │ Force dashboard refresh
```

### 5.3 Message Format Specifications

**Status Update Message:**
```json
{
  "messageType": "shelter.status.updated",
  "timestamp": "2025-09-19T14:30:00Z",
  "shelterId": "shelter-dallas-001",
  "data": {
    "capacity": {
      "current": 150,
      "maximum": 200,
      "percentage": 75
    },
    "resources": {
      "food": "adequate",
      "water": "low",
      "medical": "adequate",
      "supplies": "critical"
    },
    "status": "available",
    "lastUpdated": "2025-09-19T14:30:00Z"
  },
  "priority": "normal"
}
```

**Emergency Alert Message:**
```json
{
  "messageType": "shelter.alert.created",
  "timestamp": "2025-09-19T14:35:00Z",
  "alertId": "alert-001",
  "shelterId": "shelter-dallas-001",
  "data": {
    "alertType": "medical-emergency",
    "severity": "critical",
    "message": "Multiple injured evacuees need immediate medical attention",
    "location": {
      "latitude": 32.7767,
      "longitude": -96.7970,
      "address": "650 S Griffin St, Dallas, TX 75202"
    },
    "contact": {
      "phone": "+1-555-0123",
      "name": "John Smith, Shelter Coordinator"
    },
    "estimatedResponse": "15-20 minutes"
  },
  "priority": "critical"
}
```

---

## 6. Deployment Architecture

### 6.1 AWS Infrastructure Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AWS Cloud Infrastructure                       │
└─────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────┐
                    │   CloudFront    │
                    │   (Global CDN)  │
                    └─────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   Route 53  │ │     ALB     │ │     S3      │
    │    (DNS)    │ │ (Load Bal.) │ │  (Static)   │
    └─────────────┘ └─────────────┘ └─────────────┘
                            │
                    ┌─────────────────┐
                    │   API Gateway   │
                    │                 │
                    │ • REST APIs     │
                    │ • WebSocket API │
                    │ • JWT Auth      │
                    │ • Rate Limiting │
                    └─────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   Lambda    │ │   Lambda    │ │   Lambda    │
    │  Functions  │ │ WebSocket   │ │    AI       │
    │ (Node 18.x) │ │  Handlers   │ │ Bedrock     │
    └─────────────┘ └─────────────┘ └─────────────┘
              │             │             │
              └─────────────┼─────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  DynamoDB   │     │AWS Location │     │  AWS        │
│   Tables    │     │   Service   │     │ Bedrock     │
│             │     │             │     │             │
│ • Shelters  │     │ • Map       │     │ • Nova      │
│ • Alerts    │     │ • Geocoding │     │   Micro     │
│ • Users     │     │ • Places    │     │ • Resource  │
│ • Sessions  │     │ • Routing   │     │   Predict   │
└─────────────┘     └─────────────┘     └─────────────┘
        │
        └─────────────────┬─────────────────┐
                          │                 │
                ┌─────────────┐   ┌─────────────┐
                │     SNS     │   │ CloudWatch  │
                │ (Pub/Sub)   │   │(Monitoring) │
                │             │   │             │
                │ • Updates   │   │ • Logs      │
                │ • Alerts    │   │ • Metrics   │
                │ • Fanout    │   │ • Alarms    │
                └─────────────┘   └─────────────┘
                        │
                ┌─────────────┐
                │     SQS     │
                │  (Queues)   │
                │             │
                │ • Message   │
                │   Buffering │
                │ • DLQ       │
                └─────────────┘
```

### 6.2 Container and Service Deployment

**Lambda Function Deployment Strategy:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Lambda Functions Architecture                    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ auth-functions  │  │ shelter-mgmt    │  │ alert-mgmt      │
│                 │  │                 │  │                 │
│ • Login         │  │ • Create        │  │ • Create Alert  │
│ • Register      │  │ • List/Get      │  │ • Acknowledge   │
│ • Verify Token  │  │ • Update Status │  │ • Resolve       │
│ • JWT Verify    │  │ • Health Check  │  │ • List Active   │
│                 │  │                 │  │                 │
│ Runtime: Node18 │  │ Runtime: Node18 │  │ Runtime: Node18 │
│ Memory: 256MB   │  │ Memory: 512MB   │  │ Memory: 256MB   │
│ Timeout: 30s    │  │ Timeout: 30s    │  │ Timeout: 30s    │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ websocket-mgmt  │  │ location-svc    │  │ ai-predictions  │
│                 │  │                 │  │                 │
│ • Connect       │  │ • Search Places │  │ • Resource      │
│ • Disconnect    │  │ • Get Map Style │  │   Forecasting   │
│ • Default Route │  │ • Geocoding     │  │ • Capacity      │
│ • Broadcast     │  │ • Route Calc    │  │   Analysis      │
│                 │  │                 │  │ • Pattern       │
│ Runtime: Node18 │  │ Runtime: Node18 │  │   Recognition   │
│ Memory: 256MB   │  │ Memory: 256MB   │  │                 │
│ Timeout: 30s    │  │ Timeout: 30s    │  │ Runtime: Node18 │
└─────────────────┘  └─────────────────┘  │ Memory: 512MB   │
                                          │ Timeout: 60s    │
                                          └─────────────────┘
```

### 6.3 Environment Configuration

**Multi-Environment Strategy:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Environment Configuration                        │
└─────────────────────────────────────────────────────────────────────┘

Development Environment:
┌─────────────────┐
│      dev-       │  • Local development
│   safehaven-    │  • LocalStack for AWS services
│    stack        │  • Hot reloading
│                 │  • Debug logging enabled
└─────────────────┘

Staging Environment:
┌─────────────────┐
│    staging-     │  • Integration testing
│   safehaven-    │  • Shared team environment
│     stack       │  • Performance testing
│                 │  • Demo preparation
└─────────────────┘

Production Environment:
┌─────────────────┐
│     prod-       │  • Live demo environment
│   safehaven-    │  • Monitoring enabled
│     stack       │  • Backup strategies
│                 │  • Security hardened
└─────────────────┘
```

**Infrastructure as Code:**

```yaml
# AWS CDK Stack Configuration
SafeHavenStack:
  Resources:
    # API Gateway
    SafeHavenAPI:
      Type: AWS::ApiGateway::RestApi
      Properties:
        Name: SafeHaven-API
        Description: Real-time shelter communication API
        
    # Lambda Functions
    ShelterAuthFunction:
      Type: AWS::Lambda::Function
      Properties:
        FunctionName: safehaven-auth
        Runtime: nodejs18.x
        Handler: index.handler
        Environment:
          Variables:
            DYNAMODB_TABLE: !Ref SheltersTable
            JWT_SECRET: !Ref JWTSecret
            
    # DynamoDB Tables
    SheltersTable:
      Type: AWS::DynamoDB::Table
      Properties:
        TableName: SafeHaven-Shelters
        BillingMode: ON_DEMAND
        AttributeDefinitions:
          - AttributeName: shelterId
            AttributeType: S
        KeySchema:
          - AttributeName: shelterId
            KeyType: HASH
            
    # SNS Topic
    ShelterUpdatesTopic:
      Type: AWS::SNS::Topic
      Properties:
        TopicName: SafeHaven-ShelterUpdates
        DisplayName: Shelter Status Updates
```

---

## 7. Security Architecture

### 7.1 Security Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      Security Architecture                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        Perimeter Security                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   CloudFront    │  │      WAF        │  │    Route 53     │      │
│  │   (DDoS Prot.)  │  │ (App Firewall)  │  │  (DNS Security) │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                           ┌─────────────────┐
                           │   API Gateway   │
                           │                 │
                           │ • Rate Limiting │
                           │ • API Keys      │
                           │ • CORS Config   │
                           └─────────────────┘
                                   │
┌─────────────────────────────────────────────────────────────────────┐
│                      Application Security                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   JWT Tokens    │  │   Role-Based    │  │   Input         │      │
│  │                 │  │   Access        │  │   Validation    │      │
│  │ • Authentication│  │ • Shelter Ops   │  │ • Schema Check  │      │
│  │ • Authorization │  │ • Responders    │  │ • Sanitization  │      │
│  │ • Session Mgmt  │  │ • Admin         │  │ • Rate Limiting │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Security                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   Encryption    │  │   Key Mgmt      │  │   Data Access   │      │
│  │                 │  │                 │  │                 │      │
│  │ • TLS 1.3       │  │ • AWS KMS       │  │ • Least Priv.   │      │
│  │ • At Rest       │  │ • Key Rotation  │  │ • Audit Logging │      │
│  │ • In Transit    │  │ • Secure Store  │  │ • Data Masking  │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Authentication and Authorization Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Authentication Flow Diagram                      │
└─────────────────────────────────────────────────────────────────────┘

Shelter App Authentication:
┌─────────────┐    1. Register    ┌─────────────┐    2. Validate    ┌─────────────┐
│   Shelter   │──────────────────►│     API     │──────────────────►│    Auth     │
│  Operator   │                   │   Gateway   │                   │   Lambda    │
└─────────────┘                   └─────────────┘                   └─────────────┘
       ▲                                 │                                 │
       │                                 │                                 │
       │ 5. JWT Token                    │ 3. Create User                  │
       │                                 ▼                                 ▼
       │                          ┌─────────────┐                   ┌─────────────┐
       └──────────────────────────│   Mobile    │                   │  DynamoDB   │
                                  │     App     │                   │   Users     │
                                  └─────────────┘                   └─────────────┘
                                         │                                 │
                                         │ 4. Generate JWT                 │
                                         ▼                                 │
                                  ┌─────────────┐◄──────────────────────────┘
                                  │  Secure     │
                                  │  Storage    │
                                  └─────────────┘

Responder Dashboard Authentication:
┌─────────────┐    1. FirstNet    ┌─────────────┐    2. Validate    ┌─────────────┐
│ First       │──────────────────►│     API     │──────────────────►│    Auth     │
│ Responder   │   Device Cert     │   Gateway   │   Certificate     │   Lambda    │
└─────────────┘                   └─────────────┘                   └─────────────┘
       ▲                                 │                                 │
       │                                 │                                 │
       │ 4. Session Token                │ 3. Create Session               │
       │                                 ▼                                 ▼
       │                          ┌─────────────┐                   ┌─────────────┐
       └──────────────────────────│   Browser   │                   │  DynamoDB   │
                                  │   Session   │                   │  Sessions   │
                                  └─────────────┘                   └─────────────┘
```

### 7.3 Data Protection Strategy

**Encryption Strategy:**

```
Data in Transit:
┌─────────────────┐    TLS 1.3     ┌─────────────────┐
│   Mobile App    │◄──────────────►│   API Gateway   │
└─────────────────┘                └─────────────────┘
┌─────────────────┐      WSS       ┌─────────────────┐
│   Dashboard     │◄──────────────►│   WebSocket     │
└─────────────────┘                └─────────────────┘

Data at Rest:
┌─────────────────┐   KMS Keys     ┌─────────────────┐
│   DynamoDB      │◄──────────────►│    AWS KMS      │
│   (Encrypted)   │                │   (Key Mgmt)    │
└─────────────────┘                └─────────────────┘
┌─────────────────┐   S3-SSE       ┌─────────────────┐
│   S3 Buckets    │◄──────────────►│   CloudTrail    │
│   (Encrypted)   │                │    (Audit)      │
└─────────────────┘                └─────────────────┘
```

---

## 8. Implementation Guidelines

### 8.1 Development Best Practices

#### 8.1.1 Code Organization

```
SafeHaven/
├── backend/
│   ├── functions/
│   │   ├── auth/                    # Authentication services
│   │   │   ├── shelter-auth.js
│   │   │   ├── responder-auth.js
│   │   │   └── jwt-utils.js
│   │   ├── shelters/                # Shelter management
│   │   │   ├── create-shelter.js
│   │   │   ├── update-status.js
│   │   │   └── get-shelters.js
│   │   ├── alerts/                  # Alert system
│   │   │   ├── create-alert.js
│   │   │   ├── acknowledge-alert.js
│   │   │   └── resolve-alert.js
│   │   └── shared/                  # Common utilities
│   │       ├── db-utils.js
│   │       ├── validation.js
│   │       └── response-utils.js
│   ├── infrastructure/              # Infrastructure as Code
│   │   ├── api-gateway.yaml
│   │   ├── dynamodb.yaml
│   │   └── sns-sqs.yaml
│   └── tests/                       # Backend tests
└── frontend/
    ├── mobile/                      # React Native app
    │   ├── src/
    │   │   ├── screens/
    │   │   ├── components/
    │   │   ├── services/
    │   │   └── utils/
    │   └── __tests__/
    └── dashboard/                   # React web app
        ├── src/
        │   ├── components/
        │   ├── pages/
        │   ├── services/
        │   └── hooks/
        └── __tests__/
```

#### 8.1.2 API Design Standards

**RESTful API Conventions:**
```javascript
// Good: Consistent resource naming
GET    /api/shelters              // List shelters
POST   /api/shelters              // Create shelter
GET    /api/shelters/{id}         // Get specific shelter
PUT    /api/shelters/{id}         // Update shelter
DELETE /api/shelters/{id}         // Delete shelter

// Good: Nested resources
PUT    /api/shelters/{id}/status  // Update shelter status
POST   /api/shelters/{id}/alerts  // Create alert for shelter

// Good: Consistent response format
{
  "success": true,
  "data": {...},
  "timestamp": "2025-09-19T14:30:00Z",
  "requestId": "req-12345"
}
```

#### 8.1.3 Error Handling Patterns

**Standardized Error Responses:**
```javascript
// Error response format
{
  "success": false,
  "error": {
    "code": "SHELTER_NOT_FOUND",
    "message": "Shelter with ID 'shelter-001' not found",
    "details": {
      "shelterId": "shelter-001",
      "timestamp": "2025-09-19T14:30:00Z"
    }
  },
  "requestId": "req-12345"
}

// Error handling in Lambda
exports.handler = async (event) => {
  try {
    // Business logic here
    return successResponse(data);
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(error);
  }
};
```

### 8.2 Performance Optimization Guidelines

#### 8.2.1 Lambda Function Optimization

```javascript
// Connection pooling for DynamoDB
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  maxRetries: 3,
  retryDelayOptions: {
    customBackoff: function(retryCount) {
      return Math.pow(2, retryCount) * 100;
    }
  }
});

// Efficient data fetching
const getBatchShelters = async (shelterIds) => {
  const params = {
    RequestItems: {
      [SHELTERS_TABLE]: {
        Keys: shelterIds.map(id => ({ shelterId: id })),
        ProjectionExpression: 'shelterId, #name, #status, capacity, #location',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#status': 'status', 
          '#location': 'location'
        }
      }
    }
  };
  
  return await dynamodb.batchGet(params).promise();
};
```

#### 8.2.2 Frontend Performance

**React Native Optimization:**
```javascript
// Efficient list rendering
import { FlatList, memo } from 'react-native';

const ShelterListItem = memo(({ shelter, onPress }) => (
  <TouchableOpacity onPress={() => onPress(shelter.id)}>
    <ShelterCard shelter={shelter} />
  </TouchableOpacity>
));

const ShelterList = ({ shelters }) => (
  <FlatList
    data={shelters}
    renderItem={({ item }) => <ShelterListItem shelter={item} />}
    keyExtractor={item => item.id}
    getItemLayout={(data, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    })}
    removeClippedSubviews={true}
    maxToRenderPerBatch={10}
    windowSize={10}
  />
);
```

**React Dashboard Optimization:**
```javascript
// Efficient map rendering with clustering
import { useMemo, useCallback } from 'react';

const Dashboard = ({ shelters }) => {
  const clusteredShelters = useMemo(() => {
    return clusterShelters(shelters, mapBounds);
  }, [shelters, mapBounds]);

  const handleShelterClick = useCallback((shelterId) => {
    setSelectedShelter(shelterId);
  }, []);

  return (
    <Map>
      {clusteredShelters.map(cluster => (
        <MarkerCluster 
          key={cluster.id}
          shelters={cluster.shelters}
          onClick={handleShelterClick}
        />
      ))}
    </Map>
  );
};
```

### 8.3 Testing and Quality Assurance

#### 8.3.1 Testing Strategy

**Unit Testing (Jest):**
```javascript
// Example Lambda function test
const { handler } = require('../functions/shelters/update-status');

describe('Update Shelter Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should update shelter capacity successfully', async () => {
    const event = {
      pathParameters: { id: 'shelter-001' },
      body: JSON.stringify({
        capacity: { current: 150, maximum: 200 }
      })
    };

    const result = await handler(event);
    
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).success).toBe(true);
  });

  test('should handle invalid shelter ID', async () => {
    const event = {
      pathParameters: { id: 'invalid-id' },
      body: JSON.stringify({
        capacity: { current: 150, maximum: 200 }
      })
    };

    const result = await handler(event);
    
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).success).toBe(false);
  });
});
```

**Integration Testing:**
```javascript
// Example API integration test
describe('Shelter API Integration', () => {
  test('should handle complete shelter update flow', async () => {
    // 1. Create shelter
    const createResponse = await api.post('/shelters', shelterData);
    const shelterId = createResponse.data.shelterId;

    // 2. Update status
    const updateResponse = await api.put(`/shelters/${shelterId}/status`, {
      capacity: { current: 100, maximum: 200 }
    });

    // 3. Verify update
    const getResponse = await api.get(`/shelters/${shelterId}`);
    
    expect(getResponse.data.capacity.current).toBe(100);
  });
});
```

#### 8.3.2 Quality Gates

**Pre-Deployment Checklist:**
- [ ] All unit tests passing
- [ ] Integration tests successful  
- [ ] ESLint violations resolved
- [ ] Security scan completed
- [ ] Performance benchmarks met
- [ ] API documentation updated

### 8.4 Monitoring and Observability

#### 8.4.1 CloudWatch Configuration

**Custom Metrics:**
```javascript
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

const publishMetric = async (metricName, value, unit = 'Count') => {
  const params = {
    Namespace: 'SafeHaven/Application',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  };
  
  await cloudwatch.putMetricData(params).promise();
};

// Usage in Lambda functions
await publishMetric('ShelterStatusUpdates', 1);
await publishMetric('AlertsCreated', 1);
await publishMetric('ResponseTime', duration, 'Milliseconds');
```

**Structured Logging:**
```javascript
const log = (level, message, context = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(),
    message,
    requestId: context.requestId,
    shelterId: context.shelterId,
    userId: context.userId,
    ...context
  };
  
  console.log(JSON.stringify(logEntry));
};

// Usage
log('info', 'Shelter status updated', { 
  shelterId: 'shelter-001', 
  capacity: 150 
});
```

---

**Document Control:**
- **Version:** 1.0
- **Last Updated:** September 19, 2025
- **Review Date:** September 21, 2025
- **Approval:** Team SaveHaven

**Document Status:** APPROVED FOR DEVELOPMENT

---

*This Software Architecture Diagram document provides the technical blueprint for SafeHaven Connect implementation during the Breaking Barriers Hackathon 2025. Refer to this document for architectural decisions and implementation patterns.*
