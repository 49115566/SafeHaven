import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        width: '100%',
        maxWidth: '450px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
          padding: '30px 20px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            margin: '0 0 8px 0'
          }}>SafeHaven Connect</h1>
          <p style={{
            color: 'rgba(255,255,255,0.9)',
            fontSize: '16px',
            margin: '0'
          }}>Emergency Response Platform</p>
        </div>
        
        {/* Form */}
        <div style={{ padding: '40px 30px' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#2c3e50',
              margin: '0 0 10px 0'
            }}>First Responder Login</h2>
            <p style={{
              color: '#7f8c8d',
              fontSize: '14px',
              margin: '0'
            }}>Secure access for authorized personnel</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '500',
                color: '#34495e',
                marginBottom: '8px',
                textAlign: 'center'
              }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: '16px',
                  border: '2px solid #ecf0f1',
                  borderRadius: '12px',
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa',
                  color: '#2c3e50',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="responder@safehaven.com"
                required
              />
            </div>
            
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                fontSize: '16px',
                fontWeight: '500',
                color: '#34495e',
                marginBottom: '8px',
                textAlign: 'center'
              }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: '16px',
                  border: '2px solid #ecf0f1',
                  borderRadius: '12px',
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa',
                  color: '#2c3e50',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Enter your password"
                required
              />
            </div>
            
            {error && (
              <div style={{
                backgroundColor: '#fee',
                border: '2px solid #fcc',
                borderRadius: '12px',
                padding: '15px',
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <p style={{
                  color: '#c0392b',
                  fontSize: '14px',
                  fontWeight: '500',
                  margin: '0'
                }}>{error}</p>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              style={{
                width: '100%',
                background: 'linear-gradient(45deg, #27ae60, #2ecc71)',
                color: 'white',
                padding: '18px',
                fontSize: '18px',
                fontWeight: 'bold',
                border: 'none',
                borderRadius: '12px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: (isLoading || !email || !password) ? 0.6 : 1,
                boxShadow: '0 4px 15px rgba(46, 204, 113, 0.3)'
              }}
            >
              {isLoading ? 'Authenticating...' : 'ACCESS DASHBOARD'}
            </button>
          </form>
          
          {/* Demo Credentials */}
          <div style={{ marginTop: '30px' }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '15px',
              position: 'relative'
            }}>
              <div style={{
                height: '1px',
                backgroundColor: '#ecf0f1',
                position: 'absolute',
                top: '50%',
                left: '0',
                right: '0'
              }}></div>
              <span style={{
                backgroundColor: 'white',
                padding: '0 15px',
                color: '#7f8c8d',
                fontSize: '14px',
                fontWeight: '500',
                position: 'relative'
              }}>Demo Access</span>
            </div>
            
            <div style={{
              background: 'linear-gradient(45deg, #f39c12, #e67e22)',
              borderRadius: '15px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{ color: 'white' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '15px'
                }}>
                  🚨 DEMO CREDENTIALS
                </div>
                <div style={{
                  fontSize: '14px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '10px',
                  marginBottom: '8px',
                  fontFamily: 'monospace'
                }}>responder@safehaven.com</div>
                <div style={{
                  fontSize: '14px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  padding: '10px',
                  fontFamily: 'monospace'
                }}>password123</div>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-3 rounded">
              <div><strong>First Responder:</strong></div>
              <div>Email: responder@safehaven.com</div>
              <div>Password: password123</div>
              <div className="mt-2"><strong>Emergency Coordinator:</strong></div>
              <div>Email: coordinator@safehaven.com</div>
              <div>Password: password123</div>
            </div>

            <div className="mt-6">
              <Link
                to="/register"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{
          backgroundColor: '#34495e',
          padding: '20px',
          textAlign: 'center'
        }}>
          <p style={{
            color: '#ecf0f1',
            fontSize: '12px',
            margin: '0',
            fontWeight: '500'
          }}>
            🛡️ FirstNet Certified • 🔒 Secure • ⚡ Real-time
          </p>
        </div>
      </div>
    </div>
  );
}