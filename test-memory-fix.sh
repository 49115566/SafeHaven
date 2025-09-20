#!/bin/bash

# Test Memory Fix Verification Script
# This script runs tests individually to verify they don't cause memory issues

echo "🔍 Testing individual test files for memory issues..."

# Function to run a single test with monitoring
run_test_with_monitoring() {
    local test_file=$1
    local test_name=$2
    
    echo "📋 Testing: $test_name"
    echo "📂 File: $test_file"
    
    # Run test with memory constraints
    timeout 60s npm test -- "$test_file" --maxWorkers=1 --forceExit --detectOpenHandles
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "✅ $test_name - PASSED"
    elif [ $exit_code -eq 124 ]; then
        echo "⏰ $test_name - TIMEOUT (potential memory issue)"
    else
        echo "❌ $test_name - FAILED (exit code: $exit_code)"
    fi
    
    echo "---"
    sleep 2
}

# Navigate to dashboard and test the problematic files
cd /root/code/SafeHaven/dashboard

echo "🎯 Testing Dashboard Integration Tests (Previously Problematic)..."

run_test_with_monitoring "src/__tests__/integration/aws-location-map.integration.test.tsx" "AWS Location Map Integration"
run_test_with_monitoring "src/__tests__/integration/dashboard.integration.test.tsx" "Dashboard Integration"

echo "🏁 Test monitoring complete!"