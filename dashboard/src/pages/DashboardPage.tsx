import React from 'react';
import AwsLocationMap from '../components/AwsLocationMap';

export default function DashboardPage() {
  // Sample shelter data for demonstration
  const sampleShelters = [
    {
      id: '1',
      name: 'Downtown Emergency Shelter',
      latitude: 40.7128,
      longitude: -74.0060,
      status: 'operational' as const,
      capacity: 150,
      currentOccupancy: 89,
    },
    {
      id: '2', 
      name: 'Community Center North',
      latitude: 40.7589,
      longitude: -73.9851,
      status: 'limited' as const,
      capacity: 80,
      currentOccupancy: 75,
    },
    {
      id: '3',
      name: 'School Gymnasium South',
      latitude: 40.6892,
      longitude: -74.0445,
      status: 'down' as const,
      capacity: 120,
      currentOccupancy: 0,
    }
  ];

  // Calculate statistics
  const totalShelters = sampleShelters.length;
  const operationalShelters = sampleShelters.filter(s => s.status === 'operational').length;
  const totalCapacity = sampleShelters.reduce((sum, shelter) => sum + shelter.capacity, 0);
  const currentOccupancy = sampleShelters.reduce((sum, shelter) => sum + shelter.currentOccupancy, 0);
  const availableCapacity = totalCapacity - currentOccupancy;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          SafeHaven Responder Dashboard
        </h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Live Shelter Map</h2>
              <AwsLocationMap shelters={sampleShelters} className="h-96" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Active Alerts</h2>
              <p className="text-gray-500">No active alerts</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Shelters:</span>
                  <span className="font-semibold">{totalShelters}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Capacity:</span>
                  <span className="font-semibold">{availableCapacity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operational:</span>
                  <span className="font-semibold">{operationalShelters}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}