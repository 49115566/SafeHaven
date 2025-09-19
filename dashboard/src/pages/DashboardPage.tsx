import React from 'react';

export default function DashboardPage() {
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
              <div className="h-96 bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-500">Map component will be implemented here</p>
              </div>
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
                  <span className="font-semibold">0</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Capacity:</span>
                  <span className="font-semibold">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}