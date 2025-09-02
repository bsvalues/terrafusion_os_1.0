import { http, HttpResponse } from 'msw';

export const searchHandlers = [
  http.get('/api/parcels', () => {
    return HttpResponse.json({
      parcels: [
        { id: '1', parcel_number: 'TEST-001', owner: 'Test Owner', acres: 1.5 }
      ],
      total: 1
    });
  }),

  http.get('/api/search/parcels', () => {
    return HttpResponse.json({
      results: [
        { id: '1', parcel_number: 'TEST-001', owner: 'Test Owner', acres: 1.5 }
      ],
      total: 1
    });
  })
];