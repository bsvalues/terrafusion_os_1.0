import { http, HttpResponse } from 'msw';

export const exportHandlers = [
  http.post('/api/export/parcels', () => {
    return HttpResponse.json({
      exportId: 'export-123',
      status: 'processing',
      downloadUrl: '/api/downloads/parcels-export-123.csv'
    });
  }),

  http.get('/api/downloads/:fileId', () => {
    return HttpResponse.text('parcel_id,owner,acres\nTEST-001,Test Owner,1.5');
  })
];