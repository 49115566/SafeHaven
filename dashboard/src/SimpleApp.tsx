import React, { useState } from 'react';

function SimpleApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'responder@safehaven.com' && password === 'password123') {
      setIsLoggedIn(true);
    } else {
      alert('Invalid credentials. Use: responder@safehaven.com / password123');
    }
  };

  if (isLoggedIn) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h1>SafeHaven Dashboard</h1>
          <p>Welcome, First Responder!</p>
          <button 
            onClick={() => setIsLoggedIn(false)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ 
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3>Active Shelters</h3>
            <div style={{ marginBottom: '10px', padding: '10px', background: '#f0f9ff', borderRadius: '5px' }}>
              <strong>Dallas Convention Center</strong><br/>
              Status: Available (150/500)<br/>
              Resources: All adequate
            </div>
            <div style={{ marginBottom: '10px', padding: '10px', background: '#fef3c7', borderRadius: '5px' }}>
              <strong>Fair Park Coliseum</strong><br/>
              Status: Needs attention (75/300)<br/>
              Resources: Medical supplies critical
            </div>
          </div>
          
          <div style={{ 
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            <h3>Active Alerts</h3>
            <div style={{ marginBottom: '10px', padding: '10px', background: '#fee2e2', borderRadius: '5px' }}>
              <strong>Medical Supplies Critical</strong><br/>
              Fair Park Coliseum urgently needs medical supplies<br/>
              <small>30 minutes ago</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        width: '400px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
          SafeHaven Connect
        </h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </form>
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <strong>Demo Credentials:</strong><br/>
          Email: responder@safehaven.com<br/>
          Password: password123
        </div>
      </div>
    </div>
  );
}

export default SimpleApp;