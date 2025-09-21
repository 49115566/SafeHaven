import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ShelterDetailsPage() {
  const { shelterId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [shelter, setShelter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setShelter({
        id: shelterId,
        name: 'Dallas Convention Center',
        address: '650 S Griffin St, Dallas, TX 75202',
        status: 'Available',
        capacity: { current: 150, maximum: 500 },
        contact: {
          manager: 'Sarah Johnson',
          phone: '(214) 555-0123',
          email: 'sarah.johnson@dallas.gov'
        },
        urgentNeeds: ['Medical supplies', 'Blankets'],
        lastUpdated: new Date().toISOString()
      });
      setIsLoading(false);
    }, 1000);
  }, [shelterId]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
        }}>
          <div style={{
            fontSize: '18px',
            color: '#2c3e50'
          }}>Loading shelter details...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        padding: '20px 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  marginRight: '20px'
                }}
              >
                ← Back to Dashboard
              </button>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: 'white',
                margin: '0'
              }}>
                Shelter Details
              </h1>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.9)',
                fontWeight: '500'
              }}>
                👋 {user?.profile?.firstName} {user?.profile?.lastName}
              </div>
              
              <button
                onClick={logout}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          
          {/* Main Info Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            padding: '30px'
          }}>
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#2c3e50',
                margin: '0 0 10px 0'
              }}>
                🏢 {shelter.name}
              </h2>
              <p style={{
                fontSize: '16px',
                color: '#7f8c8d',
                margin: '0'
              }}>
                📍 {shelter.address}
              </p>
            </div>

            {/* Status and Capacity */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '30px'
            }}>
              <div style={{
                background: 'linear-gradient(45deg, #27ae60, #2ecc71)',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                color: 'white'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Status
                </div>
                <div style={{ fontSize: '18px' }}>
                  ✅ {shelter.status}
                </div>
              </div>
              
              <div style={{
                background: 'linear-gradient(45deg, #3498db, #2980b9)',
                borderRadius: '15px',
                padding: '20px',
                textAlign: 'center',
                color: 'white'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Capacity
                </div>
                <div style={{ fontSize: '18px' }}>
                  👥 {shelter.capacity.current}/{shelter.capacity.maximum}
                </div>
              </div>
            </div>

            {/* Resources */}
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '15px'
              }}>
                📦 Resources & Facilities
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px'
              }}>
                <div style={{
                  backgroundColor: '#e8f5e8',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  border: '2px solid #27ae60'
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '5px' }}>🍽️</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>Food</div>
                  <div style={{ fontSize: '12px', color: '#27ae60', fontWeight: '600' }}>Good</div>
                </div>
                
                <div style={{
                  backgroundColor: '#e3f2fd',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  border: '2px solid #3498db'
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '5px' }}>💧</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>Water</div>
                  <div style={{ fontSize: '12px', color: '#3498db', fontWeight: '600' }}>Good</div>
                </div>
                
                <div style={{
                  backgroundColor: '#fff3e0',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  border: '2px solid #f39c12'
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '5px' }}>🏥</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>Medical</div>
                  <div style={{ fontSize: '12px', color: '#f39c12', fontWeight: '600' }}>Limited</div>
                </div>
                
                <div style={{
                  backgroundColor: '#e8f5e8',
                  borderRadius: '12px',
                  padding: '15px',
                  textAlign: 'center',
                  border: '2px solid #27ae60'
                }}>
                  <div style={{ fontSize: '20px', marginBottom: '5px' }}>🛏️</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>Bedding</div>
                  <div style={{ fontSize: '12px', color: '#27ae60', fontWeight: '600' }}>Good</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Contact Information */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
              padding: '25px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '20px'
              }}>
                📞 Contact Information
              </h3>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>
                  Shelter Manager
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                  👤 {shelter.contact.manager}
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>
                  Phone
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                  📱 {shelter.contact.phone}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>
                  Email
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
                  📧 {shelter.contact.email}
                </div>
              </div>
            </div>

            {/* Urgent Needs */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
              padding: '25px',
              border: '3px solid #e74c3c'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#e74c3c',
                marginBottom: '15px'
              }}>
                🚨 Urgent Needs
              </h3>
              {shelter.urgentNeeds.map((need: string, index: number) => (
                <div key={index} style={{
                  backgroundColor: '#fee',
                  color: '#c0392b',
                  padding: '10px 15px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '10px'
                }}>
                  ⚠️ {need}
                </div>
              ))}
            </div>

            {/* Last Updated */}
            <div style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
              padding: '25px',
              textAlign: 'center'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#2c3e50',
                marginBottom: '10px'
              }}>
                🕒 Last Updated
              </h3>
              <div style={{
                fontSize: '14px',
                color: '#7f8c8d'
              }}>
                {new Date(shelter.lastUpdated).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}