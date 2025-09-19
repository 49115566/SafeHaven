# SafeHaven Connect API Documentation

## Overview

The SafeHaven Connect API provides RESTful endpoints for managing emergency shelters, alerts, and real-time communication between shelter operators and first responders.

**Base URL**: `https://api.safehaven.example.com`  
**API Version**: v1  
**Authentication**: JWT Bearer tokens

## Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "operator@shelter.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "user-123",
      "email": "operator@shelter.com",
      "role": "shelter_operator",
      "profile": {
        "firstName": "John",
        "lastName": "Doe"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "email": "new-operator@shelter.com",
  "password": "securepassword",
  "role": "shelter_operator",
  "profile": {
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+1-555-0123"
  }
}
```

## Shelters

### List All Shelters
```http
GET /shelters
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): Filter by shelter status
- `hasCapacity` (optional): Filter shelters with available capacity
- `lat` & `lng` & `radius` (optional): Geographic filtering

**Response:**
```json
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
      "capacity": {
        "current": 150,
        "maximum": 500
      },
      "resources": {
        "food": "adequate",
        "water": "low",
        "medical": "adequate",
        "bedding": "adequate"
      },
      "status": "available",
      "urgentNeeds": [],
      "lastUpdated": "2025-09-19T14:30:00Z"
    }
  ]
}
```

### Create Shelter
```http
POST /shelters
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Community Center Shelter",
  "location": {
    "latitude": 32.7555,
    "longitude": -96.7964,
    "address": "123 Main St, Dallas, TX 75201"
  },
  "capacity": {
    "maximum": 200
  },
  "contactInfo": {
    "phone": "+1-555-0199",
    "email": "contact@communitycenter.org"
  }
}
```

### Update Shelter Status
```http
PUT /shelters/{shelterId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "capacity": {
    "current": 175,
    "maximum": 200
  },
  "resources": {
    "food": "low",
    "water": "critical"
  },
  "status": "limited",
  "urgentNeeds": ["medical supplies", "water"]
}
```

## Alerts

### List Alerts
```http
GET /alerts
Authorization: Bearer {token}
```

**Query Parameters:**
- `shelterId` (optional): Filter by shelter
- `status` (optional): Filter by alert status
- `priority` (optional): Filter by priority level

### Create Alert
```http
POST /alerts
Authorization: Bearer {token}
Content-Type: application/json

{
  "shelterId": "shelter-001",
  "type": "medical_emergency",
  "priority": "critical",
  "title": "Medical Emergency - Immediate Assistance Needed",
  "description": "We have a cardiac emergency and need immediate medical response. Patient is stable but requires transport to hospital."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alertId": "alert-456",
    "shelterId": "shelter-001",
    "type": "medical_emergency",
    "priority": "critical",
    "title": "Medical Emergency - Immediate Assistance Needed",
    "description": "We have a cardiac emergency...",
    "status": "open",
    "createdBy": "user-123",
    "timestamp": 1695139800,
    "createdAt": "2025-09-19T14:30:00Z"
  }
}
```

### Acknowledge Alert
```http
PUT /alerts/{alertId}/acknowledge
Authorization: Bearer {token}
Content-Type: application/json

{
  "estimatedResponse": "15 minutes",
  "notes": "EMT unit dispatched, ETA 15 minutes"
}
```

## WebSocket Events

Connect to: `wss://api.safehaven.example.com/ws`

### Connection
```javascript
const ws = new WebSocket('wss://api.safehaven.example.com/ws', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

### Events

#### Shelter Update
```json
{
  "type": "SHELTER_UPDATE",
  "data": {
    "shelterId": "shelter-001",
    "capacity": { "current": 180, "maximum": 200 },
    "status": "limited"
  },
  "timestamp": "2025-09-19T14:35:00Z"
}
```

#### New Alert
```json
{
  "type": "ALERT",
  "data": {
    "alertId": "alert-789",
    "shelterId": "shelter-002",
    "type": "resource_critical",
    "priority": "high",
    "title": "Critical Water Shortage"
  },
  "timestamp": "2025-09-19T14:40:00Z"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Error Response Format

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    },
    "statusCode": 400
  },
  "timestamp": "2025-09-19T14:30:00Z"
}
```

## Rate Limiting

- **Authentication**: 5 requests per minute
- **General API**: 100 requests per minute
- **WebSocket**: 1 connection per user

## Testing

### Using curl
```bash
# Login
curl -X POST https://api.safehaven.example.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Get shelters
curl -X GET https://api.safehaven.example.com/shelters \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Postman Collection
Import the Postman collection from `docs/postman/SafeHaven-API.postman_collection.json` for easy testing.

## SDK Usage

### JavaScript/TypeScript
```typescript
import { SafeHavenAPI } from 'safehaven-sdk';

const api = new SafeHavenAPI({
  apiUrl: 'https://api.safehaven.example.com',
  token: 'your-jwt-token'
});

// Get all shelters
const shelters = await api.shelters.list();

// Update shelter status
await api.shelters.updateStatus('shelter-001', {
  capacity: { current: 150, maximum: 200 },
  status: 'available'
});
```