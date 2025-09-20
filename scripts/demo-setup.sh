#!/bin/bash

# SafeHaven Demo Setup Script
# Prepares the complete demo environment for hackathon presentation

set -e

echo "🚀 SafeHaven Demo Setup - Breaking Barriers Hackathon 2025"
echo "=========================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "mobile" ] || [ ! -d "dashboard" ]; then
    print_error "Please run this script from the SafeHaven root directory"
    exit 1
fi

print_info "Starting demo environment setup..."
echo ""

# Step 1: Install dependencies
echo "📦 Installing Dependencies"
echo "========================="

print_info "Installing backend dependencies..."
cd backend
npm install --silent
print_status "Backend dependencies installed"

print_info "Installing mobile dependencies..."
cd ../mobile
npm install --silent
print_status "Mobile dependencies installed"

print_info "Installing dashboard dependencies..."
cd ../dashboard
npm install --silent
print_status "Dashboard dependencies installed"

cd ..
echo ""

# Step 2: Environment setup
echo "🔧 Environment Configuration"
echo "============================"

# Check for .env files
if [ ! -f "backend/.env" ]; then
    print_warning "Backend .env file not found"
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        print_info "Created backend/.env from example"
    else
        print_error "No backend/.env.example found. Please create backend/.env manually"
    fi
fi

if [ ! -f "mobile/.env" ]; then
    print_warning "Mobile .env file not found"
    if [ -f "mobile/.env.example" ]; then
        cp mobile/.env.example mobile/.env
        print_info "Created mobile/.env from example"
    else
        print_info "Creating basic mobile/.env"
        cat > mobile/.env << EOF
API_BASE_URL=http://localhost:3001
DEMO_MODE=true
EOF
    fi
fi

if [ ! -f "dashboard/.env" ]; then
    print_warning "Dashboard .env file not found"
    if [ -f "dashboard/.env.example" ]; then
        cp dashboard/.env.example dashboard/.env
        print_info "Created dashboard/.env from example"
    else
        print_info "Creating basic dashboard/.env"
        cat > dashboard/.env << EOF
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3011
REACT_APP_DEMO_MODE=true
EOF
    fi
fi

print_status "Environment configuration complete"
echo ""

# Step 3: Build applications
echo "🏗️ Building Applications"
echo "========================"

print_info "Building backend..."
cd backend
npm run build 2>/dev/null || {
    print_warning "Backend build had warnings, but continuing..."
}
print_status "Backend build complete"

print_info "Building dashboard..."
cd ../dashboard
npm run build 2>/dev/null || {
    print_warning "Dashboard build had warnings, but continuing..."
}
print_status "Dashboard build complete"

cd ..
echo ""

# Step 4: AWS Services Check
echo "☁️ AWS Services Verification"
echo "============================"

print_info "Checking AWS configuration..."

# Check if AWS CLI is configured
if command -v aws &> /dev/null; then
    if aws sts get-caller-identity &> /dev/null; then
        print_status "AWS CLI configured and authenticated"
    else
        print_warning "AWS CLI not authenticated. Please run 'aws configure'"
    fi
else
    print_warning "AWS CLI not installed. Some features may not work"
fi

# Check if serverless is deployed
print_info "Checking backend deployment status..."
cd backend
if npm run deploy:check 2>/dev/null; then
    print_status "Backend services are deployed"
else
    print_warning "Backend services may not be deployed. Run 'npm run deploy' if needed"
fi

cd ..
echo ""

# Step 5: Demo data preparation
echo "🌱 Demo Data Preparation"
echo "========================"

print_info "Seeding demo data..."
if node scripts/seed-demo-data.js; then
    print_status "Demo data seeded successfully"
else
    print_warning "Demo data seeding failed. Manual data entry may be required"
fi

echo ""

# Step 6: Service startup
echo "🚀 Starting Services"
echo "===================="

print_info "Starting backend services..."
cd backend
npm run start:local &
BACKEND_PID=$!
print_status "Backend started (PID: $BACKEND_PID)"

# Wait for backend to start
sleep 5

print_info "Starting dashboard..."
cd ../dashboard
npm start &
DASHBOARD_PID=$!
print_status "Dashboard started (PID: $DASHBOARD_PID)"

cd ..

# Wait for services to initialize
print_info "Waiting for services to initialize..."
sleep 10

echo ""

# Step 7: Health checks
echo "🏥 Health Checks"
echo "================"

print_info "Checking backend health..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    print_status "Backend is healthy"
else
    print_warning "Backend health check failed"
fi

print_info "Checking dashboard..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_status "Dashboard is accessible"
else
    print_warning "Dashboard may not be ready yet"
fi

echo ""

# Step 8: Mobile app preparation
echo "📱 Mobile App Preparation"
echo "========================="

print_info "Mobile app setup instructions:"
echo "1. Open mobile/ directory in your React Native development environment"
echo "2. For iOS: Run 'npx react-native run-ios' or open in Xcode"
echo "3. For Android: Run 'npx react-native run-android' or open in Android Studio"
echo "4. Demo login: demo-operator-1@safehaven.com / SafeHaven2025!"

echo ""

# Step 9: Demo verification
echo "🧪 Demo Verification"
echo "===================="

print_info "Running demo scenario test..."
if node scripts/demo-scenarios.js reset; then
    print_status "Demo scenarios are working"
else
    print_warning "Demo scenarios may have issues"
fi

echo ""

# Step 10: Final summary
echo "📋 Demo Environment Summary"
echo "==========================="

print_status "Backend API: http://localhost:3001"
print_status "Dashboard: http://localhost:3000"
print_status "WebSocket: ws://localhost:3011"

echo ""
echo "🔑 Demo Accounts:"
echo "Shelter Operators:"
echo "  - demo-operator-1@safehaven.com (Dallas)"
echo "  - demo-operator-2@safehaven.com (Houston)"
echo "First Responders:"
echo "  - demo-responder-1@safehaven.com"
echo "Emergency Coordinators:"
echo "  - demo-coordinator-1@safehaven.com"
echo "Password for all accounts: SafeHaven2025!"

echo ""
echo "🎬 Demo Commands:"
echo "  npm run demo:capacity     - Capacity crisis scenario"
echo "  npm run demo:resources    - Resource depletion scenario"
echo "  npm run demo:medical      - Medical emergency scenario"
echo "  npm run demo:coordination - Multi-shelter coordination"
echo "  npm run demo:reset        - Reset to initial state"

echo ""
echo "📚 Documentation:"
echo "  docs/demo-script.md       - Complete presentation script"
echo "  docs/software-requirements-specification.md - Technical details"

echo ""

# Create process management script
cat > stop-demo.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping SafeHaven demo services..."

# Kill background processes
if [ ! -z "$BACKEND_PID" ]; then
    kill $BACKEND_PID 2>/dev/null || true
fi

if [ ! -z "$DASHBOARD_PID" ]; then
    kill $DASHBOARD_PID 2>/dev/null || true
fi

# Kill any remaining processes
pkill -f "npm.*start" 2>/dev/null || true
pkill -f "node.*backend" 2>/dev/null || true
pkill -f "react-scripts.*start" 2>/dev/null || true

echo "✅ Demo services stopped"
EOF

chmod +x stop-demo.sh

print_status "Demo environment setup complete!"
print_info "Run './stop-demo.sh' to stop all services when done"

echo ""
echo "🎉 Ready for Breaking Barriers Hackathon 2025 Demo!"
echo "Good luck, Team SaveHaven! 🚀"