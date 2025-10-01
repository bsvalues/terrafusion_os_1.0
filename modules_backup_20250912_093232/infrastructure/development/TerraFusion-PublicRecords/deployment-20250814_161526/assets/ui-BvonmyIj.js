import { r as e } from './react-vendor-DtX1tuCI.js';
/**
 * @license lucide-react v0.314.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ var a = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};
/**
 * @license lucide-react v0.314.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */ const t = (t, r) => {
    const y = e.forwardRef(
      (
        {
          color: y = 'currentColor',
          size: h = 24,
          strokeWidth: i = 2,
          absoluteStrokeWidth: k,
          className: c = '',
          children: d,
          ...o
        },
        l
      ) => {
        return e.createElement(
          'svg',
          {
            ref: l,
            ...a,
            width: h,
            height: h,
            stroke: y,
            strokeWidth: k ? (24 * Number(i)) / Number(h) : i,
            className: [
              'lucide',
              `lucide-${
                ((p = t),
                p
                  .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
                  .toLowerCase()
                  .trim())
              }`,
              c,
            ].join(' '),
            ...o,
          },
          [...r.map(([a, t]) => e.createElement(a, t)), ...(Array.isArray(d) ? d : [d])]
        );
        var p;
      }
    );
    return ((y.displayName = `${t}`), y);
  },
  r = t('Building', [
    ['rect', { width: '16', height: '20', x: '4', y: '2', rx: '2', ry: '2', key: '76otgf' }],
    ['path', { d: 'M9 22v-4h6v4', key: 'r93iot' }],
    ['path', { d: 'M8 6h.01', key: '1dz90k' }],
    ['path', { d: 'M16 6h.01', key: '1x0f13' }],
    ['path', { d: 'M12 6h.01', key: '1vi96p' }],
    ['path', { d: 'M12 10h.01', key: '1nrarc' }],
    ['path', { d: 'M12 14h.01', key: '1etili' }],
    ['path', { d: 'M16 10h.01', key: '1m94wz' }],
    ['path', { d: 'M16 14h.01', key: '1gbofw' }],
    ['path', { d: 'M8 10h.01', key: '19clt8' }],
    ['path', { d: 'M8 14h.01', key: '6423bh' }],
  ]),
  y = t('ChevronLeft', [['path', { d: 'm15 18-6-6 6-6', key: '1wnfg3' }]]),
  h = t('Clock', [
    ['circle', { cx: '12', cy: '12', r: '10', key: '1mglay' }],
    ['polyline', { points: '12 6 12 12 16 14', key: '68esgv' }],
  ]),
  i = t('DollarSign', [
    ['line', { x1: '12', x2: '12', y1: '2', y2: '22', key: '7eqyqh' }],
    ['path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6', key: '1b0p4s' }],
  ]),
  k = t('FileText', [
    ['path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z', key: '1rqfz7' }],
    ['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4', key: 'tnqrlb' }],
    ['path', { d: 'M10 9H8', key: 'b1mrlr' }],
    ['path', { d: 'M16 13H8', key: 't4e002' }],
    ['path', { d: 'M16 17H8', key: 'z1uh3a' }],
  ]),
  c = t('Gavel', [
    ['path', { d: 'm14.5 12.5-8 8a2.119 2.119 0 1 1-3-3l8-8', key: '15492f' }],
    ['path', { d: 'm16 16 6-6', key: 'vzrcl6' }],
    ['path', { d: 'm8 8 6-6', key: '18bi4p' }],
    ['path', { d: 'm9 7 8 8', key: '5jnvq1' }],
    ['path', { d: 'm21 11-8-8', key: 'z4y7zo' }],
  ]),
  d = t('Home', [
    ['path', { d: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', key: 'y5dka4' }],
    ['polyline', { points: '9 22 9 12 15 12 15 22', key: 'e2us08' }],
  ]),
  o = t('MapPin', [
    ['path', { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z', key: '2oe9fu' }],
    ['circle', { cx: '12', cy: '10', r: '3', key: 'ilqhr7' }],
  ]),
  l = t('Phone', [
    [
      'path',
      {
        d: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
        key: 'foiqr5',
      },
    ],
  ]),
  p = t('Printer', [
    ['polyline', { points: '6 9 6 2 18 2 18 9', key: '1306q4' }],
    [
      'path',
      {
        d: 'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2',
        key: '143wyd',
      },
    ],
    ['rect', { width: '12', height: '8', x: '6', y: '14', key: '5ipwut' }],
  ]),
  s = t('Search', [
    ['circle', { cx: '11', cy: '11', r: '8', key: '4ej97u' }],
    ['path', { d: 'm21 21-4.3-4.3', key: '1qie3q' }],
  ]),
  n = t('Share2', [
    ['circle', { cx: '18', cy: '5', r: '3', key: 'gq8acd' }],
    ['circle', { cx: '6', cy: '12', r: '3', key: 'w7nqdw' }],
    ['circle', { cx: '18', cy: '19', r: '3', key: '1xt0gg' }],
    ['line', { x1: '8.59', x2: '15.42', y1: '13.51', y2: '17.49', key: '47mynk' }],
    ['line', { x1: '15.41', x2: '8.59', y1: '6.51', y2: '10.49', key: '1n3mei' }],
  ]),
  m = t('Star', [
    [
      'polygon',
      {
        points:
          '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2',
        key: '8f66p6',
      },
    ],
  ]),
  v = t('User', [
    ['path', { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', key: '975kel' }],
    ['circle', { cx: '12', cy: '7', r: '4', key: '17ys0d' }],
  ]);
export {
  r as B,
  h as C,
  i as D,
  k as F,
  c as G,
  d as H,
  o as M,
  l as P,
  s as S,
  v as U,
  y as a,
  p as b,
  n as c,
  m as d,
};
//# sourceMappingURL=ui-BvonmyIj.js.map
