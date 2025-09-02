import { graphql, HttpResponse } from 'msw';

export const graphqlHandlers = [
  graphql.query('GetParcels', () => {
    return HttpResponse.json({
      data: {
        parcels: [
          { id: '1', parcelNumber: 'TEST-001', owner: 'Test Owner', acres: 1.5 }
        ]
      }
    });
  }),

  graphql.mutation('CreateParcel', () => {
    return HttpResponse.json({
      data: {
        createParcel: {
          id: '2',
          parcelNumber: 'TEST-002',
          owner: 'New Owner',
          acres: 2.0
        }
      }
    });
  })
];