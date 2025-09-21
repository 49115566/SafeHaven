#!/bin/bash

echo "🔧 Testing SafeHaven Connect Setup..."

# Test shared package
echo "📦 Testing shared package..."
cd shared
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Shared package builds successfully"
else
    echo "❌ Shared package build failed"
    exit 1
fi
cd ..

# Test backend
echo "🔧 Testing backend..."
cd backend
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Backend builds successfully"
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

# Test dashboard
echo "🌐 Testing dashboard..."
cd dashboard
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Dashboard builds successfully"
else
    echo "❌ Dashboard build failed"
    exit 1
fi
cd ..

# Test mobile (TypeScript only)
echo "📱 Testing mobile TypeScript..."
cd mobile
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ Mobile TypeScript compiles successfully"
else
    echo "❌ Mobile TypeScript compilation failed"
    exit 1
fi
cd ..

echo ""
echo "🎉 All components are working correctly!"
echo ""
echo "To start development:"
echo "  npm run dev              # Start backend + dashboard"
echo "  npm run dev:mobile       # Start mobile app"
echo ""
echo "Individual components:"
echo "  npm run dev:backend      # Backend only"
echo "  npm run dev:dashboard    # Dashboard only"
echo ""