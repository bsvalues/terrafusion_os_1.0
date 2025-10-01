import { j as e, m as s } from './animation-CL1fW55q.js';
import { a as t, r as a, R as l } from './react-vendor-DtX1tuCI.js';
import {
  S as r,
  H as i,
  F as n,
  B as d,
  G as c,
  C as o,
  P as x,
  a as m,
  b as h,
  c as p,
  d as u,
  U as g,
  D as j,
  M as y,
} from './ui-BvonmyIj.js';
!(function () {
  const e = document.createElement('link').relList;
  if (!(e && e.supports && e.supports('modulepreload'))) {
    for (const e of document.querySelectorAll('link[rel="modulepreload"]')) s(e);
    new MutationObserver(e => {
      for (const t of e)
        if ('childList' === t.type)
          for (const e of t.addedNodes) 'LINK' === e.tagName && 'modulepreload' === e.rel && s(e);
    }).observe(document, { childList: !0, subtree: !0 });
  }
  function s(e) {
    if (e.ep) return;
    e.ep = !0;
    const s = (function (e) {
      const s = {};
      return (
        e.integrity && (s.integrity = e.integrity),
        e.referrerPolicy && (s.referrerPolicy = e.referrerPolicy),
        'use-credentials' === e.crossOrigin
          ? (s.credentials = 'include')
          : 'anonymous' === e.crossOrigin
            ? (s.credentials = 'omit')
            : (s.credentials = 'same-origin'),
        s
      );
    })(e);
    fetch(e.href, s);
  }
})();
var b = {},
  N = t;
((b.createRoot = N.createRoot), (b.hydrateRoot = N.hydrateRoot));
const f = () => {
    const [t, l] = a.useState(''),
      [b, N] = a.useState('all'),
      [f, v] = a.useState(null),
      [w, S] = a.useState([]),
      [C, D] = a.useState(!1),
      [L, P] = a.useState('search'),
      R = [
        {
          parcelId: '12345678901',
          address: '123 Columbia Dr, Richland, WA 99352',
          owner: 'SMITH JOHN & JANE',
          assessedValue: 385e3,
          taxAmount: 4235.5,
          yearBuilt: 2005,
          squareFeet: 2340,
          lotSize: '0.25 acres',
          propertyType: 'Single Family Residential',
          lastSaleDate: '2020-06-15',
          lastSalePrice: 35e4,
          zoning: 'R-1',
          schoolDistrict: 'Richland School District',
          latitude: 46.2856,
          longitude: -119.2937,
        },
        {
          parcelId: '23456789012',
          address: '456 George Washington Way, Richland, WA 99352',
          owner: 'JOHNSON FAMILY TRUST',
          assessedValue: 525e3,
          taxAmount: 5775,
          yearBuilt: 1998,
          squareFeet: 3100,
          lotSize: '0.33 acres',
          propertyType: 'Single Family Residential',
          lastSaleDate: '2019-03-22',
          lastSalePrice: 48e4,
          zoning: 'R-1',
          schoolDistrict: 'Richland School District',
        },
        {
          parcelId: '34567890123',
          address: '789 Jadwin Ave, Kennewick, WA 99336',
          owner: 'WILLIAMS ROBERT',
          assessedValue: 295e3,
          taxAmount: 3245,
          yearBuilt: 1985,
          squareFeet: 1850,
          lotSize: '0.18 acres',
          propertyType: 'Single Family Residential',
          lastSaleDate: '2021-11-30',
          lastSalePrice: 275e3,
          zoning: 'R-2',
          schoolDistrict: 'Kennewick School District',
        },
      ],
      B = [
        {
          id: 'DOC001',
          title: 'City Council Meeting Minutes - January 2024',
          type: 'minutes',
          date: '2024-01-15',
          department: 'City Clerk',
          fileSize: '2.4 MB',
          pages: 45,
        },
        {
          id: 'DOC002',
          title: 'Warranty Deed - 123 Columbia Dr',
          type: 'deed',
          date: '2020-06-15',
          department: 'Recorder',
          fileSize: '156 KB',
          pages: 3,
        },
        {
          id: 'DOC003',
          title: 'Building Permit BP-2024-0123',
          type: 'permit',
          date: '2024-01-10',
          department: 'Building',
          fileSize: '890 KB',
          pages: 12,
        },
        {
          id: 'DOC004',
          title: 'Ordinance 2024-01: Zoning Amendment',
          type: 'ordinance',
          date: '2024-01-01',
          department: 'Planning',
          fileSize: '445 KB',
          pages: 8,
        },
      ],
      T = [
        {
          permitNumber: 'BP-2024-0123',
          type: 'Building',
          address: '123 Columbia Dr, Richland, WA',
          applicant: 'John Smith',
          contractor: 'ABC Construction LLC',
          issuedDate: '2024-01-10',
          expiryDate: '2024-07-10',
          status: 'active',
          valuation: 25e3,
          description: 'Kitchen remodel and electrical upgrade',
        },
        {
          permitNumber: 'EP-2024-0045',
          type: 'Electrical',
          address: '456 George Washington Way, Richland, WA',
          applicant: 'Johnson Family Trust',
          issuedDate: '2024-01-05',
          expiryDate: '2024-04-05',
          status: 'active',
          valuation: 5e3,
          description: 'Solar panel installation',
        },
      ],
      A = () => {
        if (!t.trim()) return;
        D(!0);
        const e = t.toLowerCase(),
          s = [];
        if ('all' === b || 'property' === b) {
          const t = R.filter(
            s =>
              s.address.toLowerCase().includes(e) ||
              s.owner.toLowerCase().includes(e) ||
              s.parcelId.includes(e)
          );
          s.push(...t.map(e => ({ ...e, resultType: 'property' })));
        }
        if ('all' === b || 'documents' === b) {
          const t = B.filter(
            s => s.title.toLowerCase().includes(e) || s.department.toLowerCase().includes(e)
          );
          s.push(...t.map(e => ({ ...e, resultType: 'document' })));
        }
        if ('all' === b || 'permits' === b) {
          const t = T.filter(
            s =>
              s.permitNumber.toLowerCase().includes(e) ||
              s.address.toLowerCase().includes(e) ||
              s.applicant.toLowerCase().includes(e)
          );
          s.push(...t.map(e => ({ ...e, resultType: 'permit' })));
        }
        setTimeout(() => {
          (S(s), D(!1));
        }, 500);
      },
      k = ({ property: t }) =>
        e.jsxs(s.div, {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          className: 'bg-white rounded-lg shadow-lg p-6',
          children: [
            e.jsx('div', {
              className: 'border-b pb-4 mb-4',
              children: e.jsxs('div', {
                className: 'flex justify-between items-start',
                children: [
                  e.jsxs('div', {
                    children: [
                      e.jsx('h2', {
                        className: 'text-2xl font-bold text-gray-900',
                        children: t.address,
                      }),
                      e.jsxs('p', {
                        className: 'text-gray-600 mt-1',
                        children: ['Parcel ID: ', t.parcelId],
                      }),
                    ],
                  }),
                  e.jsxs('div', {
                    className: 'flex gap-2',
                    children: [
                      e.jsx('button', {
                        className: 'p-2 text-gray-600 hover:bg-gray-100 rounded',
                        children: e.jsx(h, { className: 'w-5 h-5' }),
                      }),
                      e.jsx('button', {
                        className: 'p-2 text-gray-600 hover:bg-gray-100 rounded',
                        children: e.jsx(p, { className: 'w-5 h-5' }),
                      }),
                      e.jsx('button', {
                        className: 'p-2 text-gray-600 hover:bg-gray-100 rounded',
                        children: e.jsx(u, { className: 'w-5 h-5' }),
                      }),
                    ],
                  }),
                ],
              }),
            }),
            e.jsxs('div', {
              className: 'grid grid-cols-1 md:grid-cols-2 gap-6',
              children: [
                e.jsxs('div', {
                  className: 'bg-gray-50 rounded-lg p-4',
                  children: [
                    e.jsxs('h3', {
                      className: 'font-semibold text-gray-900 mb-3 flex items-center gap-2',
                      children: [
                        e.jsx(g, { className: 'w-5 h-5 text-blue-600' }),
                        'Ownership Information',
                      ],
                    }),
                    e.jsxs('dl', {
                      className: 'space-y-2 text-sm',
                      children: [
                        e.jsxs('div', {
                          className: 'flex justify-between',
                          children: [
                            e.jsx('dt', { className: 'text-gray-600', children: 'Owner:' }),
                            e.jsx('dd', { className: 'font-medium', children: t.owner }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex justify-between',
                          children: [
                            e.jsx('dt', {
                              className: 'text-gray-600',
                              children: 'Last Sale Date:',
                            }),
                            e.jsx('dd', { children: t.lastSaleDate }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex justify-between',
                          children: [
                            e.jsx('dt', {
                              className: 'text-gray-600',
                              children: 'Last Sale Price:',
                            }),
                            e.jsxs('dd', {
                              className: 'font-medium',
                              children: ['$', t.lastSalePrice.toLocaleString()],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'bg-gray-50 rounded-lg p-4',
                  children: [
                    e.jsxs('h3', {
                      className: 'font-semibold text-gray-900 mb-3 flex items-center gap-2',
                      children: [
                        e.jsx(i, { className: 'w-5 h-5 text-green-600' }),
                        'Property Details',
                      ],
                    }),
                    e.jsxs('dl', {
                      className: 'space-y-2 text-sm',
                      children: [
                        e.jsxs('div', {
                          className: 'flex justify-between',
                          children: [
                            e.jsx('dt', { className: 'text-gray-600', children: 'Type:' }),
                            e.jsx('dd', { children: t.propertyType }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex justify-between',
                          children: [
                            e.jsx('dt', { className: 'text-gray-600', children: 'Year Built:' }),
                            e.jsx('dd', { children: t.yearBuilt }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex justify-between',
                          children: [
                            e.jsx('dt', { className: 'text-gray-600', children: 'Square Feet:' }),
                            e.jsxs('dd', { children: [t.squareFeet.toLocaleString(), ' sq ft'] }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex justify-between',
                          children: [
                            e.jsx('dt', { className: 'text-gray-600', children: 'Lot Size:' }),
                            e.jsx('dd', { children: t.lotSize }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'bg-gray-50 rounded-lg p-4',
                  children: [
                    e.jsxs('h3', {
                      className: 'font-semibold text-gray-900 mb-3 flex items-center gap-2',
                      children: [
                        e.jsx(j, { className: 'w-5 h-5 text-purple-600' }),
                        'Tax Assessment',
                      ],
                    }),
                    e.jsxs('dl', {
                      className: 'space-y-2 text-sm',
                      children: [
                        e.jsxs('div', {
                          className: 'flex justify-between',
                          children: [
                            e.jsx('dt', {
                              className: 'text-gray-600',
                              children: 'Assessed Value:',
                            }),
                            e.jsxs('dd', {
                              className: 'font-medium',
                              children: ['$', t.assessedValue.toLocaleString()],
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex justify-between',
                          children: [
                            e.jsx('dt', { className: 'text-gray-600', children: 'Annual Tax:' }),
                            e.jsxs('dd', {
                              className: 'font-medium text-purple-600',
                              children: ['$', t.taxAmount.toLocaleString()],
                            }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex justify-between',
                          children: [
                            e.jsx('dt', { className: 'text-gray-600', children: 'Tax Rate:' }),
                            e.jsxs('dd', {
                              children: [((t.taxAmount / t.assessedValue) * 100).toFixed(3), '%'],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'bg-gray-50 rounded-lg p-4',
                  children: [
                    e.jsxs('h3', {
                      className: 'font-semibold text-gray-900 mb-3 flex items-center gap-2',
                      children: [e.jsx(y, { className: 'w-5 h-5 text-red-600' }), 'Location'],
                    }),
                    e.jsxs('dl', {
                      className: 'space-y-2 text-sm',
                      children: [
                        e.jsxs('div', {
                          className: 'flex justify-between',
                          children: [
                            e.jsx('dt', { className: 'text-gray-600', children: 'Zoning:' }),
                            e.jsx('dd', { children: t.zoning }),
                          ],
                        }),
                        e.jsxs('div', {
                          className: 'flex justify-between',
                          children: [
                            e.jsx('dt', {
                              className: 'text-gray-600',
                              children: 'School District:',
                            }),
                            e.jsx('dd', { children: t.schoolDistrict }),
                          ],
                        }),
                        t.latitude &&
                          e.jsxs('div', {
                            className: 'flex justify-between',
                            children: [
                              e.jsx('dt', { className: 'text-gray-600', children: 'Coordinates:' }),
                              e.jsxs('dd', {
                                className: 'text-xs',
                                children: [t.latitude, ', ', t.longitude],
                              }),
                            ],
                          }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            e.jsxs('div', {
              className: 'mt-6 flex flex-wrap gap-3',
              children: [
                e.jsx('button', {
                  className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700',
                  children: 'View Tax History',
                }),
                e.jsx('button', {
                  className: 'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700',
                  children: 'View on Map',
                }),
                e.jsx('button', {
                  className: 'px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700',
                  children: 'View Documents',
                }),
                e.jsx('button', {
                  className: 'px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50',
                  children: 'Download Report',
                }),
              ],
            }),
          ],
        }),
      I = () =>
        e.jsxs('div', {
          className: 'max-w-4xl mx-auto',
          children: [
            e.jsxs('div', {
              className: 'bg-white rounded-lg shadow-lg p-6 mb-6',
              children: [
                e.jsx('div', {
                  className: 'flex gap-3 mb-4',
                  children: ['all', 'property', 'documents', 'permits'].map(s =>
                    e.jsx(
                      'button',
                      {
                        onClick: () => N(s),
                        className:
                          'px-4 py-2 rounded-lg font-medium ' +
                          (b === s
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'),
                        children: s.charAt(0).toUpperCase() + s.slice(1),
                      },
                      s
                    )
                  ),
                }),
                e.jsxs('div', {
                  className: 'flex gap-3',
                  children: [
                    e.jsxs('div', {
                      className: 'flex-1 relative',
                      children: [
                        e.jsx(r, {
                          className:
                            'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400',
                        }),
                        e.jsx('input', {
                          type: 'text',
                          value: t,
                          onChange: e => l(e.target.value),
                          onKeyPress: e => 'Enter' === e.key && A(),
                          placeholder: 'Search by address, parcel ID, owner name, permit number...',
                          className:
                            'w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                        }),
                      ],
                    }),
                    e.jsx('button', {
                      onClick: A,
                      className:
                        'px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium',
                      children: 'Search',
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'mt-3 flex items-center gap-2 text-sm',
                  children: [
                    e.jsx('span', { className: 'text-gray-500', children: 'Try:' }),
                    ['123 Columbia', 'Smith', 'BP-2024'].map(s =>
                      e.jsx(
                        'button',
                        {
                          onClick: () => {
                            (l(s), A());
                          },
                          className: 'text-blue-600 hover:underline',
                          children: s,
                        },
                        s
                      )
                    ),
                  ],
                }),
              ],
            }),
            C &&
              e.jsxs('div', {
                className: 'text-center py-12',
                children: [
                  e.jsx('div', {
                    className:
                      'inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600',
                  }),
                  e.jsx('p', {
                    className: 'mt-4 text-gray-600',
                    children: 'Searching public records...',
                  }),
                ],
              }),
            !C &&
              w.length > 0 &&
              e.jsxs('div', {
                className: 'space-y-4',
                children: [
                  e.jsxs('p', {
                    className: 'text-gray-600 font-medium',
                    children: ['Found ', w.length, ' results for "', t, '"'],
                  }),
                  w.map((t, a) =>
                    e.jsxs(
                      s.div,
                      {
                        initial: { opacity: 0, y: 20 },
                        animate: { opacity: 1, y: 0 },
                        transition: { delay: 0.05 * a },
                        className:
                          'bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow',
                        children: [
                          'property' === t.resultType &&
                            e.jsx('div', {
                              children: e.jsxs('div', {
                                className: 'flex items-start justify-between',
                                children: [
                                  e.jsxs('div', {
                                    children: [
                                      e.jsxs('div', {
                                        className: 'flex items-center gap-2 mb-2',
                                        children: [
                                          e.jsx(i, { className: 'w-5 h-5 text-blue-600' }),
                                          e.jsx('span', {
                                            className: 'text-sm font-medium text-blue-600',
                                            children: 'Property Record',
                                          }),
                                        ],
                                      }),
                                      e.jsx('h3', {
                                        className: 'text-xl font-bold text-gray-900',
                                        children: t.address,
                                      }),
                                      e.jsxs('p', {
                                        className: 'text-gray-600 mt-1',
                                        children: ['Owner: ', t.owner],
                                      }),
                                      e.jsxs('p', {
                                        className: 'text-gray-600',
                                        children: ['Parcel: ', t.parcelId],
                                      }),
                                      e.jsxs('div', {
                                        className: 'mt-3 flex items-center gap-4 text-sm',
                                        children: [
                                          e.jsxs('span', {
                                            children: [
                                              'Assessed: $',
                                              t.assessedValue.toLocaleString(),
                                            ],
                                          }),
                                          e.jsx('span', { children: '•' }),
                                          e.jsxs('span', { children: [t.squareFeet, ' sq ft'] }),
                                          e.jsx('span', { children: '•' }),
                                          e.jsxs('span', { children: ['Built ', t.yearBuilt] }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  e.jsx('button', {
                                    onClick: () => v(t),
                                    className:
                                      'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700',
                                    children: 'View Details',
                                  }),
                                ],
                              }),
                            }),
                          'document' === t.resultType &&
                            e.jsx('div', {
                              children: e.jsxs('div', {
                                className: 'flex items-start justify-between',
                                children: [
                                  e.jsxs('div', {
                                    children: [
                                      e.jsxs('div', {
                                        className: 'flex items-center gap-2 mb-2',
                                        children: [
                                          e.jsx(n, { className: 'w-5 h-5 text-green-600' }),
                                          e.jsx('span', {
                                            className: 'text-sm font-medium text-green-600',
                                            children: 'Document',
                                          }),
                                        ],
                                      }),
                                      e.jsx('h3', {
                                        className: 'text-xl font-bold text-gray-900',
                                        children: t.title,
                                      }),
                                      e.jsxs('div', {
                                        className:
                                          'mt-2 flex items-center gap-4 text-sm text-gray-600',
                                        children: [
                                          e.jsx('span', { children: t.department }),
                                          e.jsx('span', { children: '•' }),
                                          e.jsx('span', { children: t.date }),
                                          e.jsx('span', { children: '•' }),
                                          e.jsxs('span', { children: [t.pages, ' pages'] }),
                                          e.jsx('span', { children: '•' }),
                                          e.jsx('span', { children: t.fileSize }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  e.jsxs('div', {
                                    className: 'flex gap-2',
                                    children: [
                                      e.jsx('button', {
                                        className:
                                          'px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700',
                                        children: 'View',
                                      }),
                                      e.jsx('button', {
                                        className:
                                          'px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50',
                                        children: 'Download',
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            }),
                          'permit' === t.resultType &&
                            e.jsx('div', {
                              children: e.jsxs('div', {
                                className: 'flex items-start justify-between',
                                children: [
                                  e.jsxs('div', {
                                    children: [
                                      e.jsxs('div', {
                                        className: 'flex items-center gap-2 mb-2',
                                        children: [
                                          e.jsx(d, { className: 'w-5 h-5 text-purple-600' }),
                                          e.jsx('span', {
                                            className: 'text-sm font-medium text-purple-600',
                                            children: 'Permit',
                                          }),
                                        ],
                                      }),
                                      e.jsx('h3', {
                                        className: 'text-xl font-bold text-gray-900',
                                        children: t.permitNumber,
                                      }),
                                      e.jsx('p', {
                                        className: 'text-gray-600 mt-1',
                                        children: t.address,
                                      }),
                                      e.jsx('p', {
                                        className: 'text-gray-600',
                                        children: t.description,
                                      }),
                                      e.jsxs('div', {
                                        className: 'mt-3 flex items-center gap-4 text-sm',
                                        children: [
                                          e.jsx('span', {
                                            className:
                                              'px-2 py-1 rounded ' +
                                              ('active' === t.status
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700'),
                                            children: t.status.toUpperCase(),
                                          }),
                                          e.jsxs('span', { children: ['Issued: ', t.issuedDate] }),
                                          e.jsx('span', { children: '•' }),
                                          e.jsxs('span', {
                                            children: ['Value: $', t.valuation.toLocaleString()],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  e.jsx('button', {
                                    className:
                                      'px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700',
                                    children: 'View Permit',
                                  }),
                                ],
                              }),
                            }),
                        ],
                      },
                      a
                    )
                  ),
                ],
              }),
            !C &&
              0 === w.length &&
              t &&
              e.jsxs('div', {
                className: 'bg-white rounded-lg shadow-lg p-12 text-center',
                children: [
                  e.jsx(r, { className: 'w-16 h-16 text-gray-300 mx-auto mb-4' }),
                  e.jsxs('p', {
                    className: 'text-gray-600',
                    children: ['No results found for "', t, '"'],
                  }),
                  e.jsx('p', {
                    className: 'text-sm text-gray-500 mt-2',
                    children: 'Try searching with different keywords',
                  }),
                ],
              }),
          ],
        });
    return e.jsxs('div', {
      className: 'min-h-screen bg-gray-50',
      children: [
        e.jsx('header', {
          className: 'bg-white shadow-sm border-b',
          children: e.jsx('div', {
            className: 'container mx-auto px-4 py-4',
            children: e.jsxs('div', {
              className: 'flex items-center justify-between',
              children: [
                e.jsxs('div', {
                  className: 'flex items-center gap-6',
                  children: [
                    e.jsx('h1', {
                      className: 'text-2xl font-bold text-gray-900',
                      children: 'Benton County Public Records',
                    }),
                    e.jsx('nav', {
                      className: 'hidden md:flex gap-1',
                      children: [
                        { id: 'search', label: 'Search', icon: r },
                        { id: 'property', label: 'Property', icon: i },
                        { id: 'documents', label: 'Documents', icon: n },
                        { id: 'permits', label: 'Permits', icon: d },
                        { id: 'meetings', label: 'Meetings', icon: c },
                      ].map(s =>
                        e.jsxs(
                          'button',
                          {
                            onClick: () => P(s.id),
                            className:
                              'flex items-center gap-2 px-4 py-2 rounded-lg ' +
                              (L === s.id
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-50'),
                            children: [e.jsx(s.icon, { className: 'w-4 h-4' }), s.label],
                          },
                          s.id
                        )
                      ),
                    }),
                  ],
                }),
                e.jsxs('div', {
                  className: 'flex items-center gap-2 text-sm text-gray-600',
                  children: [
                    e.jsx(o, { className: 'w-4 h-4' }),
                    e.jsx('span', { children: 'Office Hours: Mon-Fri 8am-5pm' }),
                    e.jsx('span', { children: '•' }),
                    e.jsx(x, { className: 'w-4 h-4' }),
                    e.jsx('span', { children: '(509) 736-3000' }),
                  ],
                }),
              ],
            }),
          }),
        }),
        e.jsx('main', {
          className: 'container mx-auto px-4 py-8',
          children: f
            ? e.jsxs('div', {
                children: [
                  e.jsxs('button', {
                    onClick: () => v(null),
                    className: 'mb-4 text-blue-600 hover:underline flex items-center gap-2',
                    children: [e.jsx(m, { className: 'w-4 h-4' }), 'Back to search'],
                  }),
                  e.jsx(k, { property: f }),
                ],
              })
            : e.jsx(I, {}),
        }),
        e.jsx('footer', {
          className: 'bg-gray-100 border-t mt-12',
          children: e.jsx('div', {
            className: 'container mx-auto px-4 py-6',
            children: e.jsxs('div', {
              className: 'text-center text-sm text-gray-600',
              children: [
                e.jsx('p', {
                  children: 'Benton County Public Records • 620 Market St, Prosser, WA 99350',
                }),
                e.jsx('p', {
                  className: 'mt-2',
                  children: 'This is public information provided as a service to citizens',
                }),
              ],
            }),
          }),
        }),
      ],
    });
  },
  v = performance.now();
b.createRoot(document.getElementById('root')).render(
  e.jsx(l.StrictMode, { children: e.jsx(f, {}) })
);
performance.now();
//# sourceMappingURL=index-fY4Pfxb_.js.map
