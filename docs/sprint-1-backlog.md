# Sprint 1 Backlog - SafeHaven Connect
## Breaking Barriers Hackathon 2025

**Sprint Duration:** 16 hours (September 19-20, 2025)  
**Sprint Goal:** Establish working end-to-end infrastructure with basic authentication and status update functionality  
**Team:** SaveHaven (Ryan Chui, Craig Truitt, Muxin Ge, Rashedul Islam Seum)

---

## 📊 Infrastructure Assessment Summary

### ✅ **Existing Assets (Strong Foundation)**
- **Backend**: Serverless infrastructure deployed with Lambda functions, API Gateway, DynamoDB tables
- **API Endpoints**: REST endpoints for auth, shelters, alerts, and location services
- **Database Schema**: DynamoDB tables for Shelters, Users, Alerts with proper schemas
- **AWS Location Service**: Map and Place Index resources configured
- **Mobile App**: React Native with Expo, Redux store, navigation structure
- **Dashboard**: React TypeScript with Tailwind CSS, AWS Location Map component
- **Shared Types**: Consistent TypeScript interfaces across all applications

### ⚠️ **Critical Gaps Identified**
- **Authentication**: Mock implementations need real JWT logic
- **WebSocket**: Infrastructure exists but disabled, needs activation
- **Mobile Screens**: Placeholder components need full implementation
- **Real-time Updates**: WebSocket clients not implemented
- **Data Integration**: Frontend apps not connected to backend APIs
- **Error Handling**: Limited error boundaries and validation

---

## 🎯 Sprint 1 Goal & Success Criteria

**Primary Goal:** Deliver a working MVP demonstrating real-time shelter-responder communication

**Success Criteria:**
1. ✅ Shelter operators can register and authenticate
2. ✅ Shelter operators can update status via mobile app
3. ✅ Status updates appear on responder dashboard within 5 seconds
4. ✅ Dashboard shows real-time shelter data with working map
5. ✅ Basic error handling prevents crashes

**Demo Scenario:**
- Shelter operator logs in on mobile → Updates capacity status → Dashboard immediately reflects changes

---

## 📋 Sprint 1 Backlog Items

### **EPIC 1: Foundation Infrastructure (Critical - Must Complete)**

#### **SH-S1-001: Complete Backend Authentication Service**
**Priority:** P0 - Critical  
**Story Points:** 5  
**Assignee:** Craig Truitt  
**Dependencies:** None

**User Story:**
> As a shelter operator, I want to securely authenticate with valid credentials so that I can access the shelter management system.

**Current State Analysis:**
- ✅ API endpoints exist (`/auth/login`, `/auth/register`)
- ⚠️ Functions have mock implementations
- ✅ DynamoDB Users table configured
- ⚠️ JWT secret configured but validation missing

**Acceptance Criteria:**
- [ ] JWT token generation with proper expiration (24 hours)
- [ ] Password hashing using bcrypt with salt rounds >= 10
- [ ] User registration creates records in DynamoDB Users table
- [ ] Login validates credentials against stored user data
- [ ] JWT verification middleware works for protected endpoints
- [ ] Error responses follow consistent API format
- [ ] Rate limiting applied (10 attempts per 5 minutes per IP)

**Technical Tasks:**
- [ ] Implement JWT token generation in `auth/login.ts`
- [ ] Add bcrypt password hashing in `auth/register.ts`
- [ ] Complete JWT verification in `auth/verify.ts`
- [ ] Add DynamoDB operations for user CRUD
- [ ] Add input validation with Joi schemas
- [ ] Create user lookup by email functionality
- [ ] Add error handling for auth failures

**Definition of Done:**
- [ ] Postman tests pass for all auth endpoints
- [ ] Unit tests written and passing
- [ ] Security best practices implemented
- [ ] API documentation updated

---

#### **SH-S1-002: Enable WebSocket Infrastructure**
**Priority:** P0 - Critical  
**Story Points:** 8  
**Assignee:** Craig Truitt  
**Dependencies:** SH-S1-001 (for auth)

**User Story:**
> As a system administrator, I want real-time bidirectional communication between mobile apps and dashboard so that status updates propagate immediately.

**Current State Analysis:**
- ✅ WebSocket Lambda functions exist (`connect.ts`, `disconnect.ts`, `default.ts`)
- ⚠️ Functions are commented out in `serverless.yml`
- ✅ Connection storage logic partially implemented
- ⚠️ Message broadcasting not implemented

**Acceptance Criteria:**
- [ ] WebSocket API Gateway deployed and accessible
- [ ] Connection management stores connectionId in DynamoDB
- [ ] Message broadcasting to all connected clients works
- [ ] Connection heartbeat mechanism prevents timeouts
- [ ] Graceful handling of connection failures
- [ ] Authentication required for WebSocket connections
- [ ] Message queuing for offline clients

**Technical Tasks:**
- [ ] Uncomment and configure WebSocket routes in `serverless.yml`
- [ ] Create WebSocket Connections table in DynamoDB
- [ ] Complete connection storage in `websocket/connect.ts`
- [ ] Implement message broadcasting in `websocket/default.ts`
- [ ] Add connection cleanup in `websocket/disconnect.ts`
- [ ] Integrate SNS for message publishing
- [ ] Add authentication to WebSocket connections

**Definition of Done:**
- [ ] WebSocket connections stable for 10+ minutes
- [ ] Messages broadcast to all clients within 3 seconds
- [ ] Connection state persisted and recoverable
- [ ] Error scenarios handled gracefully

---

#### **SH-S1-003: Implement Mobile Authentication Screens**
**Priority:** P0 - Critical  
**Story Points:** 5  
**Assignee:** Rashedul Islam Seum  
**Dependencies:** SH-S1-001

**User Story:**
> As a shelter operator, I want intuitive login and registration screens so that I can quickly access the app during emergencies.

**Current State Analysis:**
- ✅ Navigation structure with `LoginScreen` component
- ✅ Redux auth slice with actions configured
- ⚠️ Login screen has basic layout only
- ⚠️ No form fields or authentication logic
- ✅ AsyncStorage and Redux persist configured

**Acceptance Criteria:**
- [ ] Login form with email/password fields and validation
- [ ] Registration form with shelter details collection
- [ ] Form validation with real-time error messages
- [ ] Loading states during authentication requests
- [ ] Success/error notifications using Toast
- [ ] Secure token storage using AsyncStorage
- [ ] Auto-login on app restart if token valid

**Technical Tasks:**
- [ ] Create login form with input fields in `LoginScreen.tsx`
- [ ] Implement form validation using Formik or react-hook-form
- [ ] Connect login form to Redux auth actions
- [ ] Add API service calls to backend auth endpoints
- [ ] Implement secure token storage
- [ ] Add loading states and error handling
- [ ] Create registration flow with shelter setup
- [ ] Add navigation to dashboard on successful auth

**Definition of Done:**
- [ ] Login flow works end-to-end with backend
- [ ] Forms validate input and show errors
- [ ] Tokens persist across app restarts
- [ ] UI follows design guidelines and is responsive

---

#### **SH-S1-004: Basic Shelter Status Update Implementation**
**Priority:** P0 - Critical  
**Story Points:** 8  
**Assignee:** Rashedul Islam Seum  
**Dependencies:** SH-S1-003, SH-S1-002

**User Story:**
> As a shelter operator, I want to quickly update our current capacity status so that first responders know our availability.

**Current State Analysis:**
- ✅ API endpoint exists (`PUT /shelters/{id}/status`)
- ✅ Redux shelter slice configured
- ⚠️ `StatusUpdateScreen` is placeholder
- ✅ Backend validation and notification service ready

**Acceptance Criteria:**
- [ ] Current capacity display with +/- buttons
- [ ] Maximum capacity setting capability
- [ ] Status selection (Available/Limited/Full/Emergency)
- [ ] One-tap update with immediate UI feedback
- [ ] Offline queue for updates when network poor
- [ ] Confirmation when update successful
- [ ] Error handling for failed updates

**Technical Tasks:**
- [ ] Design and implement capacity counter component
- [ ] Create status selector component
- [ ] Build main status update screen layout
- [ ] Connect to Redux store for state management
- [ ] Implement API service for status updates
- [ ] Add offline storage with AsyncStorage
- [ ] Implement automatic sync when online
- [ ] Add success/error notifications

**Definition of Done:**
- [ ] Status updates work reliably online and offline
- [ ] UI provides immediate visual feedback
- [ ] Updates sync automatically when connection restored
- [ ] All status types selectable and functional

---

### **EPIC 2: Dashboard Real-time Integration (High Priority)**

#### **SH-S1-005: Dashboard Real-time Data Integration**
**Priority:** P1 - High  
**Story Points:** 8  
**Assignee:** Muxin Ge  
**Dependencies:** SH-S1-002

**User Story:**
> As a first responder, I want to see live shelter status updates on the dashboard so that I can make informed resource allocation decisions.

**Current State Analysis:**
- ✅ `DashboardPage` with sample data display
- ✅ `AwsLocationMap` component working
- ⚠️ No real-time WebSocket client
- ⚠️ Using hardcoded sample data

**Acceptance Criteria:**
- [ ] WebSocket client connects and maintains connection
- [ ] Real-time shelter data updates without page refresh
- [ ] Connection status indicator visible
- [ ] Automatic reconnection on connection loss
- [ ] Fallback to HTTP polling if WebSocket fails
- [ ] Loading states during data fetch
- [ ] Error boundary for WebSocket failures

**Technical Tasks:**
- [ ] Implement WebSocket client service using socket.io-client
- [ ] Create real-time data context/provider
- [ ] Add automatic reconnection logic with exponential backoff
- [ ] Implement data caching strategy (5-minute cache)
- [ ] Connect map component to real-time data
- [ ] Add connection status indicator
- [ ] Create error boundary component
- [ ] Add polling fallback mechanism

**Definition of Done:**
- [ ] Dashboard updates within 5 seconds of backend changes
- [ ] No page refreshes required for updates
- [ ] Connection issues handled gracefully
- [ ] Performance smooth with 20+ shelters

---

#### **SH-S1-006: Dashboard Authentication Integration**
**Priority:** P1 - High  
**Story Points:** 3  
**Assignee:** Muxin Ge  
**Dependencies:** SH-S1-001

**User Story:**
> As a first responder, I want to securely log into the dashboard so that I can access real-time shelter information.

**Current State Analysis:**
- ✅ `LoginPage` placeholder exists
- ✅ `useAuth` hook structure in place
- ✅ React Router with auth guards configured
- ⚠️ No actual login form or logic

**Acceptance Criteria:**
- [ ] Login form with email/password fields
- [ ] Integration with backend auth API
- [ ] JWT token storage in localStorage
- [ ] Auto-redirect to dashboard on successful login
- [ ] Logout functionality clears session
- [ ] Route protection enforces authentication
- [ ] Session management with token refresh

**Technical Tasks:**
- [ ] Implement login form in `LoginPage.tsx`
- [ ] Complete `useAuth` hook with API integration
- [ ] Add API service for authentication
- [ ] Implement token storage and retrieval
- [ ] Add logout functionality
- [ ] Test route protection and redirects
- [ ] Add session timeout handling

**Definition of Done:**
- [ ] Login flow works with backend authentication
- [ ] Protected routes require valid authentication
- [ ] Session management works correctly
- [ ] UI provides clear feedback on auth status

---

### **EPIC 3: Core Features Implementation (Medium Priority)**

#### **SH-S1-007: Enhanced Mobile Status Updates**
**Priority:** P2 - Medium  
**Story Points:** 5  
**Assignee:** Rashedul Islam Seum  
**Dependencies:** SH-S1-004

**User Story:**
> As a shelter operator, I want to update resource levels (food, water, medical supplies) so that responders know what we need.

**Acceptance Criteria:**
- [ ] Resource level indicators (Adequate/Low/Critical)
- [ ] Quick toggle switches for each resource type
- [ ] Visual indicators with color coding
- [ ] Bulk update capability for all resources
- [ ] Urgent needs text field for special requests
- [ ] Resource history tracking

**Technical Tasks:**
- [ ] Create resource status toggle components
- [ ] Add resource level selection UI
- [ ] Implement bulk update functionality
- [ ] Add urgent needs text input
- [ ] Connect to backend resource update API
- [ ] Add validation for resource combinations

**Definition of Done:**
- [ ] All resource types updatable independently
- [ ] Color coding consistent across app
- [ ] Updates reflect immediately in UI
- [ ] Data validation prevents invalid states

---

#### **SH-S1-008: Basic Emergency Alert System**
**Priority:** P2 - Medium  
**Story Points:** 6  
**Assignee:** Rashedul Islam Seum  
**Dependencies:** SH-S1-003, SH-S1-002

**User Story:**
> As a shelter operator, I want to send urgent alerts to first responders so that we get immediate assistance during critical situations.

**Current State Analysis:**
- ✅ Alert endpoints exist (`POST /alerts`)
- ✅ `AlertScreen` component placeholder
- ✅ Redux alert slice configured
- ✅ Alert types defined in shared types

**Acceptance Criteria:**
- [ ] Emergency button prominently displayed
- [ ] Alert type selection (Medical/Security/Resource/Evacuation)
- [ ] Optional message field for details
- [ ] Confirmation dialog before sending
- [ ] Visual confirmation when alert sent
- [ ] Alert history view

**Technical Tasks:**
- [ ] Design emergency alert button component
- [ ] Create alert type selection interface
- [ ] Implement alert creation form
- [ ] Add confirmation dialog
- [ ] Connect to backend alert API
- [ ] Add alert status tracking
- [ ] Implement alert history view

**Definition of Done:**
- [ ] Alerts sent successfully to backend
- [ ] All alert types selectable
- [ ] Confirmation prevents accidental alerts
- [ ] Alert history accessible

---

#### **SH-S1-009: Dashboard Alert Management**
**Priority:** P2 - Medium  
**Story Points:** 4  
**Assignee:** Muxin Ge  
**Dependencies:** SH-S1-005, SH-S1-008

**User Story:**
> As a first responder, I want to see urgent alerts from shelters so that I can coordinate appropriate assistance.

**Acceptance Criteria:**
- [ ] Real-time alert notifications appear immediately
- [ ] Alert panel shows current active alerts
- [ ] Color-coded alerts by priority/type
- [ ] Alert acknowledgment capability
- [ ] Alert details modal with full information
- [ ] Sound/visual notifications for critical alerts

**Technical Tasks:**
- [ ] Create alert notification component
- [ ] Implement alert panel in dashboard
- [ ] Add alert details modal
- [ ] Connect to real-time alert stream
- [ ] Add acknowledgment functionality
- [ ] Implement alert filtering and sorting

**Definition of Done:**
- [ ] Alerts appear within 5 seconds of creation
- [ ] All alert types display correctly
- [ ] Acknowledgment updates alert status
- [ ] Notifications don't interfere with map usage

---

### **EPIC 4: Infrastructure & Quality (Low Priority - If Time Permits)**

#### **SH-S1-010: Error Handling & Validation**
**Priority:** P3 - Low  
**Story Points:** 4  
**Assignee:** Ryan Chui  
**Dependencies:** All previous items

**User Story:**
> As a system user, I want meaningful error messages and validation so that I understand what went wrong and how to fix it.

**Acceptance Criteria:**
- [ ] Consistent error message format across all apps
- [ ] Form validation with clear error indicators
- [ ] Network error handling with retry options
- [ ] Graceful degradation for offline scenarios
- [ ] Error boundaries prevent app crashes
- [ ] Loading states for all async operations

**Technical Tasks:**
- [ ] Create error boundary components
- [ ] Implement global error handling
- [ ] Add form validation schemas
- [ ] Create network error retry logic
- [ ] Add loading state management
- [ ] Standardize error message formats

---

#### **SH-S1-011: Demo Data & Scenarios**
**Priority:** P1 - High (for demo)  
**Story Points:** 2  
**Assignee:** Ryan Chui  
**Dependencies:** Core functionality complete

**User Story:**
> As a demo presenter, I want realistic test data and scenarios so that I can effectively demonstrate the system capabilities.

**Acceptance Criteria:**
- [ ] Pre-populated shelter data in database
- [ ] Demo user accounts created
- [ ] Realistic scenarios for status updates
- [ ] Sample alerts for demonstration
- [ ] Geographic diversity in shelter locations
- [ ] Clear demo script with step-by-step actions

**Technical Tasks:**
- [ ] Create database seed script
- [ ] Generate realistic shelter data
- [ ] Create demo user accounts
- [ ] Prepare demo scenarios
- [ ] Document demo flow
- [ ] Test demo on clean environment

---

## 📊 Sprint Capacity & Resource Allocation

### **Team Member Allocation:**

**Craig Truitt (Backend Focus - 16 hours):**
- SH-S1-001: Backend Authentication (5 hrs)
- SH-S1-002: WebSocket Infrastructure (8 hrs)
- Support/Reviews: (3 hrs)

**Rashedul Islam Seum (Mobile Focus - 16 hours):**
- SH-S1-003: Mobile Authentication (5 hrs)
- SH-S1-004: Status Updates (8 hrs)
- SH-S1-008: Emergency Alerts (3 hrs)

**Muxin Ge (Dashboard Focus - 16 hours):**
- SH-S1-005: Real-time Integration (8 hrs)
- SH-S1-006: Dashboard Auth (3 hrs)
- SH-S1-009: Alert Management (4 hrs)
- Polish & Testing: (1 hr)

**Ryan Chui (DevOps/QA Focus - 16 hours):**
- SH-S1-011: Demo Data (2 hrs)
- SH-S1-010: Error Handling (4 hrs)
- Integration Testing: (4 hrs)
- Deployment & Setup: (3 hrs)
- Sprint Management: (3 hrs)

### **Estimated Story Points:**
- **Total Capacity:** 64 hours (4 people × 16 hours)
- **Total Story Points:** 58 points
- **Velocity Target:** 50-55 points (allows buffer for unforeseen issues)

---

## 🎯 Sprint Success Metrics

### **Functional Metrics:**
- [ ] End-to-end demo working (Shelter login → Status update → Dashboard display)
- [ ] Authentication working on both mobile and dashboard
- [ ] Real-time updates working within 5 seconds
- [ ] Map displaying shelter data correctly
- [ ] Mobile app navigates properly offline

### **Technical Metrics:**
- [ ] No critical bugs blocking core functionality
- [ ] API response times < 2 seconds
- [ ] WebSocket connection stability > 95%
- [ ] Mobile app loads < 3 seconds
- [ ] Dashboard loads < 5 seconds

### **Quality Metrics:**
- [ ] Error handling prevents crashes
- [ ] User feedback clear and actionable
- [ ] Consistent UI/UX across applications
- [ ] Code reviewed by at least one other team member

---

## 🚧 Risk Management

### **High Risk Items:**
1. **WebSocket Implementation Complexity**
   - **Mitigation:** Start early, have HTTP polling fallback
   - **Owner:** Craig Truitt

2. **AWS Location Service Configuration**
   - **Mitigation:** Test early, have static map fallback
   - **Owner:** Muxin Ge

3. **Mobile-Backend Integration**
   - **Mitigation:** Parallel development with mock APIs
   - **Owner:** Rashedul Islam Seum

### **Medium Risk Items:**
1. **Real-time Performance**
   - **Mitigation:** Simple initial implementation, optimize later
   
2. **Authentication Complexity**
   - **Mitigation:** Basic JWT implementation, enhance later

### **Contingency Plans:**
- If WebSocket fails: Use HTTP polling every 10 seconds
- If real-time fails: Use manual refresh button
- If mobile auth fails: Skip auth for demo
- If map fails: Use simple list view

---

## 📝 Sprint Planning Notes

### **Definition of Ready:**
- [ ] User story has clear acceptance criteria
- [ ] Dependencies identified and understood
- [ ] Story points estimated by team
- [ ] Technical approach discussed
- [ ] Assignee identified and available

### **Definition of Done:**
- [ ] Code complete and reviewed
- [ ] Acceptance criteria verified
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Deployed to staging environment
- [ ] Demo-ready functionality

### **Daily Standup Focus:**
- Progress on P0 items
- Blockers and dependencies
- Integration coordination
- Demo preparation status

---

**Sprint Start:** September 19, 2025 @ 8:00 AM  
**Sprint Review:** September 20, 2025 @ 11:00 PM  
**Sprint Retrospective:** September 20, 2025 @ 11:30 PM

*This Sprint 1 Backlog provides the foundation for SafeHaven Connect MVP delivery during the Breaking Barriers Hackathon 2025.*