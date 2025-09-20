/**
 * Tests for Demo Setup Script
 * Validates compliance with SH-S1-011 requirements and deployment specifications
 */

const fs = require('fs');
const path = require('path');

describe('Demo Setup Script - SH-S1-011 Compliance', () => {
  
  const setupScriptPath = path.join(__dirname, '..', 'demo-setup.sh');
  
  describe('Script Availability and Permissions', () => {
    test('demo setup script should exist and be executable', () => {
      expect(fs.existsSync(setupScriptPath)).toBe(true);
      
      const stats = fs.statSync(setupScriptPath);
      const isExecutable = (stats.mode & parseInt('111', 8)) !== 0;
      expect(isExecutable).toBe(true);
    });

    test('script should have proper shebang and structure', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should start with bash shebang
      expect(scriptContent.startsWith('#!/bin/bash')).toBe(true);
      
      // Should have error handling
      expect(scriptContent).toContain('set -e');
      
      // Should have colored output functions
      expect(scriptContent).toContain('print_status');
      expect(scriptContent).toContain('print_error');
      expect(scriptContent).toContain('print_warning');
    });
  });

  describe('Environment Setup Requirements', () => {
    test('should check for required project structure', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should verify project structure
      expect(scriptContent).toContain('package.json');
      expect(scriptContent).toContain('backend');
      expect(scriptContent).toContain('mobile');
      expect(scriptContent).toContain('dashboard');
    });

    test('should handle environment file creation', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should create .env files if missing
      expect(scriptContent).toContain('backend/.env');
      expect(scriptContent).toContain('mobile/.env');
      expect(scriptContent).toContain('dashboard/.env');
      
      // Should copy from examples
      expect(scriptContent).toContain('.env.example');
    });

    test('should install dependencies for all applications', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should install backend dependencies
      expect(scriptContent).toContain('cd backend');
      expect(scriptContent).toContain('npm install');
      
      // Should install mobile dependencies
      expect(scriptContent).toContain('cd ../mobile');
      
      // Should install dashboard dependencies
      expect(scriptContent).toContain('cd ../dashboard');
    });
  });

  describe('Build Process Validation', () => {
    test('should build all applications', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should build backend
      expect(scriptContent).toContain('npm run build');
      
      // Should handle build warnings gracefully
      expect(scriptContent).toContain('2>/dev/null');
      expect(scriptContent).toContain('build had warnings, but continuing');
    });

    test('should verify AWS services', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should check AWS CLI
      expect(scriptContent).toContain('aws sts get-caller-identity');
      expect(scriptContent).toContain('AWS CLI');
      
      // Should check deployment status
      expect(scriptContent).toContain('deployment status');
    });
  });

  describe('Service Startup and Health Checks', () => {
    test('should start backend and dashboard services', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should start backend
      expect(scriptContent).toContain('npm run start:local');
      expect(scriptContent).toContain('BACKEND_PID');
      
      // Should start dashboard
      expect(scriptContent).toContain('npm start');
      expect(scriptContent).toContain('DASHBOARD_PID');
    });

    test('should perform health checks', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should check backend health
      expect(scriptContent).toContain('http://localhost:3001/health');
      
      // Should check dashboard accessibility
      expect(scriptContent).toContain('http://localhost:3000');
      
      // Should use curl for health checks
      expect(scriptContent).toContain('curl -s');
    });

    test('should provide service URLs and demo information', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should display service URLs
      expect(scriptContent).toContain('Backend API: http://localhost:3001');
      expect(scriptContent).toContain('Dashboard: http://localhost:3000');
      expect(scriptContent).toContain('WebSocket: ws://localhost:3011');
      
      // Should provide demo account information
      expect(scriptContent).toContain('Demo Accounts:');
      expect(scriptContent).toContain('SafeHaven2025!');
    });
  });

  describe('Demo Data Integration', () => {
    test('should seed demo data', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should call demo data seeding
      expect(scriptContent).toContain('scripts/seed-demo-data.js');
      expect(scriptContent).toContain('Demo data seeded successfully');
    });

    test('should provide demo commands', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should list demo commands
      expect(scriptContent).toContain('npm run demo:capacity');
      expect(scriptContent).toContain('npm run demo:resources');
      expect(scriptContent).toContain('npm run demo:medical');
      expect(scriptContent).toContain('npm run demo:coordination');
      expect(scriptContent).toContain('npm run demo:reset');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle missing dependencies gracefully', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should check for required tools
      expect(scriptContent).toContain('command -v');
      
      // Should provide helpful error messages
      expect(scriptContent).toContain('print_error');
      expect(scriptContent).toContain('print_warning');
    });

    test('should create cleanup script', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should create stop script
      expect(scriptContent).toContain('stop-demo.sh');
      expect(scriptContent).toContain('chmod +x stop-demo.sh');
      
      // Should handle process cleanup
      expect(scriptContent).toContain('kill $BACKEND_PID');
      expect(scriptContent).toContain('kill $DASHBOARD_PID');
    });
  });

  describe('Mobile App Preparation', () => {
    test('should provide mobile app setup instructions', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should provide React Native instructions
      expect(scriptContent).toContain('React Native');
      expect(scriptContent).toContain('npx react-native run-ios');
      expect(scriptContent).toContain('npx react-native run-android');
      
      // Should provide demo login credentials
      expect(scriptContent).toContain('demo-operator-1@safehaven.com');
    });
  });

  describe('Documentation and User Guidance', () => {
    test('should reference documentation files', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should reference demo script
      expect(scriptContent).toContain('docs/demo-script.md');
      
      // Should reference technical documentation
      expect(scriptContent).toContain('software-requirements-specification.md');
    });

    test('should provide hackathon-specific messaging', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should mention Breaking Barriers Hackathon
      expect(scriptContent).toContain('Breaking Barriers Hackathon 2025');
      expect(scriptContent).toContain('Team SaveHaven');
      
      // Should have encouraging messaging
      expect(scriptContent).toContain('Good luck');
      expect(scriptContent).toContain('🚀');
    });
  });

  describe('Performance and Efficiency', () => {
    test('should use efficient installation methods', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should use silent installation where appropriate
      expect(scriptContent).toContain('--silent');
      
      // Should provide progress indicators
      expect(scriptContent).toContain('✅');
      expect(scriptContent).toContain('⚠️');
      expect(scriptContent).toContain('❌');
    });

    test('should handle timing for service startup', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should wait for services to start
      expect(scriptContent).toContain('sleep');
      
      // Should wait appropriate time for initialization
      const sleepMatches = scriptContent.match(/sleep \d+/g);
      expect(sleepMatches).toBeTruthy();
      expect(sleepMatches.length).toBeGreaterThan(0);
    });
  });

  describe('Integration with Package.json Scripts', () => {
    test('should align with npm demo scripts', () => {
      const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const demoScripts = Object.keys(packageJson.scripts || {}).filter(script => 
          script.startsWith('demo:')
        );
        
        // Should have demo scripts configured
        expect(demoScripts.length).toBeGreaterThanOrEqual(6);
        expect(demoScripts).toContain('demo:setup');
        expect(demoScripts).toContain('demo:seed');
      }
    });
  });

  describe('Security Considerations', () => {
    test('should not expose sensitive information', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should not contain hardcoded secrets
      expect(scriptContent).not.toMatch(/password.*=.*[^$]/i);
      expect(scriptContent).not.toMatch(/secret.*=.*[^$]/i);
      expect(scriptContent).not.toMatch(/key.*=.*[^$]/i);
      
      // Should reference AWS configuration
      expect(scriptContent).toContain('aws configure');
      expect(scriptContent).toContain('AWS CLI');
    });

    test('should handle file permissions appropriately', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should set appropriate permissions
      expect(scriptContent).toContain('chmod +x');
    });
  });

  describe('Compatibility and Cross-Platform Support', () => {
    test('should use portable bash commands', () => {
      const scriptContent = fs.readFileSync(setupScriptPath, 'utf8');
      
      // Should use standard Unix commands
      expect(scriptContent).toContain('echo');
      expect(scriptContent).toContain('cd');
      expect(scriptContent).toContain('cat >');
      
      // Should avoid platform-specific commands
      expect(scriptContent).not.toContain('cmd.exe');
      expect(scriptContent).not.toContain('powershell');
    });
  });
});