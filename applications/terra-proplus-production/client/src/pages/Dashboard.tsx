import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Home, Building, FileText, ClipboardCheck  } from '@mui/icons-material';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  property_type: string;
  bedrooms: number;
  bathrooms: string;
  square_feet: string;
}

export default function Dashboard() {
  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json() as Promise<Property[]>;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><>

        <strong className="font-bold">Error!</strong>
        <span
</> className="block sm:inline"> Failed to load dashboard data. Please try again later.</span>
      </div>
    );
  }

  const recentProperties = properties?.slice(0, 5) || [];
  
  const stats = [
    { title: 'Total Properties', value: properties?.length || 0, icon: <Building className="h-8 w-8 text-primary" /> },
    { title: 'Active Appraisals', value: 3, icon: <ClipboardCheck className="h-8 w-8 text-primary" /> },
    { title: 'Completed Reports', value: 8, icon: <FileText className="h-8 w-8 text-primary" /> },
  ];

  return (
    <div className="space-y-6">
      <div><>

        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p
</> className="text-gray-600">Welcome to Terrafusion Professional</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card flex items-center"><>

            <div className="bg-primary/10 p-4 rounded-lg mr-4">
              {stat.icon}
            </div>
            <div
</>><>

              <p className="text-xl font-bold">{stat.value}</p>
              <p
</> className="text-gray-600">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4"><>

          <h2 className="text-xl font-bold">Recent Properties</h2>
          <Link
</> to="/properties" className="text-primary hover:underline">View All</Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr><>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th
</> className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th><>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th
</> className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentProperties.map((property) => (
                <tr key={property.id}><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{property.address}</td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.property_type}</td><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.city}, {property.state}</td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {property.square_feet} sq ft • {property.bedrooms} bd • {property.bathrooms} ba
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link to={`/properties/${property.id}`} className="text-primary hover:underline mr-3">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}