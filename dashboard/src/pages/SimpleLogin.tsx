import React, { useState } from 'react';

export default function SimpleLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'responder@safehaven.com' && password === 'password123') {
      setIsLoggedIn(true);
    } else {
      alert('Invalid credentials');
    }
  };

  if (isLoggedIn) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>🎉 Dashboard</h1>
          <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Welcome to SafeHaven Connect Dashboard!</p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div style={{
              background: 'linear-gradient(45deg, #27ae60, #2ecc71)',
              color: 'white',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center'
            }}>
              <h3>Total Shelters</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>12</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(45deg, #3498db, #2980b9)',
              color: 'white',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center'
            }}>
              <h3>Available Capacity</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>450</div>
            </div>
            
            <div style={{
              background: 'linear-gradient(45deg, #f39c12, #e67e22)',
              color: 'white',
              padding: '20px',
              borderRadius: '15px',
              textAlign: 'center'
            }}>
              <h3>Active Alerts</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>3</div>
            </div>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>Recent Shelters</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>Dallas Convention Center</strong>
                  <div style={{ color: '#7f8c8d', fontSize: '14px' }}>150/500 capacity</div>
                </div>
                <span style={{
                  backgroundColor: '#27ae60',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '20px',
                  fontSize: '12px'
                }}>Available</span>
              </div>
              
              <div style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>Fair Park Coliseum</strong>
                  <div style={{ color: '#7f8c8d', fontSize: '14px' }}>280/300 capacity</div>
                </div>
                <span style={{
                  backgroundColor: '#f39c12',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '20px',
                  fontSize: '12px'
                }}>Limited</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsLoggedIn(false)}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
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
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        width: '100%',
        maxWidth: '400px',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
          padding: '30px 20px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0'
          }}>SafeHaven Connect</h1>
        </div>
        
        <div style={{ padding: '30px' }}>
          <h2 style={{
            fontSize: '20px',
            color: '#2c3e50',
            textAlign: 'center',
            marginBottom: '20px'
          }}>First Responder Login</h2>
          
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ecf0f1',
                  borderRadius: '8px',
                  fontSize: '16px',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #ecf0f1',
                  borderRadius: '8px',
                  fontSize: '16px',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>
            
            <button
              type="submit"
              style={{
                width: '100%',
                background: 'linear-gradient(45deg, #27ae60, #2ecc71)',
                color: 'white',
                padding: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              LOGIN
            </button>
          </form>
          
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px' }}>Demo Credentials:</div>
            <div style={{ fontSize: '14px', color: '#2c3e50' }}>responder@safehaven.com</div>
            <div style={{ fontSize: '14px', color: '#2c3e50' }}>password123</div>
          </div>
        </div>
      </div>
    </div>
  );
}