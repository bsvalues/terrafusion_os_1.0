import { r as t } from './react-vendor-DtX1tuCI.js';
var e = { exports: {} },
  n = {},
  i = t,
  s = Symbol.for('react.element'),
  o = Symbol.for('react.fragment'),
  r = Object.prototype.hasOwnProperty,
  a = i.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  l = { key: !0, ref: !0, __self: !0, __source: !0 };
function u(t, e, n) {
  var i,
    o = {},
    u = null,
    c = null;
  for (i in (void 0 !== n && (u = '' + n),
  void 0 !== e.key && (u = '' + e.key),
  void 0 !== e.ref && (c = e.ref),
  e))
    r.call(e, i) && !l.hasOwnProperty(i) && (o[i] = e[i]);
  if (t && t.defaultProps) for (i in (e = t.defaultProps)) void 0 === o[i] && (o[i] = e[i]);
  return { $$typeof: s, type: t, key: u, ref: c, props: o, _owner: a.current };
}
((n.Fragment = o), (n.jsx = u), (n.jsxs = u), (e.exports = n));
var c = e.exports;
const h = t.createContext({});
const d = t.createContext(null),
  p = t.createContext({ transformPagePoint: t => t, isStatic: !1, reducedMotion: 'never' });
const m = 'undefined' != typeof window,
  f = m ? t.useLayoutEffect : t.useEffect,
  v = t => t;
let g = v;
function y(t) {
  let e;
  return () => (void 0 === e && (e = t()), e);
}
const x = (t, e, n) => {
    const i = e - t;
    return 0 === i ? 1 : (n - t) / i;
  },
  P = t => 1e3 * t,
  T = t => t / 1e3,
  w = !1;
const S = ['read', 'resolveKeyframes', 'update', 'preRender', 'render', 'postRender'];
function b(t, e) {
  let n = !1,
    i = !0;
  const s = { delta: 0, timestamp: 0, isProcessing: !1 },
    o = () => (n = !0),
    r = S.reduce(
      (t, e) => (
        (t[e] = (function (t) {
          let e = new Set(),
            n = new Set(),
            i = !1,
            s = !1;
          const o = new WeakSet();
          let r = { delta: 0, timestamp: 0, isProcessing: !1 };
          function a(e) {
            (o.has(e) && (l.schedule(e), t()), e(r));
          }
          const l = {
            schedule: (t, s = !1, r = !1) => {
              const a = r && i ? e : n;
              return (s && o.add(t), a.has(t) || a.add(t), t);
            },
            cancel: t => {
              (n.delete(t), o.delete(t));
            },
            process: t => {
              ((r = t),
                i
                  ? (s = !0)
                  : ((i = !0),
                    ([e, n] = [n, e]),
                    e.forEach(a),
                    e.clear(),
                    (i = !1),
                    s && ((s = !1), l.process(t))));
            },
          };
          return l;
        })(o)),
        t
      ),
      {}
    ),
    { read: a, resolveKeyframes: l, update: u, preRender: c, render: h, postRender: d } = r,
    p = () => {
      const o = performance.now();
      ((n = !1),
        (s.delta = i ? 1e3 / 60 : Math.max(Math.min(o - s.timestamp, 40), 1)),
        (s.timestamp = o),
        (s.isProcessing = !0),
        a.process(s),
        l.process(s),
        u.process(s),
        c.process(s),
        h.process(s),
        d.process(s),
        (s.isProcessing = !1),
        n && e && ((i = !1), t(p)));
    };
  return {
    schedule: S.reduce((e, o) => {
      const a = r[o];
      return (
        (e[o] = (e, o = !1, r = !1) => (
          n || ((n = !0), (i = !0), s.isProcessing || t(p)),
          a.schedule(e, o, r)
        )),
        e
      );
    }, {}),
    cancel: t => {
      for (let e = 0; e < S.length; e++) r[S[e]].cancel(t);
    },
    state: s,
    steps: r,
  };
}
const {
    schedule: A,
    cancel: E,
    state: V,
    steps: C,
  } = b('undefined' != typeof requestAnimationFrame ? requestAnimationFrame : v, !0),
  M = t.createContext({ strict: !1 }),
  D = {
    animation: [
      'animate',
      'variants',
      'whileHover',
      'whileTap',
      'exit',
      'whileInView',
      'whileFocus',
      'whileDrag',
    ],
    exit: ['exit'],
    drag: ['drag', 'dragControls'],
    focus: ['whileFocus'],
    hover: ['whileHover', 'onHoverStart', 'onHoverEnd'],
    tap: ['whileTap', 'onTap', 'onTapStart', 'onTapCancel'],
    pan: ['onPan', 'onPanStart', 'onPanSessionStart', 'onPanEnd'],
    inView: ['whileInView', 'onViewportEnter', 'onViewportLeave'],
    layout: ['layout', 'layoutId'],
  },
  R = {};
for (const ia in D) R[ia] = { isEnabled: t => D[ia].some(e => !!t[e]) };
const k = new Set([
  'animate',
  'exit',
  'variants',
  'initial',
  'style',
  'values',
  'variants',
  'transition',
  'transformTemplate',
  'custom',
  'inherit',
  'onBeforeLayoutMeasure',
  'onAnimationStart',
  'onAnimationComplete',
  'onUpdate',
  'onDragStart',
  'onDrag',
  'onDragEnd',
  'onMeasureDragConstraints',
  'onDirectionLock',
  'onDragTransitionEnd',
  '_dragX',
  '_dragY',
  'onHoverStart',
  'onHoverEnd',
  'onViewportEnter',
  'onViewportLeave',
  'globalTapTarget',
  'ignoreStrict',
  'viewport',
]);
function L(t) {
  return (
    t.startsWith('while') ||
    (t.startsWith('drag') && 'draggable' !== t) ||
    t.startsWith('layout') ||
    t.startsWith('onTap') ||
    t.startsWith('onPan') ||
    t.startsWith('onLayout') ||
    k.has(t)
  );
}
let j = t => !L(t);
try {
  (F = require('@emotion/is-prop-valid').default) && (j = t => (t.startsWith('on') ? !L(t) : F(t)));
} catch (na) {}
var F;
function B(t) {
  if ('undefined' == typeof Proxy) return t;
  const e = new Map();
  return new Proxy((...e) => t(...e), {
    get: (n, i) => ('create' === i ? t : (e.has(i) || e.set(i, t(i)), e.get(i))),
  });
}
const O = t.createContext({});
function I(t) {
  return 'string' == typeof t || Array.isArray(t);
}
function U(t) {
  return null !== t && 'object' == typeof t && 'function' == typeof t.start;
}
const N = ['animate', 'whileInView', 'whileFocus', 'whileHover', 'whileTap', 'whileDrag', 'exit'],
  W = ['initial', ...N];
function $(t) {
  return U(t.animate) || W.some(e => I(t[e]));
}
function K(t) {
  return Boolean($(t) || t.variants);
}
function Y(e) {
  const { initial: n, animate: i } = (function (t, e) {
    if ($(t)) {
      const { initial: e, animate: n } = t;
      return { initial: !1 === e || I(e) ? e : void 0, animate: I(n) ? n : void 0 };
    }
    return !1 !== t.inherit ? e : {};
  })(e, t.useContext(O));
  return t.useMemo(() => ({ initial: n, animate: i }), [z(n), z(i)]);
}
function z(t) {
  return Array.isArray(t) ? t.join(' ') : t;
}
const X = Symbol.for('motionComponentSymbol');
function H(t) {
  return t && 'object' == typeof t && Object.prototype.hasOwnProperty.call(t, 'current');
}
function _(e, n, i) {
  return t.useCallback(
    t => {
      (t && e.onMount && e.onMount(t),
        n && (t ? n.mount(t) : n.unmount()),
        i && ('function' == typeof i ? i(t) : H(i) && (i.current = t)));
    },
    [n]
  );
}
const G = t => t.replace(/([a-z])([A-Z])/gu, '$1-$2').toLowerCase(),
  q = 'data-' + G('framerAppearId'),
  { schedule: Z } = b(queueMicrotask, !1),
  J = t.createContext({});
function Q(e, n, i, s, o) {
  var r, a;
  const { visualElement: l } = t.useContext(O),
    u = t.useContext(M),
    c = t.useContext(d),
    h = t.useContext(p).reducedMotion,
    m = t.useRef(null);
  ((s = s || u.renderer),
    !m.current &&
      s &&
      (m.current = s(e, {
        visualState: n,
        parent: l,
        props: i,
        presenceContext: c,
        blockInitialAnimation: !!c && !1 === c.initial,
        reducedMotionConfig: h,
      })));
  const v = m.current,
    g = t.useContext(J);
  !v ||
    v.projection ||
    !o ||
    ('html' !== v.type && 'svg' !== v.type) ||
    (function (t, e, n, i) {
      const {
        layoutId: s,
        layout: o,
        drag: r,
        dragConstraints: a,
        layoutScroll: l,
        layoutRoot: u,
      } = e;
      ((t.projection = new n(t.latestValues, e['data-framer-portal-id'] ? void 0 : tt(t.parent))),
        t.projection.setOptions({
          layoutId: s,
          layout: o,
          alwaysMeasureLayout: Boolean(r) || (a && H(a)),
          visualElement: t,
          animationType: 'string' == typeof o ? o : 'both',
          initialPromotionConfig: i,
          layoutScroll: l,
          layoutRoot: u,
        }));
    })(m.current, i, o, g);
  const y = t.useRef(!1);
  t.useInsertionEffect(() => {
    v && y.current && v.update(i, c);
  });
  const x = i[q],
    P = t.useRef(
      Boolean(x) &&
        !(null === (r = window.MotionHandoffIsComplete) || void 0 === r
          ? void 0
          : r.call(window, x)) &&
        (null === (a = window.MotionHasOptimisedAnimation) || void 0 === a
          ? void 0
          : a.call(window, x))
    );
  return (
    f(() => {
      v &&
        ((y.current = !0),
        (window.MotionIsMounted = !0),
        v.updateFeatures(),
        Z.render(v.render),
        P.current && v.animationState && v.animationState.animateChanges());
    }),
    t.useEffect(() => {
      v &&
        (!P.current && v.animationState && v.animationState.animateChanges(),
        P.current &&
          (queueMicrotask(() => {
            var t;
            null === (t = window.MotionHandoffMarkAsComplete) || void 0 === t || t.call(window, x);
          }),
          (P.current = !1)));
    }),
    v
  );
}
function tt(t) {
  if (t) return !1 !== t.options.allowProjection ? t.projection : tt(t.parent);
}
function et({
  preloadedFeatures: e,
  createVisualElement: n,
  useRender: i,
  useVisualState: s,
  Component: o,
}) {
  var r, a;
  function l(e, r) {
    let a;
    const l = { ...t.useContext(p), ...e, layoutId: nt(e) },
      { isStatic: u } = l,
      h = Y(e),
      d = s(e, u);
    if (!u && m) {
      t.useContext(M).strict;
      const e = (function (t) {
        const { drag: e, layout: n } = R;
        if (!e && !n) return {};
        const i = { ...e, ...n };
        return {
          MeasureLayout:
            (null == e ? void 0 : e.isEnabled(t)) || (null == n ? void 0 : n.isEnabled(t))
              ? i.MeasureLayout
              : void 0,
          ProjectionNode: i.ProjectionNode,
        };
      })(l);
      ((a = e.MeasureLayout), (h.visualElement = Q(o, d, l, n, e.ProjectionNode)));
    }
    return c.jsxs(O.Provider, {
      value: h,
      children: [
        a && h.visualElement ? c.jsx(a, { visualElement: h.visualElement, ...l }) : null,
        i(o, e, _(d, h.visualElement, r), d, u, h.visualElement),
      ],
    });
  }
  (e &&
    (function (t) {
      for (const e in t) R[e] = { ...R[e], ...t[e] };
    })(e),
    (l.displayName = `motion.${'string' == typeof o ? o : `create(${null !== (a = null !== (r = o.displayName) && void 0 !== r ? r : o.name) && void 0 !== a ? a : ''})`}`));
  const u = t.forwardRef(l);
  return ((u[X] = o), u);
}
function nt({ layoutId: e }) {
  const n = t.useContext(h).id;
  return n && void 0 !== e ? n + '-' + e : e;
}
const it = [
  'animate',
  'circle',
  'defs',
  'desc',
  'ellipse',
  'g',
  'image',
  'line',
  'filter',
  'marker',
  'mask',
  'metadata',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'rect',
  'stop',
  'switch',
  'symbol',
  'svg',
  'text',
  'tspan',
  'use',
  'view',
];
function st(t) {
  return 'string' == typeof t && !t.includes('-') && !!(it.indexOf(t) > -1 || /[A-Z]/u.test(t));
}
function ot(t) {
  const e = [{}, {}];
  return (
    null == t ||
      t.values.forEach((t, n) => {
        ((e[0][n] = t.get()), (e[1][n] = t.getVelocity()));
      }),
    e
  );
}
function rt(t, e, n, i) {
  if ('function' == typeof e) {
    const [s, o] = ot(i);
    e = e(void 0 !== n ? n : t.custom, s, o);
  }
  if (('string' == typeof e && (e = t.variants && t.variants[e]), 'function' == typeof e)) {
    const [s, o] = ot(i);
    e = e(void 0 !== n ? n : t.custom, s, o);
  }
  return e;
}
const at = t => Array.isArray(t),
  lt = t => (at(t) ? t[t.length - 1] || 0 : t),
  ut = t => Boolean(t && t.getVelocity);
function ct(t) {
  const e = ut(t) ? t.get() : t;
  return ((n = e), Boolean(n && 'object' == typeof n && n.mix && n.toValue) ? e.toValue() : e);
  var n;
}
const ht = e => (n, i) => {
  const s = t.useContext(O),
    o = t.useContext(d),
    r = () =>
      (function ({ scrapeMotionValuesFromProps: t, createRenderState: e, onUpdate: n }, i, s, o) {
        const r = { latestValues: dt(i, s, o, t), renderState: e() };
        return (
          n && ((r.onMount = t => n({ props: i, current: t, ...r })), (r.onUpdate = t => n(t))),
          r
        );
      })(e, n, s, o);
  return i
    ? r()
    : (function (e) {
        const n = t.useRef(null);
        return (null === n.current && (n.current = e()), n.current);
      })(r);
};
function dt(t, e, n, i) {
  const s = {},
    o = i(t, {});
  for (const d in o) s[d] = ct(o[d]);
  let { initial: r, animate: a } = t;
  const l = $(t),
    u = K(t);
  e &&
    u &&
    !l &&
    !1 !== t.inherit &&
    (void 0 === r && (r = e.initial), void 0 === a && (a = e.animate));
  let c = !!n && !1 === n.initial;
  c = c || !1 === r;
  const h = c ? a : r;
  if (h && 'boolean' != typeof h && !U(h)) {
    const e = Array.isArray(h) ? h : [h];
    for (let n = 0; n < e.length; n++) {
      const i = rt(t, e[n]);
      if (i) {
        const { transitionEnd: t, transition: e, ...n } = i;
        for (const i in n) {
          let t = n[i];
          if (Array.isArray(t)) {
            t = t[c ? t.length - 1 : 0];
          }
          null !== t && (s[i] = t);
        }
        for (const i in t) s[i] = t[i];
      }
    }
  }
  return s;
}
const pt = [
    'transformPerspective',
    'x',
    'y',
    'z',
    'translateX',
    'translateY',
    'translateZ',
    'scale',
    'scaleX',
    'scaleY',
    'rotate',
    'rotateX',
    'rotateY',
    'rotateZ',
    'skew',
    'skewX',
    'skewY',
  ],
  mt = new Set(pt),
  ft = t => e => 'string' == typeof e && e.startsWith(t),
  vt = ft('--'),
  gt = ft('var(--'),
  yt = t => !!gt(t) && xt.test(t.split('/*')[0].trim()),
  xt = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu,
  Pt = (t, e) => (e && 'number' == typeof t ? e.transform(t) : t),
  Tt = (t, e, n) => (n > e ? e : n < t ? t : n),
  wt = { test: t => 'number' == typeof t, parse: parseFloat, transform: t => t },
  St = { ...wt, transform: t => Tt(0, 1, t) },
  bt = { ...wt, default: 1 },
  At = t => ({
    test: e => 'string' == typeof e && e.endsWith(t) && 1 === e.split(' ').length,
    parse: parseFloat,
    transform: e => `${e}${t}`,
  }),
  Et = At('deg'),
  Vt = At('%'),
  Ct = At('px'),
  Mt = At('vh'),
  Dt = At('vw'),
  Rt = { ...Vt, parse: t => Vt.parse(t) / 100, transform: t => Vt.transform(100 * t) },
  kt = {
    borderWidth: Ct,
    borderTopWidth: Ct,
    borderRightWidth: Ct,
    borderBottomWidth: Ct,
    borderLeftWidth: Ct,
    borderRadius: Ct,
    radius: Ct,
    borderTopLeftRadius: Ct,
    borderTopRightRadius: Ct,
    borderBottomRightRadius: Ct,
    borderBottomLeftRadius: Ct,
    width: Ct,
    maxWidth: Ct,
    height: Ct,
    maxHeight: Ct,
    top: Ct,
    right: Ct,
    bottom: Ct,
    left: Ct,
    padding: Ct,
    paddingTop: Ct,
    paddingRight: Ct,
    paddingBottom: Ct,
    paddingLeft: Ct,
    margin: Ct,
    marginTop: Ct,
    marginRight: Ct,
    marginBottom: Ct,
    marginLeft: Ct,
    backgroundPositionX: Ct,
    backgroundPositionY: Ct,
  },
  Lt = {
    rotate: Et,
    rotateX: Et,
    rotateY: Et,
    rotateZ: Et,
    scale: bt,
    scaleX: bt,
    scaleY: bt,
    scaleZ: bt,
    skew: Et,
    skewX: Et,
    skewY: Et,
    distance: Ct,
    translateX: Ct,
    translateY: Ct,
    translateZ: Ct,
    x: Ct,
    y: Ct,
    z: Ct,
    perspective: Ct,
    transformPerspective: Ct,
    opacity: St,
    originX: Rt,
    originY: Rt,
    originZ: Ct,
  },
  jt = { ...wt, transform: Math.round },
  Ft = { ...kt, ...Lt, zIndex: jt, size: Ct, fillOpacity: St, strokeOpacity: St, numOctaves: jt },
  Bt = { x: 'translateX', y: 'translateY', z: 'translateZ', transformPerspective: 'perspective' },
  Ot = pt.length;
function It(t, e, n) {
  const { style: i, vars: s, transformOrigin: o } = t;
  let r = !1,
    a = !1;
  for (const l in e) {
    const t = e[l];
    if (mt.has(l)) r = !0;
    else if (vt(l)) s[l] = t;
    else {
      const e = Pt(t, Ft[l]);
      l.startsWith('origin') ? ((a = !0), (o[l] = e)) : (i[l] = e);
    }
  }
  if (
    (e.transform ||
      (r || n
        ? (i.transform = (function (t, e, n) {
            let i = '',
              s = !0;
            for (let o = 0; o < Ot; o++) {
              const r = pt[o],
                a = t[r];
              if (void 0 === a) continue;
              let l = !0;
              if (
                ((l =
                  'number' == typeof a
                    ? a === (r.startsWith('scale') ? 1 : 0)
                    : 0 === parseFloat(a)),
                !l || n)
              ) {
                const t = Pt(a, Ft[r]);
                (l || ((s = !1), (i += `${Bt[r] || r}(${t}) `)), n && (e[r] = t));
              }
            }
            return ((i = i.trim()), n ? (i = n(e, s ? '' : i)) : s && (i = 'none'), i);
          })(e, t.transform, n))
        : i.transform && (i.transform = 'none')),
    a)
  ) {
    const { originX: t = '50%', originY: e = '50%', originZ: n = 0 } = o;
    i.transformOrigin = `${t} ${e} ${n}`;
  }
}
const Ut = { offset: 'stroke-dashoffset', array: 'stroke-dasharray' },
  Nt = { offset: 'strokeDashoffset', array: 'strokeDasharray' };
function Wt(t, e, n) {
  return 'string' == typeof t ? t : Ct.transform(e + n * t);
}
function $t(
  t,
  {
    attrX: e,
    attrY: n,
    attrScale: i,
    originX: s,
    originY: o,
    pathLength: r,
    pathSpacing: a = 1,
    pathOffset: l = 0,
    ...u
  },
  c,
  h
) {
  if ((It(t, u, h), c)) return void (t.style.viewBox && (t.attrs.viewBox = t.style.viewBox));
  ((t.attrs = t.style), (t.style = {}));
  const { attrs: d, style: p, dimensions: m } = t;
  (d.transform && (m && (p.transform = d.transform), delete d.transform),
    m &&
      (void 0 !== s || void 0 !== o || p.transform) &&
      (p.transformOrigin = (function (t, e, n) {
        return `${Wt(e, t.x, t.width)} ${Wt(n, t.y, t.height)}`;
      })(m, void 0 !== s ? s : 0.5, void 0 !== o ? o : 0.5)),
    void 0 !== e && (d.x = e),
    void 0 !== n && (d.y = n),
    void 0 !== i && (d.scale = i),
    void 0 !== r &&
      (function (t, e, n = 1, i = 0, s = !0) {
        t.pathLength = 1;
        const o = s ? Ut : Nt;
        t[o.offset] = Ct.transform(-i);
        const r = Ct.transform(e),
          a = Ct.transform(n);
        t[o.array] = `${r} ${a}`;
      })(d, r, a, l, !1));
}
const Kt = () => ({ style: {}, transform: {}, transformOrigin: {}, vars: {} }),
  Yt = () => ({ style: {}, transform: {}, transformOrigin: {}, vars: {}, attrs: {} }),
  zt = t => 'string' == typeof t && 'svg' === t.toLowerCase();
function Xt(t, { style: e, vars: n }, i, s) {
  Object.assign(t.style, e, s && s.getProjectionStyles(i));
  for (const o in n) t.style.setProperty(o, n[o]);
}
const Ht = new Set([
  'baseFrequency',
  'diffuseConstant',
  'kernelMatrix',
  'kernelUnitLength',
  'keySplines',
  'keyTimes',
  'limitingConeAngle',
  'markerHeight',
  'markerWidth',
  'numOctaves',
  'targetX',
  'targetY',
  'surfaceScale',
  'specularConstant',
  'specularExponent',
  'stdDeviation',
  'tableValues',
  'viewBox',
  'gradientTransform',
  'pathLength',
  'startOffset',
  'textLength',
  'lengthAdjust',
]);
function _t(t, e, n, i) {
  Xt(t, e, void 0, i);
  for (const s in e.attrs) t.setAttribute(Ht.has(s) ? s : G(s), e.attrs[s]);
}
const Gt = {};
function qt(t, { layout: e, layoutId: n }) {
  return (
    mt.has(t) || t.startsWith('origin') || ((e || void 0 !== n) && (!!Gt[t] || 'opacity' === t))
  );
}
function Zt(t, e, n) {
  var i;
  const { style: s } = t,
    o = {};
  for (const r in s)
    (ut(s[r]) ||
      (e.style && ut(e.style[r])) ||
      qt(r, t) ||
      void 0 !==
        (null === (i = null == n ? void 0 : n.getValue(r)) || void 0 === i
          ? void 0
          : i.liveStyle)) &&
      (o[r] = s[r]);
  return o;
}
function Jt(t, e, n) {
  const i = Zt(t, e, n);
  for (const s in t)
    if (ut(t[s]) || ut(e[s])) {
      i[-1 !== pt.indexOf(s) ? 'attr' + s.charAt(0).toUpperCase() + s.substring(1) : s] = t[s];
    }
  return i;
}
const Qt = ['x', 'y', 'width', 'height', 'cx', 'cy', 'r'],
  te = {
    useVisualState: ht({
      scrapeMotionValuesFromProps: Jt,
      createRenderState: Yt,
      onUpdate: ({ props: t, prevProps: e, current: n, renderState: i, latestValues: s }) => {
        if (!n) return;
        let o = !!t.drag;
        if (!o)
          for (const a in s)
            if (mt.has(a)) {
              o = !0;
              break;
            }
        if (!o) return;
        let r = !e;
        if (e)
          for (let a = 0; a < Qt.length; a++) {
            const n = Qt[a];
            t[n] !== e[n] && (r = !0);
          }
        r &&
          A.read(() => {
            (!(function (t, e) {
              try {
                e.dimensions =
                  'function' == typeof t.getBBox ? t.getBBox() : t.getBoundingClientRect();
              } catch (n) {
                e.dimensions = { x: 0, y: 0, width: 0, height: 0 };
              }
            })(n, i),
              A.render(() => {
                ($t(i, s, zt(n.tagName), t.transformTemplate), _t(n, i));
              }));
          });
      },
    }),
  },
  ee = { useVisualState: ht({ scrapeMotionValuesFromProps: Zt, createRenderState: Kt }) };
function ne(t, e, n) {
  for (const i in e) ut(e[i]) || qt(i, n) || (t[i] = e[i]);
}
function ie(e, n) {
  const i = {};
  return (
    ne(i, e.style || {}, e),
    Object.assign(
      i,
      (function ({ transformTemplate: e }, n) {
        return t.useMemo(() => {
          const t = { style: {}, transform: {}, transformOrigin: {}, vars: {} };
          return (It(t, n, e), Object.assign({}, t.vars, t.style));
        }, [n]);
      })(e, n)
    ),
    i
  );
}
function se(t, e) {
  const n = {},
    i = ie(t, e);
  return (
    t.drag &&
      !1 !== t.dragListener &&
      ((n.draggable = !1),
      (i.userSelect = i.WebkitUserSelect = i.WebkitTouchCallout = 'none'),
      (i.touchAction = !0 === t.drag ? 'none' : 'pan-' + ('x' === t.drag ? 'y' : 'x'))),
    void 0 === t.tabIndex && (t.onTap || t.onTapStart || t.whileTap) && (n.tabIndex = 0),
    (n.style = i),
    n
  );
}
function oe(e, n, i, s) {
  const o = t.useMemo(() => {
    const t = { style: {}, transform: {}, transformOrigin: {}, vars: {}, attrs: {} };
    return ($t(t, n, zt(s), e.transformTemplate), { ...t.attrs, style: { ...t.style } });
  }, [n]);
  if (e.style) {
    const t = {};
    (ne(t, e.style, e), (o.style = { ...t, ...o.style }));
  }
  return o;
}
function re(e = !1) {
  return (n, i, s, { latestValues: o }, r) => {
    const a = (st(n) ? oe : se)(i, o, r, n),
      l = (function (t, e, n) {
        const i = {};
        for (const s in t)
          ('values' === s && 'object' == typeof t.values) ||
            ((j(s) ||
              (!0 === n && L(s)) ||
              (!e && !L(s)) ||
              (t.draggable && s.startsWith('onDrag'))) &&
              (i[s] = t[s]));
        return i;
      })(i, 'string' == typeof n, e),
      u = n !== t.Fragment ? { ...l, ...a, ref: s } : {},
      { children: c } = i,
      h = t.useMemo(() => (ut(c) ? c.get() : c), [c]);
    return t.createElement(n, { ...u, children: h });
  };
}
function ae(t, e) {
  return function (n, { forwardMotionProps: i } = { forwardMotionProps: !1 }) {
    return et({
      ...(st(n) ? te : ee),
      preloadedFeatures: t,
      useRender: re(i),
      createVisualElement: e,
      Component: n,
    });
  };
}
function le(t, e) {
  if (!Array.isArray(e)) return !1;
  const n = e.length;
  if (n !== t.length) return !1;
  for (let i = 0; i < n; i++) if (e[i] !== t[i]) return !1;
  return !0;
}
function ue(t, e, n) {
  const i = t.getProps();
  return rt(i, e, void 0 !== n ? n : i.custom, t);
}
const ce = y(() => void 0 !== window.ScrollTimeline);
class he {
  constructor(t) {
    ((this.stop = () => this.runAll('stop')), (this.animations = t.filter(Boolean)));
  }
  get finished() {
    return Promise.all(this.animations.map(t => ('finished' in t ? t.finished : t)));
  }
  getAll(t) {
    return this.animations[0][t];
  }
  setAll(t, e) {
    for (let n = 0; n < this.animations.length; n++) this.animations[n][t] = e;
  }
  attachTimeline(t, e) {
    const n = this.animations.map(n =>
      ce() && n.attachTimeline ? n.attachTimeline(t) : 'function' == typeof e ? e(n) : void 0
    );
    return () => {
      n.forEach((t, e) => {
        (t && t(), this.animations[e].stop());
      });
    };
  }
  get time() {
    return this.getAll('time');
  }
  set time(t) {
    this.setAll('time', t);
  }
  get speed() {
    return this.getAll('speed');
  }
  set speed(t) {
    this.setAll('speed', t);
  }
  get startTime() {
    return this.getAll('startTime');
  }
  get duration() {
    let t = 0;
    for (let e = 0; e < this.animations.length; e++) t = Math.max(t, this.animations[e].duration);
    return t;
  }
  runAll(t) {
    this.animations.forEach(e => e[t]());
  }
  flatten() {
    this.runAll('flatten');
  }
  play() {
    this.runAll('play');
  }
  pause() {
    this.runAll('pause');
  }
  cancel() {
    this.runAll('cancel');
  }
  complete() {
    this.runAll('complete');
  }
}
class de extends he {
  then(t, e) {
    return Promise.all(this.animations).then(t).catch(e);
  }
}
function pe(t, e) {
  return t ? t[e] || t.default || t : void 0;
}
const me = 2e4;
function fe(t) {
  let e = 0;
  let n = t.next(e);
  for (; !n.done && e < me; ) ((e += 50), (n = t.next(e)));
  return e >= me ? 1 / 0 : e;
}
function ve(t) {
  return 'function' == typeof t;
}
function ge(t, e) {
  ((t.timeline = e), (t.onfinish = null));
}
const ye = t => Array.isArray(t) && 'number' == typeof t[0],
  xe = { linearEasing: void 0 };
function Pe(t, e) {
  const n = y(t);
  return () => {
    var t;
    return null !== (t = xe[e]) && void 0 !== t ? t : n();
  };
}
const Te = Pe(() => {
    try {
      document.createElement('div').animate({ opacity: 0 }, { easing: 'linear(0, 1)' });
    } catch (t) {
      return !1;
    }
    return !0;
  }, 'linearEasing'),
  we = (t, e, n = 10) => {
    let i = '';
    const s = Math.max(Math.round(e / n), 2);
    for (let o = 0; o < s; o++) i += t(x(0, s - 1, o)) + ', ';
    return `linear(${i.substring(0, i.length - 2)})`;
  };
function Se(t) {
  return Boolean(
    ('function' == typeof t && Te()) ||
      !t ||
      ('string' == typeof t && (t in Ae || Te())) ||
      ye(t) ||
      (Array.isArray(t) && t.every(Se))
  );
}
const be = ([t, e, n, i]) => `cubic-bezier(${t}, ${e}, ${n}, ${i})`,
  Ae = {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    circIn: be([0, 0.65, 0.55, 1]),
    circOut: be([0.55, 0, 1, 0.45]),
    backIn: be([0.31, 0.01, 0.66, -0.59]),
    backOut: be([0.33, 1.53, 0.69, 0.99]),
  };
function Ee(t, e) {
  return t
    ? 'function' == typeof t && Te()
      ? we(t, e)
      : ye(t)
        ? be(t)
        : Array.isArray(t)
          ? t.map(t => Ee(t, e) || Ae.easeOut)
          : Ae[t]
    : void 0;
}
const Ve = { x: !1, y: !1 };
function Ce() {
  return Ve.x || Ve.y;
}
function Me(t, e) {
  const n = (function (t) {
      if (t instanceof Element) return [t];
      if ('string' == typeof t) {
        const e = document.querySelectorAll(t);
        return e ? Array.from(e) : [];
      }
      return Array.from(t);
    })(t),
    i = new AbortController();
  return [n, { passive: !0, ...e, signal: i.signal }, () => i.abort()];
}
function De(t) {
  return e => {
    'touch' === e.pointerType || Ce() || t(e);
  };
}
const Re = (t, e) => !!e && (t === e || Re(t, e.parentElement)),
  ke = t =>
    'mouse' === t.pointerType ? 'number' != typeof t.button || t.button <= 0 : !1 !== t.isPrimary,
  Le = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A']);
const je = new WeakSet();
function Fe(t) {
  return e => {
    'Enter' === e.key && t(e);
  };
}
function Be(t, e) {
  t.dispatchEvent(new PointerEvent('pointer' + e, { isPrimary: !0, bubbles: !0 }));
}
function Oe(t) {
  return ke(t) && !Ce();
}
function Ie(t, e, n = {}) {
  const [i, s, o] = Me(t, n),
    r = t => {
      const i = t.currentTarget;
      if (!Oe(t) || je.has(i)) return;
      je.add(i);
      const o = e(t),
        r = (t, e) => {
          (window.removeEventListener('pointerup', a),
            window.removeEventListener('pointercancel', l),
            Oe(t) && je.has(i) && (je.delete(i), 'function' == typeof o && o(t, { success: e })));
        },
        a = t => {
          r(t, n.useGlobalTarget || Re(i, t.target));
        },
        l = t => {
          r(t, !1);
        };
      (window.addEventListener('pointerup', a, s), window.addEventListener('pointercancel', l, s));
    };
  return (
    i.forEach(t => {
      (function (t) {
        return Le.has(t.tagName) || -1 !== t.tabIndex;
      })(t) ||
        null !== t.getAttribute('tabindex') ||
        (t.tabIndex = 0);
      ((n.useGlobalTarget ? window : t).addEventListener('pointerdown', r, s),
        t.addEventListener(
          'focus',
          t =>
            ((t, e) => {
              const n = t.currentTarget;
              if (!n) return;
              const i = Fe(() => {
                if (je.has(n)) return;
                Be(n, 'down');
                const t = Fe(() => {
                  Be(n, 'up');
                });
                (n.addEventListener('keyup', t, e),
                  n.addEventListener('blur', () => Be(n, 'cancel'), e));
              });
              (n.addEventListener('keydown', i, e),
                n.addEventListener('blur', () => n.removeEventListener('keydown', i), e));
            })(t, s),
          s
        ));
    }),
    o
  );
}
const Ue = new Set(['width', 'height', 'top', 'left', 'right', 'bottom', ...pt]);
let Ne;
function We() {
  Ne = void 0;
}
const $e = {
  now: () => (void 0 === Ne && $e.set(V.isProcessing || w ? V.timestamp : performance.now()), Ne),
  set: t => {
    ((Ne = t), queueMicrotask(We));
  },
};
function Ke(t, e) {
  -1 === t.indexOf(e) && t.push(e);
}
function Ye(t, e) {
  const n = t.indexOf(e);
  n > -1 && t.splice(n, 1);
}
class ze {
  constructor() {
    this.subscriptions = [];
  }
  add(t) {
    return (Ke(this.subscriptions, t), () => Ye(this.subscriptions, t));
  }
  notify(t, e, n) {
    const i = this.subscriptions.length;
    if (i)
      if (1 === i) this.subscriptions[0](t, e, n);
      else
        for (let s = 0; s < i; s++) {
          const i = this.subscriptions[s];
          i && i(t, e, n);
        }
  }
  getSize() {
    return this.subscriptions.length;
  }
  clear() {
    this.subscriptions.length = 0;
  }
}
function Xe(t, e) {
  return e ? t * (1e3 / e) : 0;
}
class He {
  constructor(t, e = {}) {
    ((this.version = '11.18.2'),
      (this.canTrackVelocity = null),
      (this.events = {}),
      (this.updateAndNotify = (t, e = !0) => {
        const n = $e.now();
        (this.updatedAt !== n && this.setPrevFrameValue(),
          (this.prev = this.current),
          this.setCurrent(t),
          this.current !== this.prev &&
            this.events.change &&
            this.events.change.notify(this.current),
          e && this.events.renderRequest && this.events.renderRequest.notify(this.current));
      }),
      (this.hasAnimated = !1),
      this.setCurrent(t),
      (this.owner = e.owner));
  }
  setCurrent(t) {
    var e;
    ((this.current = t),
      (this.updatedAt = $e.now()),
      null === this.canTrackVelocity &&
        void 0 !== t &&
        (this.canTrackVelocity = ((e = this.current), !isNaN(parseFloat(e)))));
  }
  setPrevFrameValue(t = this.current) {
    ((this.prevFrameValue = t), (this.prevUpdatedAt = this.updatedAt));
  }
  onChange(t) {
    return this.on('change', t);
  }
  on(t, e) {
    this.events[t] || (this.events[t] = new ze());
    const n = this.events[t].add(e);
    return 'change' === t
      ? () => {
          (n(),
            A.read(() => {
              this.events.change.getSize() || this.stop();
            }));
        }
      : n;
  }
  clearListeners() {
    for (const t in this.events) this.events[t].clear();
  }
  attach(t, e) {
    ((this.passiveEffect = t), (this.stopPassiveEffect = e));
  }
  set(t, e = !0) {
    e && this.passiveEffect
      ? this.passiveEffect(t, this.updateAndNotify)
      : this.updateAndNotify(t, e);
  }
  setWithVelocity(t, e, n) {
    (this.set(e),
      (this.prev = void 0),
      (this.prevFrameValue = t),
      (this.prevUpdatedAt = this.updatedAt - n));
  }
  jump(t, e = !0) {
    (this.updateAndNotify(t),
      (this.prev = t),
      (this.prevUpdatedAt = this.prevFrameValue = void 0),
      e && this.stop(),
      this.stopPassiveEffect && this.stopPassiveEffect());
  }
  get() {
    return this.current;
  }
  getPrevious() {
    return this.prev;
  }
  getVelocity() {
    const t = $e.now();
    if (!this.canTrackVelocity || void 0 === this.prevFrameValue || t - this.updatedAt > 30)
      return 0;
    const e = Math.min(this.updatedAt - this.prevUpdatedAt, 30);
    return Xe(parseFloat(this.current) - parseFloat(this.prevFrameValue), e);
  }
  start(t) {
    return (
      this.stop(),
      new Promise(e => {
        ((this.hasAnimated = !0),
          (this.animation = t(e)),
          this.events.animationStart && this.events.animationStart.notify());
      }).then(() => {
        (this.events.animationComplete && this.events.animationComplete.notify(),
          this.clearAnimation());
      })
    );
  }
  stop() {
    (this.animation &&
      (this.animation.stop(), this.events.animationCancel && this.events.animationCancel.notify()),
      this.clearAnimation());
  }
  isAnimating() {
    return !!this.animation;
  }
  clearAnimation() {
    delete this.animation;
  }
  destroy() {
    (this.clearListeners(), this.stop(), this.stopPassiveEffect && this.stopPassiveEffect());
  }
}
function _e(t, e) {
  return new He(t, e);
}
function Ge(t, e, n) {
  t.hasValue(e) ? t.getValue(e).set(n) : t.addValue(e, _e(n));
}
function qe(t, e) {
  const n = t.getValue('willChange');
  if (((i = n), Boolean(ut(i) && i.add))) return n.add(e);
  var i;
}
function Ze(t) {
  return t.props[q];
}
const Je = (t, e, n) => (((1 - 3 * n + 3 * e) * t + (3 * n - 6 * e)) * t + 3 * e) * t;
function Qe(t, e, n, i) {
  if (t === e && n === i) return v;
  const s = e =>
    (function (t, e, n, i, s) {
      let o,
        r,
        a = 0;
      do {
        ((r = e + (n - e) / 2), (o = Je(r, i, s) - t), o > 0 ? (n = r) : (e = r));
      } while (Math.abs(o) > 1e-7 && ++a < 12);
      return r;
    })(e, 0, 1, t, n);
  return t => (0 === t || 1 === t ? t : Je(s(t), e, i));
}
const tn = t => e => (e <= 0.5 ? t(2 * e) / 2 : (2 - t(2 * (1 - e))) / 2),
  en = t => e => 1 - t(1 - e),
  nn = Qe(0.33, 1.53, 0.69, 0.99),
  sn = en(nn),
  on = tn(sn),
  rn = t => ((t *= 2) < 1 ? 0.5 * sn(t) : 0.5 * (2 - Math.pow(2, -10 * (t - 1)))),
  an = t => 1 - Math.sin(Math.acos(t)),
  ln = en(an),
  un = tn(an),
  cn = t => /^0[^.\s]+$/u.test(t);
function hn(t) {
  return 'number' == typeof t ? 0 === t : null === t || 'none' === t || '0' === t || cn(t);
}
const dn = t => Math.round(1e5 * t) / 1e5,
  pn = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
const mn =
    /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu,
  fn = (t, e) => n =>
    Boolean(
      ('string' == typeof n && mn.test(n) && n.startsWith(t)) ||
        (e &&
          !(function (t) {
            return null == t;
          })(n) &&
          Object.prototype.hasOwnProperty.call(n, e))
    ),
  vn = (t, e, n) => i => {
    if ('string' != typeof i) return i;
    const [s, o, r, a] = i.match(pn);
    return {
      [t]: parseFloat(s),
      [e]: parseFloat(o),
      [n]: parseFloat(r),
      alpha: void 0 !== a ? parseFloat(a) : 1,
    };
  },
  gn = { ...wt, transform: t => Math.round((t => Tt(0, 255, t))(t)) },
  yn = {
    test: fn('rgb', 'red'),
    parse: vn('red', 'green', 'blue'),
    transform: ({ red: t, green: e, blue: n, alpha: i = 1 }) =>
      'rgba(' +
      gn.transform(t) +
      ', ' +
      gn.transform(e) +
      ', ' +
      gn.transform(n) +
      ', ' +
      dn(St.transform(i)) +
      ')',
  };
const xn = {
    test: fn('#'),
    parse: function (t) {
      let e = '',
        n = '',
        i = '',
        s = '';
      return (
        t.length > 5
          ? ((e = t.substring(1, 3)),
            (n = t.substring(3, 5)),
            (i = t.substring(5, 7)),
            (s = t.substring(7, 9)))
          : ((e = t.substring(1, 2)),
            (n = t.substring(2, 3)),
            (i = t.substring(3, 4)),
            (s = t.substring(4, 5)),
            (e += e),
            (n += n),
            (i += i),
            (s += s)),
        {
          red: parseInt(e, 16),
          green: parseInt(n, 16),
          blue: parseInt(i, 16),
          alpha: s ? parseInt(s, 16) / 255 : 1,
        }
      );
    },
    transform: yn.transform,
  },
  Pn = {
    test: fn('hsl', 'hue'),
    parse: vn('hue', 'saturation', 'lightness'),
    transform: ({ hue: t, saturation: e, lightness: n, alpha: i = 1 }) =>
      'hsla(' +
      Math.round(t) +
      ', ' +
      Vt.transform(dn(e)) +
      ', ' +
      Vt.transform(dn(n)) +
      ', ' +
      dn(St.transform(i)) +
      ')',
  },
  Tn = {
    test: t => yn.test(t) || xn.test(t) || Pn.test(t),
    parse: t => (yn.test(t) ? yn.parse(t) : Pn.test(t) ? Pn.parse(t) : xn.parse(t)),
    transform: t =>
      'string' == typeof t ? t : t.hasOwnProperty('red') ? yn.transform(t) : Pn.transform(t),
  },
  wn =
    /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
const Sn = 'number',
  bn = 'color',
  An =
    /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
function En(t) {
  const e = t.toString(),
    n = [],
    i = { color: [], number: [], var: [] },
    s = [];
  let o = 0;
  const r = e
    .replace(
      An,
      t => (
        Tn.test(t)
          ? (i.color.push(o), s.push(bn), n.push(Tn.parse(t)))
          : t.startsWith('var(')
            ? (i.var.push(o), s.push('var'), n.push(t))
            : (i.number.push(o), s.push(Sn), n.push(parseFloat(t))),
        ++o,
        '${}'
      )
    )
    .split('${}');
  return { values: n, split: r, indexes: i, types: s };
}
function Vn(t) {
  return En(t).values;
}
function Cn(t) {
  const { split: e, types: n } = En(t),
    i = e.length;
  return t => {
    let s = '';
    for (let o = 0; o < i; o++)
      if (((s += e[o]), void 0 !== t[o])) {
        const e = n[o];
        s += e === Sn ? dn(t[o]) : e === bn ? Tn.transform(t[o]) : t[o];
      }
    return s;
  };
}
const Mn = t => ('number' == typeof t ? 0 : t);
const Dn = {
    test: function (t) {
      var e, n;
      return (
        isNaN(t) &&
        'string' == typeof t &&
        ((null === (e = t.match(pn)) || void 0 === e ? void 0 : e.length) || 0) +
          ((null === (n = t.match(wn)) || void 0 === n ? void 0 : n.length) || 0) >
          0
      );
    },
    parse: Vn,
    createTransformer: Cn,
    getAnimatableNone: function (t) {
      const e = Vn(t);
      return Cn(t)(e.map(Mn));
    },
  },
  Rn = new Set(['brightness', 'contrast', 'saturate', 'opacity']);
function kn(t) {
  const [e, n] = t.slice(0, -1).split('(');
  if ('drop-shadow' === e) return t;
  const [i] = n.match(pn) || [];
  if (!i) return t;
  const s = n.replace(i, '');
  let o = Rn.has(e) ? 1 : 0;
  return (i !== n && (o *= 100), e + '(' + o + s + ')');
}
const Ln = /\b([a-z-]*)\(.*?\)/gu,
  jn = {
    ...Dn,
    getAnimatableNone: t => {
      const e = t.match(Ln);
      return e ? e.map(kn).join(' ') : t;
    },
  },
  Fn = {
    ...Ft,
    color: Tn,
    backgroundColor: Tn,
    outlineColor: Tn,
    fill: Tn,
    stroke: Tn,
    borderColor: Tn,
    borderTopColor: Tn,
    borderRightColor: Tn,
    borderBottomColor: Tn,
    borderLeftColor: Tn,
    filter: jn,
    WebkitFilter: jn,
  },
  Bn = t => Fn[t];
function On(t, e) {
  let n = Bn(t);
  return (n !== jn && (n = Dn), n.getAnimatableNone ? n.getAnimatableNone(e) : void 0);
}
const In = new Set(['auto', 'none', '0']);
const Un = t => t === wt || t === Ct,
  Nn = (t, e) => parseFloat(t.split(', ')[e]),
  Wn =
    (t, e) =>
    (n, { transform: i }) => {
      if ('none' === i || !i) return 0;
      const s = i.match(/^matrix3d\((.+)\)$/u);
      if (s) return Nn(s[1], e);
      {
        const e = i.match(/^matrix\((.+)\)$/u);
        return e ? Nn(e[1], t) : 0;
      }
    },
  $n = new Set(['x', 'y', 'z']),
  Kn = pt.filter(t => !$n.has(t));
const Yn = {
  width: ({ x: t }, { paddingLeft: e = '0', paddingRight: n = '0' }) =>
    t.max - t.min - parseFloat(e) - parseFloat(n),
  height: ({ y: t }, { paddingTop: e = '0', paddingBottom: n = '0' }) =>
    t.max - t.min - parseFloat(e) - parseFloat(n),
  top: (t, { top: e }) => parseFloat(e),
  left: (t, { left: e }) => parseFloat(e),
  bottom: ({ y: t }, { top: e }) => parseFloat(e) + (t.max - t.min),
  right: ({ x: t }, { left: e }) => parseFloat(e) + (t.max - t.min),
  x: Wn(4, 13),
  y: Wn(5, 14),
};
((Yn.translateX = Yn.x), (Yn.translateY = Yn.y));
const zn = new Set();
let Xn = !1,
  Hn = !1;
function _n() {
  if (Hn) {
    const t = Array.from(zn).filter(t => t.needsMeasurement),
      e = new Set(t.map(t => t.element)),
      n = new Map();
    (e.forEach(t => {
      const e = (function (t) {
        const e = [];
        return (
          Kn.forEach(n => {
            const i = t.getValue(n);
            void 0 !== i && (e.push([n, i.get()]), i.set(n.startsWith('scale') ? 1 : 0));
          }),
          e
        );
      })(t);
      e.length && (n.set(t, e), t.render());
    }),
      t.forEach(t => t.measureInitialState()),
      e.forEach(t => {
        t.render();
        const e = n.get(t);
        e &&
          e.forEach(([e, n]) => {
            var i;
            null === (i = t.getValue(e)) || void 0 === i || i.set(n);
          });
      }),
      t.forEach(t => t.measureEndState()),
      t.forEach(t => {
        void 0 !== t.suspendedScrollY && window.scrollTo(0, t.suspendedScrollY);
      }));
  }
  ((Hn = !1), (Xn = !1), zn.forEach(t => t.complete()), zn.clear());
}
function Gn() {
  zn.forEach(t => {
    (t.readKeyframes(), t.needsMeasurement && (Hn = !0));
  });
}
class qn {
  constructor(t, e, n, i, s, o = !1) {
    ((this.isComplete = !1),
      (this.isAsync = !1),
      (this.needsMeasurement = !1),
      (this.isScheduled = !1),
      (this.unresolvedKeyframes = [...t]),
      (this.onComplete = e),
      (this.name = n),
      (this.motionValue = i),
      (this.element = s),
      (this.isAsync = o));
  }
  scheduleResolve() {
    ((this.isScheduled = !0),
      this.isAsync
        ? (zn.add(this), Xn || ((Xn = !0), A.read(Gn), A.resolveKeyframes(_n)))
        : (this.readKeyframes(), this.complete()));
  }
  readKeyframes() {
    const { unresolvedKeyframes: t, name: e, element: n, motionValue: i } = this;
    for (let s = 0; s < t.length; s++)
      if (null === t[s])
        if (0 === s) {
          const s = null == i ? void 0 : i.get(),
            o = t[t.length - 1];
          if (void 0 !== s) t[0] = s;
          else if (n && e) {
            const i = n.readValue(e, o);
            null != i && (t[0] = i);
          }
          (void 0 === t[0] && (t[0] = o), i && void 0 === s && i.set(t[0]));
        } else t[s] = t[s - 1];
  }
  setFinalKeyframe() {}
  measureInitialState() {}
  renderEndStyles() {}
  measureEndState() {}
  complete() {
    ((this.isComplete = !0),
      this.onComplete(this.unresolvedKeyframes, this.finalKeyframe),
      zn.delete(this));
  }
  cancel() {
    this.isComplete || ((this.isScheduled = !1), zn.delete(this));
  }
  resume() {
    this.isComplete || this.scheduleResolve();
  }
}
const Zn = t => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(t),
  Jn = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
function Qn(t, e, n = 1) {
  const [i, s] = (function (t) {
    const e = Jn.exec(t);
    if (!e) return [,];
    const [, n, i, s] = e;
    return [`--${null != n ? n : i}`, s];
  })(t);
  if (!i) return;
  const o = window.getComputedStyle(e).getPropertyValue(i);
  if (o) {
    const t = o.trim();
    return Zn(t) ? parseFloat(t) : t;
  }
  return yt(s) ? Qn(s, e, n + 1) : s;
}
const ti = t => e => e.test(t),
  ei = [wt, Ct, Vt, Et, Dt, Mt, { test: t => 'auto' === t, parse: t => t }],
  ni = t => ei.find(ti(t));
class ii extends qn {
  constructor(t, e, n, i, s) {
    super(t, e, n, i, s, !0);
  }
  readKeyframes() {
    const { unresolvedKeyframes: t, element: e, name: n } = this;
    if (!e || !e.current) return;
    super.readKeyframes();
    for (let a = 0; a < t.length; a++) {
      let n = t[a];
      if ('string' == typeof n && ((n = n.trim()), yt(n))) {
        const i = Qn(n, e.current);
        (void 0 !== i && (t[a] = i), a === t.length - 1 && (this.finalKeyframe = n));
      }
    }
    if ((this.resolveNoneKeyframes(), !Ue.has(n) || 2 !== t.length)) return;
    const [i, s] = t,
      o = ni(i),
      r = ni(s);
    if (o !== r)
      if (Un(o) && Un(r))
        for (let a = 0; a < t.length; a++) {
          const e = t[a];
          'string' == typeof e && (t[a] = parseFloat(e));
        }
      else this.needsMeasurement = !0;
  }
  resolveNoneKeyframes() {
    const { unresolvedKeyframes: t, name: e } = this,
      n = [];
    for (let i = 0; i < t.length; i++) hn(t[i]) && n.push(i);
    n.length &&
      (function (t, e, n) {
        let i,
          s = 0;
        for (; s < t.length && !i; ) {
          const e = t[s];
          ('string' == typeof e && !In.has(e) && En(e).values.length && (i = t[s]), s++);
        }
        if (i && n) for (const o of e) t[o] = On(n, i);
      })(t, n, e);
  }
  measureInitialState() {
    const { element: t, unresolvedKeyframes: e, name: n } = this;
    if (!t || !t.current) return;
    ('height' === n && (this.suspendedScrollY = window.pageYOffset),
      (this.measuredOrigin = Yn[n](t.measureViewportBox(), window.getComputedStyle(t.current))),
      (e[0] = this.measuredOrigin));
    const i = e[e.length - 1];
    void 0 !== i && t.getValue(n, i).jump(i, !1);
  }
  measureEndState() {
    var t;
    const { element: e, name: n, unresolvedKeyframes: i } = this;
    if (!e || !e.current) return;
    const s = e.getValue(n);
    s && s.jump(this.measuredOrigin, !1);
    const o = i.length - 1,
      r = i[o];
    ((i[o] = Yn[n](e.measureViewportBox(), window.getComputedStyle(e.current))),
      null !== r && void 0 === this.finalKeyframe && (this.finalKeyframe = r),
      (null === (t = this.removedTransforms) || void 0 === t ? void 0 : t.length) &&
        this.removedTransforms.forEach(([t, n]) => {
          e.getValue(t).set(n);
        }),
      this.resolveNoneKeyframes());
  }
}
const si = (t, e) =>
  'zIndex' !== e &&
  (!('number' != typeof t && !Array.isArray(t)) ||
    !('string' != typeof t || (!Dn.test(t) && '0' !== t) || t.startsWith('url(')));
const oi = t => null !== t;
function ri(t, { repeat: e, repeatType: n = 'loop' }, i) {
  const s = t.filter(oi),
    o = e && 'loop' !== n && e % 2 == 1 ? 0 : s.length - 1;
  return o && void 0 !== i ? i : s[o];
}
class ai {
  constructor({
    autoplay: t = !0,
    delay: e = 0,
    type: n = 'keyframes',
    repeat: i = 0,
    repeatDelay: s = 0,
    repeatType: o = 'loop',
    ...r
  }) {
    ((this.isStopped = !1),
      (this.hasAttemptedResolve = !1),
      (this.createdAt = $e.now()),
      (this.options = {
        autoplay: t,
        delay: e,
        type: n,
        repeat: i,
        repeatDelay: s,
        repeatType: o,
        ...r,
      }),
      this.updateFinishedPromise());
  }
  calcStartTime() {
    return this.resolvedAt && this.resolvedAt - this.createdAt > 40
      ? this.resolvedAt
      : this.createdAt;
  }
  get resolved() {
    return (this._resolved || this.hasAttemptedResolve || (Gn(), _n()), this._resolved);
  }
  onKeyframesResolved(t, e) {
    ((this.resolvedAt = $e.now()), (this.hasAttemptedResolve = !0));
    const {
      name: n,
      type: i,
      velocity: s,
      delay: o,
      onComplete: r,
      onUpdate: a,
      isGenerator: l,
    } = this.options;
    if (
      !l &&
      !(function (t, e, n, i) {
        const s = t[0];
        if (null === s) return !1;
        if ('display' === e || 'visibility' === e) return !0;
        const o = t[t.length - 1],
          r = si(s, e),
          a = si(o, e);
        return (
          !(!r || !a) &&
          ((function (t) {
            const e = t[0];
            if (1 === t.length) return !0;
            for (let n = 0; n < t.length; n++) if (t[n] !== e) return !0;
          })(t) ||
            (('spring' === n || ve(n)) && i))
        );
      })(t, n, i, s)
    ) {
      if (!o) return (a && a(ri(t, this.options, e)), r && r(), void this.resolveFinishedPromise());
      this.options.duration = 0;
    }
    const u = this.initPlayback(t, e);
    !1 !== u &&
      ((this._resolved = { keyframes: t, finalKeyframe: e, ...u }), this.onPostResolved());
  }
  onPostResolved() {}
  then(t, e) {
    return this.currentFinishedPromise.then(t, e);
  }
  flatten() {
    ((this.options.type = 'keyframes'), (this.options.ease = 'linear'));
  }
  updateFinishedPromise() {
    this.currentFinishedPromise = new Promise(t => {
      this.resolveFinishedPromise = t;
    });
  }
}
const li = (t, e, n) => t + (e - t) * n;
function ui(t, e, n) {
  return (
    n < 0 && (n += 1),
    n > 1 && (n -= 1),
    n < 1 / 6 ? t + 6 * (e - t) * n : n < 0.5 ? e : n < 2 / 3 ? t + (e - t) * (2 / 3 - n) * 6 : t
  );
}
function ci(t, e) {
  return n => (n > 0 ? e : t);
}
const hi = (t, e, n) => {
    const i = t * t,
      s = n * (e * e - i) + i;
    return s < 0 ? 0 : Math.sqrt(s);
  },
  di = [xn, yn, Pn];
function pi(t) {
  const e = ((n = t), di.find(t => t.test(n)));
  var n;
  if (!Boolean(e)) return !1;
  let i = e.parse(t);
  return (
    e === Pn &&
      (i = (function ({ hue: t, saturation: e, lightness: n, alpha: i }) {
        ((t /= 360), (n /= 100));
        let s = 0,
          o = 0,
          r = 0;
        if ((e /= 100)) {
          const i = n < 0.5 ? n * (1 + e) : n + e - n * e,
            a = 2 * n - i;
          ((s = ui(a, i, t + 1 / 3)), (o = ui(a, i, t)), (r = ui(a, i, t - 1 / 3)));
        } else s = o = r = n;
        return {
          red: Math.round(255 * s),
          green: Math.round(255 * o),
          blue: Math.round(255 * r),
          alpha: i,
        };
      })(i)),
    i
  );
}
const mi = (t, e) => {
    const n = pi(t),
      i = pi(e);
    if (!n || !i) return ci(t, e);
    const s = { ...n };
    return t => (
      (s.red = hi(n.red, i.red, t)),
      (s.green = hi(n.green, i.green, t)),
      (s.blue = hi(n.blue, i.blue, t)),
      (s.alpha = li(n.alpha, i.alpha, t)),
      yn.transform(s)
    );
  },
  fi = (t, e) => n => e(t(n)),
  vi = (...t) => t.reduce(fi),
  gi = new Set(['none', 'hidden']);
function yi(t, e) {
  return n => li(t, e, n);
}
function xi(t) {
  return 'number' == typeof t
    ? yi
    : 'string' == typeof t
      ? yt(t)
        ? ci
        : Tn.test(t)
          ? mi
          : wi
      : Array.isArray(t)
        ? Pi
        : 'object' == typeof t
          ? Tn.test(t)
            ? mi
            : Ti
          : ci;
}
function Pi(t, e) {
  const n = [...t],
    i = n.length,
    s = t.map((t, n) => xi(t)(t, e[n]));
  return t => {
    for (let e = 0; e < i; e++) n[e] = s[e](t);
    return n;
  };
}
function Ti(t, e) {
  const n = { ...t, ...e },
    i = {};
  for (const s in n) void 0 !== t[s] && void 0 !== e[s] && (i[s] = xi(t[s])(t[s], e[s]));
  return t => {
    for (const e in i) n[e] = i[e](t);
    return n;
  };
}
const wi = (t, e) => {
  const n = Dn.createTransformer(e),
    i = En(t),
    s = En(e);
  return i.indexes.var.length === s.indexes.var.length &&
    i.indexes.color.length === s.indexes.color.length &&
    i.indexes.number.length >= s.indexes.number.length
    ? (gi.has(t) && !s.values.length) || (gi.has(e) && !i.values.length)
      ? (function (t, e) {
          return gi.has(t) ? n => (n <= 0 ? t : e) : n => (n >= 1 ? e : t);
        })(t, e)
      : vi(
          Pi(
            (function (t, e) {
              var n;
              const i = [],
                s = { color: 0, var: 0, number: 0 };
              for (let o = 0; o < e.values.length; o++) {
                const r = e.types[o],
                  a = t.indexes[r][s[r]],
                  l = null !== (n = t.values[a]) && void 0 !== n ? n : 0;
                ((i[o] = l), s[r]++);
              }
              return i;
            })(i, s),
            s.values
          ),
          n
        )
    : ci(t, e);
};
function Si(t, e, n) {
  if ('number' == typeof t && 'number' == typeof e && 'number' == typeof n) return li(t, e, n);
  return xi(t)(t, e);
}
function bi(t, e, n) {
  const i = Math.max(e - 5, 0);
  return Xe(n - t(i), e - i);
}
const Ai = 100,
  Ei = 10,
  Vi = 1,
  Ci = 0,
  Mi = 800,
  Di = 0.3,
  Ri = 0.3,
  ki = { granular: 0.01, default: 2 },
  Li = { granular: 0.005, default: 0.5 },
  ji = 0.01,
  Fi = 10,
  Bi = 0.05,
  Oi = 1,
  Ii = 0.001;
function Ui({ duration: t = Mi, bounce: e = Di, velocity: n = Ci, mass: i = Vi }) {
  let s,
    o,
    r = 1 - e;
  ((r = Tt(Bi, Oi, r)),
    (t = Tt(ji, Fi, T(t))),
    r < 1
      ? ((s = e => {
          const i = e * r,
            s = i * t,
            o = i - n,
            a = Wi(e, r),
            l = Math.exp(-s);
          return Ii - (o / a) * l;
        }),
        (o = e => {
          const i = e * r * t,
            o = i * n + n,
            a = Math.pow(r, 2) * Math.pow(e, 2) * t,
            l = Math.exp(-i),
            u = Wi(Math.pow(e, 2), r);
          return ((-s(e) + Ii > 0 ? -1 : 1) * ((o - a) * l)) / u;
        }))
      : ((s = e => Math.exp(-e * t) * ((e - n) * t + 1) - 0.001),
        (o = e => Math.exp(-e * t) * (t * t * (n - e)))));
  const a = (function (t, e, n) {
    let i = n;
    for (let s = 1; s < Ni; s++) i -= t(i) / e(i);
    return i;
  })(s, o, 5 / t);
  if (((t = P(t)), isNaN(a))) return { stiffness: Ai, damping: Ei, duration: t };
  {
    const e = Math.pow(a, 2) * i;
    return { stiffness: e, damping: 2 * r * Math.sqrt(i * e), duration: t };
  }
}
const Ni = 12;
function Wi(t, e) {
  return t * Math.sqrt(1 - e * e);
}
const $i = ['duration', 'bounce'],
  Ki = ['stiffness', 'damping', 'mass'];
function Yi(t, e) {
  return e.some(e => void 0 !== t[e]);
}
function zi(t = Ri, e = Di) {
  const n = 'object' != typeof t ? { visualDuration: t, keyframes: [0, 1], bounce: e } : t;
  let { restSpeed: i, restDelta: s } = n;
  const o = n.keyframes[0],
    r = n.keyframes[n.keyframes.length - 1],
    a = { done: !1, value: o },
    {
      stiffness: l,
      damping: u,
      mass: c,
      duration: h,
      velocity: d,
      isResolvedFromDuration: p,
    } = (function (t) {
      let e = {
        velocity: Ci,
        stiffness: Ai,
        damping: Ei,
        mass: Vi,
        isResolvedFromDuration: !1,
        ...t,
      };
      if (!Yi(t, Ki) && Yi(t, $i))
        if (t.visualDuration) {
          const n = t.visualDuration,
            i = (2 * Math.PI) / (1.2 * n),
            s = i * i,
            o = 2 * Tt(0.05, 1, 1 - (t.bounce || 0)) * Math.sqrt(s);
          e = { ...e, mass: Vi, stiffness: s, damping: o };
        } else {
          const n = Ui(t);
          ((e = { ...e, ...n, mass: Vi }), (e.isResolvedFromDuration = !0));
        }
      return e;
    })({ ...n, velocity: -T(n.velocity || 0) }),
    m = d || 0,
    f = u / (2 * Math.sqrt(l * c)),
    v = r - o,
    g = T(Math.sqrt(l / c)),
    y = Math.abs(v) < 5;
  let x;
  if ((i || (i = y ? ki.granular : ki.default), s || (s = y ? Li.granular : Li.default), f < 1)) {
    const t = Wi(g, f);
    x = e => {
      const n = Math.exp(-f * g * e);
      return r - n * (((m + f * g * v) / t) * Math.sin(t * e) + v * Math.cos(t * e));
    };
  } else if (1 === f) x = t => r - Math.exp(-g * t) * (v + (m + g * v) * t);
  else {
    const t = g * Math.sqrt(f * f - 1);
    x = e => {
      const n = Math.exp(-f * g * e),
        i = Math.min(t * e, 300);
      return r - (n * ((m + f * g * v) * Math.sinh(i) + t * v * Math.cosh(i))) / t;
    };
  }
  const w = {
    calculatedDuration: (p && h) || null,
    next: t => {
      const e = x(t);
      if (p) a.done = t >= h;
      else {
        let n = 0;
        f < 1 && (n = 0 === t ? P(m) : bi(x, t, e));
        const o = Math.abs(n) <= i,
          l = Math.abs(r - e) <= s;
        a.done = o && l;
      }
      return ((a.value = a.done ? r : e), a);
    },
    toString: () => {
      const t = Math.min(fe(w), me),
        e = we(e => w.next(t * e).value, t, 30);
      return t + 'ms ' + e;
    },
  };
  return w;
}
function Xi({
  keyframes: t,
  velocity: e = 0,
  power: n = 0.8,
  timeConstant: i = 325,
  bounceDamping: s = 10,
  bounceStiffness: o = 500,
  modifyTarget: r,
  min: a,
  max: l,
  restDelta: u = 0.5,
  restSpeed: c,
}) {
  const h = t[0],
    d = { done: !1, value: h },
    p = t => (void 0 === a ? l : void 0 === l || Math.abs(a - t) < Math.abs(l - t) ? a : l);
  let m = n * e;
  const f = h + m,
    v = void 0 === r ? f : r(f);
  v !== f && (m = v - h);
  const g = t => -m * Math.exp(-t / i),
    y = t => v + g(t),
    x = t => {
      const e = g(t),
        n = y(t);
      ((d.done = Math.abs(e) <= u), (d.value = d.done ? v : n));
    };
  let P, T;
  const w = t => {
    var e;
    ((e = d.value), (void 0 !== a && e < a) || (void 0 !== l && e > l)) &&
      ((P = t),
      (T = zi({
        keyframes: [d.value, p(d.value)],
        velocity: bi(y, t, d.value),
        damping: s,
        stiffness: o,
        restDelta: u,
        restSpeed: c,
      })));
  };
  return (
    w(0),
    {
      calculatedDuration: null,
      next: t => {
        let e = !1;
        return (
          T || void 0 !== P || ((e = !0), x(t), w(t)),
          void 0 !== P && t >= P ? T.next(t - P) : (!e && x(t), d)
        );
      },
    }
  );
}
const Hi = Qe(0.42, 0, 1, 1),
  _i = Qe(0, 0, 0.58, 1),
  Gi = Qe(0.42, 0, 0.58, 1),
  qi = {
    linear: v,
    easeIn: Hi,
    easeInOut: Gi,
    easeOut: _i,
    circIn: an,
    circInOut: un,
    circOut: ln,
    backIn: sn,
    backInOut: on,
    backOut: nn,
    anticipate: rn,
  },
  Zi = t => {
    if (ye(t)) {
      g(4 === t.length);
      const [e, n, i, s] = t;
      return Qe(e, n, i, s);
    }
    return 'string' == typeof t ? qi[t] : t;
  };
function Ji(t, e, { clamp: n = !0, ease: i, mixer: s } = {}) {
  const o = t.length;
  if ((g(o === e.length), 1 === o)) return () => e[0];
  if (2 === o && e[0] === e[1]) return () => e[1];
  const r = t[0] === t[1];
  t[0] > t[o - 1] && ((t = [...t].reverse()), (e = [...e].reverse()));
  const a = (function (t, e, n) {
      const i = [],
        s = n || Si,
        o = t.length - 1;
      for (let r = 0; r < o; r++) {
        let n = s(t[r], t[r + 1]);
        if (e) {
          const t = Array.isArray(e) ? e[r] || v : e;
          n = vi(t, n);
        }
        i.push(n);
      }
      return i;
    })(e, i, s),
    l = a.length,
    u = n => {
      if (r && n < t[0]) return e[0];
      let i = 0;
      if (l > 1) for (; i < t.length - 2 && !(n < t[i + 1]); i++);
      const s = x(t[i], t[i + 1], n);
      return a[i](s);
    };
  return n ? e => u(Tt(t[0], t[o - 1], e)) : u;
}
function Qi(t) {
  const e = [0];
  return (
    (function (t, e) {
      const n = t[t.length - 1];
      for (let i = 1; i <= e; i++) {
        const s = x(0, e, i);
        t.push(li(n, 1, s));
      }
    })(e, t.length - 1),
    e
  );
}
function ts({ duration: t = 300, keyframes: e, times: n, ease: i = 'easeInOut' }) {
  const s = (t => Array.isArray(t) && 'number' != typeof t[0])(i) ? i.map(Zi) : Zi(i),
    o = { done: !1, value: e[0] },
    r = (function (t, e) {
      return t.map(t => t * e);
    })(n && n.length === e.length ? n : Qi(e), t),
    a = Ji(r, e, {
      ease: Array.isArray(s) ? s : ((l = e), (u = s), l.map(() => u || Gi).splice(0, l.length - 1)),
    });
  var l, u;
  return { calculatedDuration: t, next: e => ((o.value = a(e)), (o.done = e >= t), o) };
}
const es = t => {
    const e = ({ timestamp: e }) => t(e);
    return {
      start: () => A.update(e, !0),
      stop: () => E(e),
      now: () => (V.isProcessing ? V.timestamp : $e.now()),
    };
  },
  ns = { decay: Xi, inertia: Xi, tween: ts, keyframes: ts, spring: zi },
  is = t => t / 100;
class ss extends ai {
  constructor(t) {
    (super(t),
      (this.holdTime = null),
      (this.cancelTime = null),
      (this.currentTime = 0),
      (this.playbackSpeed = 1),
      (this.pendingPlayState = 'running'),
      (this.startTime = null),
      (this.state = 'idle'),
      (this.stop = () => {
        if ((this.resolver.cancel(), (this.isStopped = !0), 'idle' === this.state)) return;
        this.teardown();
        const { onStop: t } = this.options;
        t && t();
      }));
    const { name: e, motionValue: n, element: i, keyframes: s } = this.options,
      o = (null == i ? void 0 : i.KeyframeResolver) || qn;
    ((this.resolver = new o(s, (t, e) => this.onKeyframesResolved(t, e), e, n, i)),
      this.resolver.scheduleResolve());
  }
  flatten() {
    (super.flatten(),
      this._resolved && Object.assign(this._resolved, this.initPlayback(this._resolved.keyframes)));
  }
  initPlayback(t) {
    const {
        type: e = 'keyframes',
        repeat: n = 0,
        repeatDelay: i = 0,
        repeatType: s,
        velocity: o = 0,
      } = this.options,
      r = ve(e) ? e : ns[e] || ts;
    let a, l;
    r !== ts && 'number' != typeof t[0] && ((a = vi(is, Si(t[0], t[1]))), (t = [0, 100]));
    const u = r({ ...this.options, keyframes: t });
    ('mirror' === s && (l = r({ ...this.options, keyframes: [...t].reverse(), velocity: -o })),
      null === u.calculatedDuration && (u.calculatedDuration = fe(u)));
    const { calculatedDuration: c } = u,
      h = c + i;
    return {
      generator: u,
      mirroredGenerator: l,
      mapPercentToKeyframes: a,
      calculatedDuration: c,
      resolvedDuration: h,
      totalDuration: h * (n + 1) - i,
    };
  }
  onPostResolved() {
    const { autoplay: t = !0 } = this.options;
    (this.play(),
      'paused' !== this.pendingPlayState && t
        ? (this.state = this.pendingPlayState)
        : this.pause());
  }
  tick(t, e = !1) {
    const { resolved: n } = this;
    if (!n) {
      const { keyframes: t } = this.options;
      return { done: !0, value: t[t.length - 1] };
    }
    const {
      finalKeyframe: i,
      generator: s,
      mirroredGenerator: o,
      mapPercentToKeyframes: r,
      keyframes: a,
      calculatedDuration: l,
      totalDuration: u,
      resolvedDuration: c,
    } = n;
    if (null === this.startTime) return s.next(0);
    const { delay: h, repeat: d, repeatType: p, repeatDelay: m, onUpdate: f } = this.options;
    (this.speed > 0
      ? (this.startTime = Math.min(this.startTime, t))
      : this.speed < 0 && (this.startTime = Math.min(t - u / this.speed, this.startTime)),
      e
        ? (this.currentTime = t)
        : null !== this.holdTime
          ? (this.currentTime = this.holdTime)
          : (this.currentTime = Math.round(t - this.startTime) * this.speed));
    const v = this.currentTime - h * (this.speed >= 0 ? 1 : -1),
      g = this.speed >= 0 ? v < 0 : v > u;
    ((this.currentTime = Math.max(v, 0)),
      'finished' === this.state && null === this.holdTime && (this.currentTime = u));
    let y = this.currentTime,
      x = s;
    if (d) {
      const t = Math.min(this.currentTime, u) / c;
      let e = Math.floor(t),
        n = t % 1;
      (!n && t >= 1 && (n = 1), 1 === n && e--, (e = Math.min(e, d + 1)));
      (Boolean(e % 2) &&
        ('reverse' === p ? ((n = 1 - n), m && (n -= m / c)) : 'mirror' === p && (x = o)),
        (y = Tt(0, 1, n) * c));
    }
    const P = g ? { done: !1, value: a[0] } : x.next(y);
    r && (P.value = r(P.value));
    let { done: T } = P;
    g || null === l || (T = this.speed >= 0 ? this.currentTime >= u : this.currentTime <= 0);
    const w =
      null === this.holdTime && ('finished' === this.state || ('running' === this.state && T));
    return (
      w && void 0 !== i && (P.value = ri(a, this.options, i)),
      f && f(P.value),
      w && this.finish(),
      P
    );
  }
  get duration() {
    const { resolved: t } = this;
    return t ? T(t.calculatedDuration) : 0;
  }
  get time() {
    return T(this.currentTime);
  }
  set time(t) {
    ((t = P(t)),
      (this.currentTime = t),
      null !== this.holdTime || 0 === this.speed
        ? (this.holdTime = t)
        : this.driver && (this.startTime = this.driver.now() - t / this.speed));
  }
  get speed() {
    return this.playbackSpeed;
  }
  set speed(t) {
    const e = this.playbackSpeed !== t;
    ((this.playbackSpeed = t), e && (this.time = T(this.currentTime)));
  }
  play() {
    if ((this.resolver.isScheduled || this.resolver.resume(), !this._resolved))
      return void (this.pendingPlayState = 'running');
    if (this.isStopped) return;
    const { driver: t = es, onPlay: e, startTime: n } = this.options;
    (this.driver || (this.driver = t(t => this.tick(t))), e && e());
    const i = this.driver.now();
    (null !== this.holdTime
      ? (this.startTime = i - this.holdTime)
      : this.startTime
        ? 'finished' === this.state && (this.startTime = i)
        : (this.startTime = null != n ? n : this.calcStartTime()),
      'finished' === this.state && this.updateFinishedPromise(),
      (this.cancelTime = this.startTime),
      (this.holdTime = null),
      (this.state = 'running'),
      this.driver.start());
  }
  pause() {
    var t;
    this._resolved
      ? ((this.state = 'paused'),
        (this.holdTime = null !== (t = this.currentTime) && void 0 !== t ? t : 0))
      : (this.pendingPlayState = 'paused');
  }
  complete() {
    ('running' !== this.state && this.play(),
      (this.pendingPlayState = this.state = 'finished'),
      (this.holdTime = null));
  }
  finish() {
    (this.teardown(), (this.state = 'finished'));
    const { onComplete: t } = this.options;
    t && t();
  }
  cancel() {
    (null !== this.cancelTime && this.tick(this.cancelTime),
      this.teardown(),
      this.updateFinishedPromise());
  }
  teardown() {
    ((this.state = 'idle'),
      this.stopDriver(),
      this.resolveFinishedPromise(),
      this.updateFinishedPromise(),
      (this.startTime = this.cancelTime = null),
      this.resolver.cancel());
  }
  stopDriver() {
    this.driver && (this.driver.stop(), (this.driver = void 0));
  }
  sample(t) {
    return ((this.startTime = 0), this.tick(t, !0));
  }
}
const os = new Set(['opacity', 'clipPath', 'filter', 'transform']);
function rs(
  t,
  e,
  n,
  {
    delay: i = 0,
    duration: s = 300,
    repeat: o = 0,
    repeatType: r = 'loop',
    ease: a = 'easeInOut',
    times: l,
  } = {}
) {
  const u = { [e]: n };
  l && (u.offset = l);
  const c = Ee(a, s);
  return (
    Array.isArray(c) && (u.easing = c),
    t.animate(u, {
      delay: i,
      duration: s,
      easing: Array.isArray(c) ? 'linear' : c,
      fill: 'both',
      iterations: o + 1,
      direction: 'reverse' === r ? 'alternate' : 'normal',
    })
  );
}
const as = y(() => Object.hasOwnProperty.call(Element.prototype, 'animate'));
const ls = { anticipate: rn, backInOut: on, circInOut: un };
class us extends ai {
  constructor(t) {
    super(t);
    const { name: e, motionValue: n, element: i, keyframes: s } = this.options;
    ((this.resolver = new ii(s, (t, e) => this.onKeyframesResolved(t, e), e, n, i)),
      this.resolver.scheduleResolve());
  }
  initPlayback(t, e) {
    let {
      duration: n = 300,
      times: i,
      ease: s,
      type: o,
      motionValue: r,
      name: a,
      startTime: l,
    } = this.options;
    if (!r.owner || !r.owner.current) return !1;
    var u;
    if (
      ('string' == typeof s && Te() && s in ls && (s = ls[s]),
      ve((u = this.options).type) || 'spring' === u.type || !Se(u.ease))
    ) {
      const { onComplete: e, onUpdate: r, motionValue: a, element: l, ...u } = this.options,
        c = (function (t, e) {
          const n = new ss({ ...e, keyframes: t, repeat: 0, delay: 0, isGenerator: !0 });
          let i = { done: !1, value: t[0] };
          const s = [];
          let o = 0;
          for (; !i.done && o < 2e4; ) ((i = n.sample(o)), s.push(i.value), (o += 10));
          return { times: void 0, keyframes: s, duration: o - 10, ease: 'linear' };
        })(t, u);
      (1 === (t = c.keyframes).length && (t[1] = t[0]),
        (n = c.duration),
        (i = c.times),
        (s = c.ease),
        (o = 'keyframes'));
    }
    const c = rs(r.owner.current, a, t, { ...this.options, duration: n, times: i, ease: s });
    return (
      (c.startTime = null != l ? l : this.calcStartTime()),
      this.pendingTimeline
        ? (ge(c, this.pendingTimeline), (this.pendingTimeline = void 0))
        : (c.onfinish = () => {
            const { onComplete: n } = this.options;
            (r.set(ri(t, this.options, e)), n && n(), this.cancel(), this.resolveFinishedPromise());
          }),
      { animation: c, duration: n, times: i, type: o, ease: s, keyframes: t }
    );
  }
  get duration() {
    const { resolved: t } = this;
    if (!t) return 0;
    const { duration: e } = t;
    return T(e);
  }
  get time() {
    const { resolved: t } = this;
    if (!t) return 0;
    const { animation: e } = t;
    return T(e.currentTime || 0);
  }
  set time(t) {
    const { resolved: e } = this;
    if (!e) return;
    const { animation: n } = e;
    n.currentTime = P(t);
  }
  get speed() {
    const { resolved: t } = this;
    if (!t) return 1;
    const { animation: e } = t;
    return e.playbackRate;
  }
  set speed(t) {
    const { resolved: e } = this;
    if (!e) return;
    const { animation: n } = e;
    n.playbackRate = t;
  }
  get state() {
    const { resolved: t } = this;
    if (!t) return 'idle';
    const { animation: e } = t;
    return e.playState;
  }
  get startTime() {
    const { resolved: t } = this;
    if (!t) return null;
    const { animation: e } = t;
    return e.startTime;
  }
  attachTimeline(t) {
    if (this._resolved) {
      const { resolved: e } = this;
      if (!e) return v;
      const { animation: n } = e;
      ge(n, t);
    } else this.pendingTimeline = t;
    return v;
  }
  play() {
    if (this.isStopped) return;
    const { resolved: t } = this;
    if (!t) return;
    const { animation: e } = t;
    ('finished' === e.playState && this.updateFinishedPromise(), e.play());
  }
  pause() {
    const { resolved: t } = this;
    if (!t) return;
    const { animation: e } = t;
    e.pause();
  }
  stop() {
    if ((this.resolver.cancel(), (this.isStopped = !0), 'idle' === this.state)) return;
    (this.resolveFinishedPromise(), this.updateFinishedPromise());
    const { resolved: t } = this;
    if (!t) return;
    const { animation: e, keyframes: n, duration: i, type: s, ease: o, times: r } = t;
    if ('idle' === e.playState || 'finished' === e.playState) return;
    if (this.time) {
      const { motionValue: t, onUpdate: e, onComplete: a, element: l, ...u } = this.options,
        c = new ss({
          ...u,
          keyframes: n,
          duration: i,
          type: s,
          ease: o,
          times: r,
          isGenerator: !0,
        }),
        h = P(this.time);
      t.setWithVelocity(c.sample(h - 10).value, c.sample(h).value, 10);
    }
    const { onStop: a } = this.options;
    (a && a(), this.cancel());
  }
  complete() {
    const { resolved: t } = this;
    t && t.animation.finish();
  }
  cancel() {
    const { resolved: t } = this;
    t && t.animation.cancel();
  }
  static supports(t) {
    const { motionValue: e, name: n, repeatDelay: i, repeatType: s, damping: o, type: r } = t;
    if (!(e && e.owner && e.owner.current instanceof HTMLElement)) return !1;
    const { onUpdate: a, transformTemplate: l } = e.owner.getProps();
    return as() && n && os.has(n) && !a && !l && !i && 'mirror' !== s && 0 !== o && 'inertia' !== r;
  }
}
const cs = { type: 'spring', stiffness: 500, damping: 25, restSpeed: 10 },
  hs = { type: 'keyframes', duration: 0.8 },
  ds = { type: 'keyframes', ease: [0.25, 0.1, 0.35, 1], duration: 0.3 },
  ps = (t, { keyframes: e }) =>
    e.length > 2
      ? hs
      : mt.has(t)
        ? t.startsWith('scale')
          ? {
              type: 'spring',
              stiffness: 550,
              damping: 0 === e[1] ? 2 * Math.sqrt(550) : 30,
              restSpeed: 10,
            }
          : cs
        : ds;
const ms =
  (t, e, n, i = {}, s, o) =>
  r => {
    const a = pe(i, t) || {},
      l = a.delay || i.delay || 0;
    let { elapsed: u = 0 } = i;
    u -= P(l);
    let c = {
      keyframes: Array.isArray(n) ? n : [null, n],
      ease: 'easeOut',
      velocity: e.getVelocity(),
      ...a,
      delay: -u,
      onUpdate: t => {
        (e.set(t), a.onUpdate && a.onUpdate(t));
      },
      onComplete: () => {
        (r(), a.onComplete && a.onComplete());
      },
      name: t,
      motionValue: e,
      element: o ? void 0 : s,
    };
    ((function ({
      when: t,
      delay: e,
      delayChildren: n,
      staggerChildren: i,
      staggerDirection: s,
      repeat: o,
      repeatType: r,
      repeatDelay: a,
      from: l,
      elapsed: u,
      ...c
    }) {
      return !!Object.keys(c).length;
    })(a) || (c = { ...c, ...ps(t, c) }),
      c.duration && (c.duration = P(c.duration)),
      c.repeatDelay && (c.repeatDelay = P(c.repeatDelay)),
      void 0 !== c.from && (c.keyframes[0] = c.from));
    let h = !1;
    if (
      ((!1 === c.type || (0 === c.duration && !c.repeatDelay)) &&
        ((c.duration = 0), 0 === c.delay && (h = !0)),
      h && !o && void 0 !== e.get())
    ) {
      const t = ri(c.keyframes, a);
      if (void 0 !== t)
        return (
          A.update(() => {
            (c.onUpdate(t), c.onComplete());
          }),
          new de([])
        );
    }
    return !o && us.supports(c) ? new us(c) : new ss(c);
  };
function fs({ protectedKeys: t, needsAnimating: e }, n) {
  const i = t.hasOwnProperty(n) && !0 !== e[n];
  return ((e[n] = !1), i);
}
function vs(t, e, { delay: n = 0, transitionOverride: i, type: s } = {}) {
  var o;
  let { transition: r = t.getDefaultTransition(), transitionEnd: a, ...l } = e;
  i && (r = i);
  const u = [],
    c = s && t.animationState && t.animationState.getState()[s];
  for (const h in l) {
    const e = t.getValue(h, null !== (o = t.latestValues[h]) && void 0 !== o ? o : null),
      i = l[h];
    if (void 0 === i || (c && fs(c, h))) continue;
    const s = { delay: n, ...pe(r || {}, h) };
    let a = !1;
    if (window.MotionHandoffAnimation) {
      const e = Ze(t);
      if (e) {
        const t = window.MotionHandoffAnimation(e, h, A);
        null !== t && ((s.startTime = t), (a = !0));
      }
    }
    (qe(t, h), e.start(ms(h, e, i, t.shouldReduceMotion && Ue.has(h) ? { type: !1 } : s, t, a)));
    const d = e.animation;
    d && u.push(d);
  }
  return (
    a &&
      Promise.all(u).then(() => {
        A.update(() => {
          a &&
            (function (t, e) {
              const n = ue(t, e);
              let { transitionEnd: i = {}, transition: s = {}, ...o } = n || {};
              o = { ...o, ...i };
              for (const r in o) Ge(t, r, lt(o[r]));
            })(t, a);
        });
      }),
    u
  );
}
function gs(t, e, n = {}) {
  var i;
  const s = ue(
    t,
    e,
    'exit' === n.type
      ? null === (i = t.presenceContext) || void 0 === i
        ? void 0
        : i.custom
      : void 0
  );
  let { transition: o = t.getDefaultTransition() || {} } = s || {};
  n.transitionOverride && (o = n.transitionOverride);
  const r = s ? () => Promise.all(vs(t, s, n)) : () => Promise.resolve(),
    a =
      t.variantChildren && t.variantChildren.size
        ? (i = 0) => {
            const { delayChildren: s = 0, staggerChildren: r, staggerDirection: a } = o;
            return (function (t, e, n = 0, i = 0, s = 1, o) {
              const r = [],
                a = (t.variantChildren.size - 1) * i,
                l = 1 === s ? (t = 0) => t * i : (t = 0) => a - t * i;
              return (
                Array.from(t.variantChildren)
                  .sort(ys)
                  .forEach((t, i) => {
                    (t.notify('AnimationStart', e),
                      r.push(
                        gs(t, e, { ...o, delay: n + l(i) }).then(() =>
                          t.notify('AnimationComplete', e)
                        )
                      ));
                  }),
                Promise.all(r)
              );
            })(t, e, s + i, r, a, n);
          }
        : () => Promise.resolve(),
    { when: l } = o;
  if (l) {
    const [t, e] = 'beforeChildren' === l ? [r, a] : [a, r];
    return t().then(() => e());
  }
  return Promise.all([r(), a(n.delay)]);
}
function ys(t, e) {
  return t.sortNodePosition(e);
}
const xs = W.length;
function Ps(t) {
  if (!t) return;
  if (!t.isControllingVariants) {
    const e = (t.parent && Ps(t.parent)) || {};
    return (void 0 !== t.props.initial && (e.initial = t.props.initial), e);
  }
  const e = {};
  for (let n = 0; n < xs; n++) {
    const i = W[n],
      s = t.props[i];
    (I(s) || !1 === s) && (e[i] = s);
  }
  return e;
}
const Ts = [...N].reverse(),
  ws = N.length;
function Ss(t) {
  return e =>
    Promise.all(
      e.map(({ animation: e, options: n }) =>
        (function (t, e, n = {}) {
          let i;
          if ((t.notify('AnimationStart', e), Array.isArray(e))) {
            const s = e.map(e => gs(t, e, n));
            i = Promise.all(s);
          } else if ('string' == typeof e) i = gs(t, e, n);
          else {
            const s = 'function' == typeof e ? ue(t, e, n.custom) : e;
            i = Promise.all(vs(t, s, n));
          }
          return i.then(() => {
            t.notify('AnimationComplete', e);
          });
        })(t, e, n)
      )
    );
}
function bs(t) {
  let e = Ss(t),
    n = Vs(),
    i = !0;
  const s = e => (n, i) => {
    var s;
    const o = ue(
      t,
      i,
      'exit' === e ? (null === (s = t.presenceContext) || void 0 === s ? void 0 : s.custom) : void 0
    );
    if (o) {
      const { transition: t, transitionEnd: e, ...i } = o;
      n = { ...n, ...i, ...e };
    }
    return n;
  };
  function o(o) {
    const { props: r } = t,
      a = Ps(t.parent) || {},
      l = [],
      u = new Set();
    let c = {},
      h = 1 / 0;
    for (let e = 0; e < ws; e++) {
      const d = Ts[e],
        p = n[d],
        m = void 0 !== r[d] ? r[d] : a[d],
        f = I(m),
        v = d === o ? p.isActive : null;
      !1 === v && (h = e);
      let g = m === a[d] && m !== r[d] && f;
      if (
        (g && i && t.manuallyAnimateOnMount && (g = !1),
        (p.protectedKeys = { ...c }),
        (!p.isActive && null === v) || (!m && !p.prevProp) || U(m) || 'boolean' == typeof m)
      )
        continue;
      const y = As(p.prevProp, m);
      let x = y || (d === o && p.isActive && !g && f) || (e > h && f),
        P = !1;
      const T = Array.isArray(m) ? m : [m];
      let w = T.reduce(s(d), {});
      !1 === v && (w = {});
      const { prevResolvedValues: S = {} } = p,
        b = { ...S, ...w },
        A = e => {
          ((x = !0), u.has(e) && ((P = !0), u.delete(e)), (p.needsAnimating[e] = !0));
          const n = t.getValue(e);
          n && (n.liveStyle = !1);
        };
      for (const t in b) {
        const e = w[t],
          n = S[t];
        if (c.hasOwnProperty(t)) continue;
        let i = !1;
        ((i = at(e) && at(n) ? !le(e, n) : e !== n),
          i
            ? null != e
              ? A(t)
              : u.add(t)
            : void 0 !== e && u.has(t)
              ? A(t)
              : (p.protectedKeys[t] = !0));
      }
      ((p.prevProp = m),
        (p.prevResolvedValues = w),
        p.isActive && (c = { ...c, ...w }),
        i && t.blockInitialAnimation && (x = !1));
      x && (!(g && y) || P) && l.push(...T.map(t => ({ animation: t, options: { type: d } })));
    }
    if (u.size) {
      const e = {};
      (u.forEach(n => {
        const i = t.getBaseTarget(n),
          s = t.getValue(n);
        (s && (s.liveStyle = !0), (e[n] = null != i ? i : null));
      }),
        l.push({ animation: e }));
    }
    let d = Boolean(l.length);
    return (
      !i || (!1 !== r.initial && r.initial !== r.animate) || t.manuallyAnimateOnMount || (d = !1),
      (i = !1),
      d ? e(l) : Promise.resolve()
    );
  }
  return {
    animateChanges: o,
    setActive: function (e, i) {
      var s;
      if (n[e].isActive === i) return Promise.resolve();
      (null === (s = t.variantChildren) ||
        void 0 === s ||
        s.forEach(t => {
          var n;
          return null === (n = t.animationState) || void 0 === n ? void 0 : n.setActive(e, i);
        }),
        (n[e].isActive = i));
      const r = o(e);
      for (const t in n) n[t].protectedKeys = {};
      return r;
    },
    setAnimateFunction: function (n) {
      e = n(t);
    },
    getState: () => n,
    reset: () => {
      ((n = Vs()), (i = !0));
    },
  };
}
function As(t, e) {
  return 'string' == typeof e ? e !== t : !!Array.isArray(e) && !le(e, t);
}
function Es(t = !1) {
  return { isActive: t, protectedKeys: {}, needsAnimating: {}, prevResolvedValues: {} };
}
function Vs() {
  return {
    animate: Es(!0),
    whileInView: Es(),
    whileHover: Es(),
    whileTap: Es(),
    whileDrag: Es(),
    whileFocus: Es(),
    exit: Es(),
  };
}
class Cs {
  constructor(t) {
    ((this.isMounted = !1), (this.node = t));
  }
  update() {}
}
let Ms = 0;
const Ds = {
  animation: {
    Feature: class extends Cs {
      constructor(t) {
        (super(t), t.animationState || (t.animationState = bs(t)));
      }
      updateAnimationControlsSubscription() {
        const { animate: t } = this.node.getProps();
        U(t) && (this.unmountControls = t.subscribe(this.node));
      }
      mount() {
        this.updateAnimationControlsSubscription();
      }
      update() {
        const { animate: t } = this.node.getProps(),
          { animate: e } = this.node.prevProps || {};
        t !== e && this.updateAnimationControlsSubscription();
      }
      unmount() {
        var t;
        (this.node.animationState.reset(),
          null === (t = this.unmountControls) || void 0 === t || t.call(this));
      }
    },
  },
  exit: {
    Feature: class extends Cs {
      constructor() {
        (super(...arguments), (this.id = Ms++));
      }
      update() {
        if (!this.node.presenceContext) return;
        const { isPresent: t, onExitComplete: e } = this.node.presenceContext,
          { isPresent: n } = this.node.prevPresenceContext || {};
        if (!this.node.animationState || t === n) return;
        const i = this.node.animationState.setActive('exit', !t);
        e && !t && i.then(() => e(this.id));
      }
      mount() {
        const { register: t } = this.node.presenceContext || {};
        t && (this.unmount = t(this.id));
      }
      unmount() {}
    },
  },
};
function Rs(t, e, n, i = { passive: !0 }) {
  return (t.addEventListener(e, n, i), () => t.removeEventListener(e, n));
}
function ks(t) {
  return { point: { x: t.pageX, y: t.pageY } };
}
function Ls(t, e, n, i) {
  return Rs(
    t,
    e,
    (
      t => e =>
        ke(e) && t(e, ks(e))
    )(n),
    i
  );
}
const js = (t, e) => Math.abs(t - e);
class Fs {
  constructor(t, e, { transformPagePoint: n, contextWindow: i, dragSnapToOrigin: s = !1 } = {}) {
    if (
      ((this.startEvent = null),
      (this.lastMoveEvent = null),
      (this.lastMoveEventInfo = null),
      (this.handlers = {}),
      (this.contextWindow = window),
      (this.updatePoint = () => {
        if (!this.lastMoveEvent || !this.lastMoveEventInfo) return;
        const t = Is(this.lastMoveEventInfo, this.history),
          e = null !== this.startEvent,
          n =
            (function (t, e) {
              const n = js(t.x, e.x),
                i = js(t.y, e.y);
              return Math.sqrt(n ** 2 + i ** 2);
            })(t.offset, { x: 0, y: 0 }) >= 3;
        if (!e && !n) return;
        const { point: i } = t,
          { timestamp: s } = V;
        this.history.push({ ...i, timestamp: s });
        const { onStart: o, onMove: r } = this.handlers;
        (e || (o && o(this.lastMoveEvent, t), (this.startEvent = this.lastMoveEvent)),
          r && r(this.lastMoveEvent, t));
      }),
      (this.handlePointerMove = (t, e) => {
        ((this.lastMoveEvent = t),
          (this.lastMoveEventInfo = Bs(e, this.transformPagePoint)),
          A.update(this.updatePoint, !0));
      }),
      (this.handlePointerUp = (t, e) => {
        this.end();
        const { onEnd: n, onSessionEnd: i, resumeAnimation: s } = this.handlers;
        if ((this.dragSnapToOrigin && s && s(), !this.lastMoveEvent || !this.lastMoveEventInfo))
          return;
        const o = Is(
          'pointercancel' === t.type ? this.lastMoveEventInfo : Bs(e, this.transformPagePoint),
          this.history
        );
        (this.startEvent && n && n(t, o), i && i(t, o));
      }),
      !ke(t))
    )
      return;
    ((this.dragSnapToOrigin = s),
      (this.handlers = e),
      (this.transformPagePoint = n),
      (this.contextWindow = i || window));
    const o = Bs(ks(t), this.transformPagePoint),
      { point: r } = o,
      { timestamp: a } = V;
    this.history = [{ ...r, timestamp: a }];
    const { onSessionStart: l } = e;
    (l && l(t, Is(o, this.history)),
      (this.removeListeners = vi(
        Ls(this.contextWindow, 'pointermove', this.handlePointerMove),
        Ls(this.contextWindow, 'pointerup', this.handlePointerUp),
        Ls(this.contextWindow, 'pointercancel', this.handlePointerUp)
      )));
  }
  updateHandlers(t) {
    this.handlers = t;
  }
  end() {
    (this.removeListeners && this.removeListeners(), E(this.updatePoint));
  }
}
function Bs(t, e) {
  return e ? { point: e(t.point) } : t;
}
function Os(t, e) {
  return { x: t.x - e.x, y: t.y - e.y };
}
function Is({ point: t }, e) {
  return { point: t, delta: Os(t, Ns(e)), offset: Os(t, Us(e)), velocity: Ws(e, 0.1) };
}
function Us(t) {
  return t[0];
}
function Ns(t) {
  return t[t.length - 1];
}
function Ws(t, e) {
  if (t.length < 2) return { x: 0, y: 0 };
  let n = t.length - 1,
    i = null;
  const s = Ns(t);
  for (; n >= 0 && ((i = t[n]), !(s.timestamp - i.timestamp > P(e))); ) n--;
  if (!i) return { x: 0, y: 0 };
  const o = T(s.timestamp - i.timestamp);
  if (0 === o) return { x: 0, y: 0 };
  const r = { x: (s.x - i.x) / o, y: (s.y - i.y) / o };
  return (r.x === 1 / 0 && (r.x = 0), r.y === 1 / 0 && (r.y = 0), r);
}
function $s(t) {
  return t.max - t.min;
}
function Ks(t, e, n, i = 0.5) {
  ((t.origin = i),
    (t.originPoint = li(e.min, e.max, t.origin)),
    (t.scale = $s(n) / $s(e)),
    (t.translate = li(n.min, n.max, t.origin) - t.originPoint),
    ((t.scale >= 0.9999 && t.scale <= 1.0001) || isNaN(t.scale)) && (t.scale = 1),
    ((t.translate >= -0.01 && t.translate <= 0.01) || isNaN(t.translate)) && (t.translate = 0));
}
function Ys(t, e, n, i) {
  (Ks(t.x, e.x, n.x, i ? i.originX : void 0), Ks(t.y, e.y, n.y, i ? i.originY : void 0));
}
function zs(t, e, n) {
  ((t.min = n.min + e.min), (t.max = t.min + $s(e)));
}
function Xs(t, e, n) {
  ((t.min = e.min - n.min), (t.max = t.min + $s(e)));
}
function Hs(t, e, n) {
  (Xs(t.x, e.x, n.x), Xs(t.y, e.y, n.y));
}
function _s(t, e, n) {
  return {
    min: void 0 !== e ? t.min + e : void 0,
    max: void 0 !== n ? t.max + n - (t.max - t.min) : void 0,
  };
}
function Gs(t, e) {
  let n = e.min - t.min,
    i = e.max - t.max;
  return (e.max - e.min < t.max - t.min && ([n, i] = [i, n]), { min: n, max: i });
}
const qs = 0.35;
function Zs(t, e, n) {
  return { min: Js(t, e), max: Js(t, n) };
}
function Js(t, e) {
  return 'number' == typeof t ? t : t[e] || 0;
}
const Qs = () => ({ x: { min: 0, max: 0 }, y: { min: 0, max: 0 } });
function to(t) {
  return [t('x'), t('y')];
}
function eo({ top: t, left: e, right: n, bottom: i }) {
  return { x: { min: e, max: n }, y: { min: t, max: i } };
}
function no(t) {
  return void 0 === t || 1 === t;
}
function io({ scale: t, scaleX: e, scaleY: n }) {
  return !no(t) || !no(e) || !no(n);
}
function so(t) {
  return io(t) || oo(t) || t.z || t.rotate || t.rotateX || t.rotateY || t.skewX || t.skewY;
}
function oo(t) {
  return ro(t.x) || ro(t.y);
}
function ro(t) {
  return t && '0%' !== t;
}
function ao(t, e, n) {
  return n + e * (t - n);
}
function lo(t, e, n, i, s) {
  return (void 0 !== s && (t = ao(t, s, i)), ao(t, n, i) + e);
}
function uo(t, e = 0, n = 1, i, s) {
  ((t.min = lo(t.min, e, n, i, s)), (t.max = lo(t.max, e, n, i, s)));
}
function co(t, { x: e, y: n }) {
  (uo(t.x, e.translate, e.scale, e.originPoint), uo(t.y, n.translate, n.scale, n.originPoint));
}
const ho = 0.999999999999,
  po = 1.0000000000001;
function mo(t, e) {
  ((t.min = t.min + e), (t.max = t.max + e));
}
function fo(t, e, n, i, s = 0.5) {
  uo(t, e, n, li(t.min, t.max, s), i);
}
function vo(t, e) {
  (fo(t.x, e.x, e.scaleX, e.scale, e.originX), fo(t.y, e.y, e.scaleY, e.scale, e.originY));
}
function go(t, e) {
  return eo(
    (function (t, e) {
      if (!e) return t;
      const n = e({ x: t.left, y: t.top }),
        i = e({ x: t.right, y: t.bottom });
      return { top: n.y, left: n.x, bottom: i.y, right: i.x };
    })(t.getBoundingClientRect(), e)
  );
}
const yo = ({ current: t }) => (t ? t.ownerDocument.defaultView : null),
  xo = new WeakMap();
class Po {
  constructor(t) {
    ((this.openDragLock = null),
      (this.isDragging = !1),
      (this.currentDirection = null),
      (this.originPoint = { x: 0, y: 0 }),
      (this.constraints = !1),
      (this.hasMutatedConstraints = !1),
      (this.elastic = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }),
      (this.visualElement = t));
  }
  start(t, { snapToCursor: e = !1 } = {}) {
    const { presenceContext: n } = this.visualElement;
    if (n && !1 === n.isPresent) return;
    const { dragSnapToOrigin: i } = this.getProps();
    this.panSession = new Fs(
      t,
      {
        onSessionStart: t => {
          const { dragSnapToOrigin: n } = this.getProps();
          (n ? this.pauseAnimation() : this.stopAnimation(), e && this.snapToCursor(ks(t).point));
        },
        onStart: (t, e) => {
          const { drag: n, dragPropagation: i, onDragStart: s } = this.getProps();
          if (
            n &&
            !i &&
            (this.openDragLock && this.openDragLock(),
            (this.openDragLock =
              'x' === (o = n) || 'y' === o
                ? Ve[o]
                  ? null
                  : ((Ve[o] = !0),
                    () => {
                      Ve[o] = !1;
                    })
                : Ve.x || Ve.y
                  ? null
                  : ((Ve.x = Ve.y = !0),
                    () => {
                      Ve.x = Ve.y = !1;
                    })),
            !this.openDragLock)
          )
            return;
          var o;
          ((this.isDragging = !0),
            (this.currentDirection = null),
            this.resolveConstraints(),
            this.visualElement.projection &&
              ((this.visualElement.projection.isAnimationBlocked = !0),
              (this.visualElement.projection.target = void 0)),
            to(t => {
              let e = this.getAxisMotionValue(t).get() || 0;
              if (Vt.test(e)) {
                const { projection: n } = this.visualElement;
                if (n && n.layout) {
                  const i = n.layout.layoutBox[t];
                  if (i) {
                    e = $s(i) * (parseFloat(e) / 100);
                  }
                }
              }
              this.originPoint[t] = e;
            }),
            s && A.postRender(() => s(t, e)),
            qe(this.visualElement, 'transform'));
          const { animationState: r } = this.visualElement;
          r && r.setActive('whileDrag', !0);
        },
        onMove: (t, e) => {
          const {
            dragPropagation: n,
            dragDirectionLock: i,
            onDirectionLock: s,
            onDrag: o,
          } = this.getProps();
          if (!n && !this.openDragLock) return;
          const { offset: r } = e;
          if (i && null === this.currentDirection)
            return (
              (this.currentDirection = (function (t, e = 10) {
                let n = null;
                Math.abs(t.y) > e ? (n = 'y') : Math.abs(t.x) > e && (n = 'x');
                return n;
              })(r)),
              void (null !== this.currentDirection && s && s(this.currentDirection))
            );
          (this.updateAxis('x', e.point, r),
            this.updateAxis('y', e.point, r),
            this.visualElement.render(),
            o && o(t, e));
        },
        onSessionEnd: (t, e) => this.stop(t, e),
        resumeAnimation: () =>
          to(t => {
            var e;
            return (
              'paused' === this.getAnimationState(t) &&
              (null === (e = this.getAxisMotionValue(t).animation) || void 0 === e
                ? void 0
                : e.play())
            );
          }),
      },
      {
        transformPagePoint: this.visualElement.getTransformPagePoint(),
        dragSnapToOrigin: i,
        contextWindow: yo(this.visualElement),
      }
    );
  }
  stop(t, e) {
    const n = this.isDragging;
    if ((this.cancel(), !n)) return;
    const { velocity: i } = e;
    this.startAnimation(i);
    const { onDragEnd: s } = this.getProps();
    s && A.postRender(() => s(t, e));
  }
  cancel() {
    this.isDragging = !1;
    const { projection: t, animationState: e } = this.visualElement;
    (t && (t.isAnimationBlocked = !1),
      this.panSession && this.panSession.end(),
      (this.panSession = void 0));
    const { dragPropagation: n } = this.getProps();
    (!n && this.openDragLock && (this.openDragLock(), (this.openDragLock = null)),
      e && e.setActive('whileDrag', !1));
  }
  updateAxis(t, e, n) {
    const { drag: i } = this.getProps();
    if (!n || !To(t, i, this.currentDirection)) return;
    const s = this.getAxisMotionValue(t);
    let o = this.originPoint[t] + n[t];
    (this.constraints &&
      this.constraints[t] &&
      (o = (function (t, { min: e, max: n }, i) {
        return (
          void 0 !== e && t < e
            ? (t = i ? li(e, t, i.min) : Math.max(t, e))
            : void 0 !== n && t > n && (t = i ? li(n, t, i.max) : Math.min(t, n)),
          t
        );
      })(o, this.constraints[t], this.elastic[t])),
      s.set(o));
  }
  resolveConstraints() {
    var t;
    const { dragConstraints: e, dragElastic: n } = this.getProps(),
      i =
        this.visualElement.projection && !this.visualElement.projection.layout
          ? this.visualElement.projection.measure(!1)
          : null === (t = this.visualElement.projection) || void 0 === t
            ? void 0
            : t.layout,
      s = this.constraints;
    (e && H(e)
      ? this.constraints || (this.constraints = this.resolveRefConstraints())
      : (this.constraints =
          !(!e || !i) &&
          (function (t, { top: e, left: n, bottom: i, right: s }) {
            return { x: _s(t.x, n, s), y: _s(t.y, e, i) };
          })(i.layoutBox, e)),
      (this.elastic = (function (t = qs) {
        return (
          !1 === t ? (t = 0) : !0 === t && (t = qs),
          { x: Zs(t, 'left', 'right'), y: Zs(t, 'top', 'bottom') }
        );
      })(n)),
      s !== this.constraints &&
        i &&
        this.constraints &&
        !this.hasMutatedConstraints &&
        to(t => {
          !1 !== this.constraints &&
            this.getAxisMotionValue(t) &&
            (this.constraints[t] = (function (t, e) {
              const n = {};
              return (
                void 0 !== e.min && (n.min = e.min - t.min),
                void 0 !== e.max && (n.max = e.max - t.min),
                n
              );
            })(i.layoutBox[t], this.constraints[t]));
        }));
  }
  resolveRefConstraints() {
    const { dragConstraints: t, onMeasureDragConstraints: e } = this.getProps();
    if (!t || !H(t)) return !1;
    const n = t.current,
      { projection: i } = this.visualElement;
    if (!i || !i.layout) return !1;
    const s = (function (t, e, n) {
      const i = go(t, n),
        { scroll: s } = e;
      return (s && (mo(i.x, s.offset.x), mo(i.y, s.offset.y)), i);
    })(n, i.root, this.visualElement.getTransformPagePoint());
    let o = (function (t, e) {
      return { x: Gs(t.x, e.x), y: Gs(t.y, e.y) };
    })(i.layout.layoutBox, s);
    if (e) {
      const t = e(
        (function ({ x: t, y: e }) {
          return { top: e.min, right: t.max, bottom: e.max, left: t.min };
        })(o)
      );
      ((this.hasMutatedConstraints = !!t), t && (o = eo(t)));
    }
    return o;
  }
  startAnimation(t) {
    const {
        drag: e,
        dragMomentum: n,
        dragElastic: i,
        dragTransition: s,
        dragSnapToOrigin: o,
        onDragTransitionEnd: r,
      } = this.getProps(),
      a = this.constraints || {},
      l = to(r => {
        if (!To(r, e, this.currentDirection)) return;
        let l = (a && a[r]) || {};
        o && (l = { min: 0, max: 0 });
        const u = i ? 200 : 1e6,
          c = i ? 40 : 1e7,
          h = {
            type: 'inertia',
            velocity: n ? t[r] : 0,
            bounceStiffness: u,
            bounceDamping: c,
            timeConstant: 750,
            restDelta: 1,
            restSpeed: 10,
            ...s,
            ...l,
          };
        return this.startAxisValueAnimation(r, h);
      });
    return Promise.all(l).then(r);
  }
  startAxisValueAnimation(t, e) {
    const n = this.getAxisMotionValue(t);
    return (qe(this.visualElement, t), n.start(ms(t, n, 0, e, this.visualElement, !1)));
  }
  stopAnimation() {
    to(t => this.getAxisMotionValue(t).stop());
  }
  pauseAnimation() {
    to(t => {
      var e;
      return null === (e = this.getAxisMotionValue(t).animation) || void 0 === e
        ? void 0
        : e.pause();
    });
  }
  getAnimationState(t) {
    var e;
    return null === (e = this.getAxisMotionValue(t).animation) || void 0 === e ? void 0 : e.state;
  }
  getAxisMotionValue(t) {
    const e = `_drag${t.toUpperCase()}`,
      n = this.visualElement.getProps(),
      i = n[e];
    return i || this.visualElement.getValue(t, (n.initial ? n.initial[t] : void 0) || 0);
  }
  snapToCursor(t) {
    to(e => {
      const { drag: n } = this.getProps();
      if (!To(e, n, this.currentDirection)) return;
      const { projection: i } = this.visualElement,
        s = this.getAxisMotionValue(e);
      if (i && i.layout) {
        const { min: n, max: o } = i.layout.layoutBox[e];
        s.set(t[e] - li(n, o, 0.5));
      }
    });
  }
  scalePositionWithinConstraints() {
    if (!this.visualElement.current) return;
    const { drag: t, dragConstraints: e } = this.getProps(),
      { projection: n } = this.visualElement;
    if (!H(e) || !n || !this.constraints) return;
    this.stopAnimation();
    const i = { x: 0, y: 0 };
    to(t => {
      const e = this.getAxisMotionValue(t);
      if (e && !1 !== this.constraints) {
        const n = e.get();
        i[t] = (function (t, e) {
          let n = 0.5;
          const i = $s(t),
            s = $s(e);
          return (
            s > i ? (n = x(e.min, e.max - i, t.min)) : i > s && (n = x(t.min, t.max - s, e.min)),
            Tt(0, 1, n)
          );
        })({ min: n, max: n }, this.constraints[t]);
      }
    });
    const { transformTemplate: s } = this.visualElement.getProps();
    ((this.visualElement.current.style.transform = s ? s({}, '') : 'none'),
      n.root && n.root.updateScroll(),
      n.updateLayout(),
      this.resolveConstraints(),
      to(e => {
        if (!To(e, t, null)) return;
        const n = this.getAxisMotionValue(e),
          { min: s, max: o } = this.constraints[e];
        n.set(li(s, o, i[e]));
      }));
  }
  addListeners() {
    if (!this.visualElement.current) return;
    xo.set(this.visualElement, this);
    const t = Ls(this.visualElement.current, 'pointerdown', t => {
        const { drag: e, dragListener: n = !0 } = this.getProps();
        e && n && this.start(t);
      }),
      e = () => {
        const { dragConstraints: t } = this.getProps();
        H(t) && t.current && (this.constraints = this.resolveRefConstraints());
      },
      { projection: n } = this.visualElement,
      i = n.addEventListener('measure', e);
    (n && !n.layout && (n.root && n.root.updateScroll(), n.updateLayout()), A.read(e));
    const s = Rs(window, 'resize', () => this.scalePositionWithinConstraints()),
      o = n.addEventListener('didUpdate', ({ delta: t, hasLayoutChanged: e }) => {
        this.isDragging &&
          e &&
          (to(e => {
            const n = this.getAxisMotionValue(e);
            n && ((this.originPoint[e] += t[e].translate), n.set(n.get() + t[e].translate));
          }),
          this.visualElement.render());
      });
    return () => {
      (s(), t(), i(), o && o());
    };
  }
  getProps() {
    const t = this.visualElement.getProps(),
      {
        drag: e = !1,
        dragDirectionLock: n = !1,
        dragPropagation: i = !1,
        dragConstraints: s = !1,
        dragElastic: o = qs,
        dragMomentum: r = !0,
      } = t;
    return {
      ...t,
      drag: e,
      dragDirectionLock: n,
      dragPropagation: i,
      dragConstraints: s,
      dragElastic: o,
      dragMomentum: r,
    };
  }
}
function To(t, e, n) {
  return !((!0 !== e && e !== t) || (null !== n && n !== t));
}
const wo = t => (e, n) => {
  t && A.postRender(() => t(e, n));
};
const So = { hasAnimatedSinceResize: !0, hasEverUpdated: !1 };
function bo(t, e) {
  return e.max === e.min ? 0 : (t / (e.max - e.min)) * 100;
}
const Ao = {
    correct: (t, e) => {
      if (!e.target) return t;
      if ('string' == typeof t) {
        if (!Ct.test(t)) return t;
        t = parseFloat(t);
      }
      return `${bo(t, e.target.x)}% ${bo(t, e.target.y)}%`;
    },
  },
  Eo = {
    correct: (t, { treeScale: e, projectionDelta: n }) => {
      const i = t,
        s = Dn.parse(t);
      if (s.length > 5) return i;
      const o = Dn.createTransformer(t),
        r = 'number' != typeof s[0] ? 1 : 0,
        a = n.x.scale * e.x,
        l = n.y.scale * e.y;
      ((s[0 + r] /= a), (s[1 + r] /= l));
      const u = li(a, l, 0.5);
      return (
        'number' == typeof s[2 + r] && (s[2 + r] /= u),
        'number' == typeof s[3 + r] && (s[3 + r] /= u),
        o(s)
      );
    },
  };
class Vo extends t.Component {
  componentDidMount() {
    const { visualElement: t, layoutGroup: e, switchLayoutGroup: n, layoutId: i } = this.props,
      { projection: s } = t;
    var o;
    ((o = Mo),
      Object.assign(Gt, o),
      s &&
        (e.group && e.group.add(s),
        n && n.register && i && n.register(s),
        s.root.didUpdate(),
        s.addEventListener('animationComplete', () => {
          this.safeToRemove();
        }),
        s.setOptions({ ...s.options, onExitComplete: () => this.safeToRemove() })),
      (So.hasEverUpdated = !0));
  }
  getSnapshotBeforeUpdate(t) {
    const { layoutDependency: e, visualElement: n, drag: i, isPresent: s } = this.props,
      o = n.projection;
    return o
      ? ((o.isPresent = s),
        i || t.layoutDependency !== e || void 0 === e ? o.willUpdate() : this.safeToRemove(),
        t.isPresent !== s &&
          (s
            ? o.promote()
            : o.relegate() ||
              A.postRender(() => {
                const t = o.getStack();
                (t && t.members.length) || this.safeToRemove();
              })),
        null)
      : null;
  }
  componentDidUpdate() {
    const { projection: t } = this.props.visualElement;
    t &&
      (t.root.didUpdate(),
      Z.postRender(() => {
        !t.currentAnimation && t.isLead() && this.safeToRemove();
      }));
  }
  componentWillUnmount() {
    const { visualElement: t, layoutGroup: e, switchLayoutGroup: n } = this.props,
      { projection: i } = t;
    i &&
      (i.scheduleCheckAfterUnmount(),
      e && e.group && e.group.remove(i),
      n && n.deregister && n.deregister(i));
  }
  safeToRemove() {
    const { safeToRemove: t } = this.props;
    t && t();
  }
  render() {
    return null;
  }
}
function Co(e) {
  const [n, i] = (function (e = !0) {
      const n = t.useContext(d);
      if (null === n) return [!0, null];
      const { isPresent: i, onExitComplete: s, register: o } = n,
        r = t.useId();
      t.useEffect(() => {
        e && o(r);
      }, [e]);
      const a = t.useCallback(() => e && s && s(r), [r, s, e]);
      return !i && s ? [!1, a] : [!0];
    })(),
    s = t.useContext(h);
  return c.jsx(Vo, {
    ...e,
    layoutGroup: s,
    switchLayoutGroup: t.useContext(J),
    isPresent: n,
    safeToRemove: i,
  });
}
const Mo = {
  borderRadius: {
    ...Ao,
    applyTo: [
      'borderTopLeftRadius',
      'borderTopRightRadius',
      'borderBottomLeftRadius',
      'borderBottomRightRadius',
    ],
  },
  borderTopLeftRadius: Ao,
  borderTopRightRadius: Ao,
  borderBottomLeftRadius: Ao,
  borderBottomRightRadius: Ao,
  boxShadow: Eo,
};
const Do = (t, e) => t.depth - e.depth;
class Ro {
  constructor() {
    ((this.children = []), (this.isDirty = !1));
  }
  add(t) {
    (Ke(this.children, t), (this.isDirty = !0));
  }
  remove(t) {
    (Ye(this.children, t), (this.isDirty = !0));
  }
  forEach(t) {
    (this.isDirty && this.children.sort(Do), (this.isDirty = !1), this.children.forEach(t));
  }
}
const ko = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'],
  Lo = ko.length,
  jo = t => ('string' == typeof t ? parseFloat(t) : t),
  Fo = t => 'number' == typeof t || Ct.test(t);
function Bo(t, e) {
  return void 0 !== t[e] ? t[e] : t.borderRadius;
}
const Oo = Uo(0, 0.5, ln),
  Io = Uo(0.5, 0.95, v);
function Uo(t, e, n) {
  return i => (i < t ? 0 : i > e ? 1 : n(x(t, e, i)));
}
function No(t, e) {
  ((t.min = e.min), (t.max = e.max));
}
function Wo(t, e) {
  (No(t.x, e.x), No(t.y, e.y));
}
function $o(t, e) {
  ((t.translate = e.translate),
    (t.scale = e.scale),
    (t.originPoint = e.originPoint),
    (t.origin = e.origin));
}
function Ko(t, e, n, i, s) {
  return ((t = ao((t -= e), 1 / n, i)), void 0 !== s && (t = ao(t, 1 / s, i)), t);
}
function Yo(t, e, [n, i, s], o, r) {
  !(function (t, e = 0, n = 1, i = 0.5, s, o = t, r = t) {
    Vt.test(e) && ((e = parseFloat(e)), (e = li(r.min, r.max, e / 100) - r.min));
    if ('number' != typeof e) return;
    let a = li(o.min, o.max, i);
    (t === o && (a -= e), (t.min = Ko(t.min, e, n, a, s)), (t.max = Ko(t.max, e, n, a, s)));
  })(t, e[n], e[i], e[s], e.scale, o, r);
}
const zo = ['x', 'scaleX', 'originX'],
  Xo = ['y', 'scaleY', 'originY'];
function Ho(t, e, n, i) {
  (Yo(t.x, e, zo, n ? n.x : void 0, i ? i.x : void 0),
    Yo(t.y, e, Xo, n ? n.y : void 0, i ? i.y : void 0));
}
function _o(t) {
  return 0 === t.translate && 1 === t.scale;
}
function Go(t) {
  return _o(t.x) && _o(t.y);
}
function qo(t, e) {
  return t.min === e.min && t.max === e.max;
}
function Zo(t, e) {
  return Math.round(t.min) === Math.round(e.min) && Math.round(t.max) === Math.round(e.max);
}
function Jo(t, e) {
  return Zo(t.x, e.x) && Zo(t.y, e.y);
}
function Qo(t) {
  return $s(t.x) / $s(t.y);
}
function tr(t, e) {
  return t.translate === e.translate && t.scale === e.scale && t.originPoint === e.originPoint;
}
class er {
  constructor() {
    this.members = [];
  }
  add(t) {
    (Ke(this.members, t), t.scheduleRender());
  }
  remove(t) {
    if ((Ye(this.members, t), t === this.prevLead && (this.prevLead = void 0), t === this.lead)) {
      const t = this.members[this.members.length - 1];
      t && this.promote(t);
    }
  }
  relegate(t) {
    const e = this.members.findIndex(e => t === e);
    if (0 === e) return !1;
    let n;
    for (let i = e; i >= 0; i--) {
      const t = this.members[i];
      if (!1 !== t.isPresent) {
        n = t;
        break;
      }
    }
    return !!n && (this.promote(n), !0);
  }
  promote(t, e) {
    const n = this.lead;
    if (t !== n && ((this.prevLead = n), (this.lead = t), t.show(), n)) {
      (n.instance && n.scheduleRender(),
        t.scheduleRender(),
        (t.resumeFrom = n),
        e && (t.resumeFrom.preserveOpacity = !0),
        n.snapshot &&
          ((t.snapshot = n.snapshot),
          (t.snapshot.latestValues = n.animationValues || n.latestValues)),
        t.root && t.root.isUpdating && (t.isLayoutDirty = !0));
      const { crossfade: i } = t.options;
      !1 === i && n.hide();
    }
  }
  exitAnimationComplete() {
    this.members.forEach(t => {
      const { options: e, resumingFrom: n } = t;
      (e.onExitComplete && e.onExitComplete(),
        n && n.options.onExitComplete && n.options.onExitComplete());
    });
  }
  scheduleRender() {
    this.members.forEach(t => {
      t.instance && t.scheduleRender(!1);
    });
  }
  removeLeadSnapshot() {
    this.lead && this.lead.snapshot && (this.lead.snapshot = void 0);
  }
}
const nr = {
    type: 'projectionFrame',
    totalNodes: 0,
    resolvedTargetDeltas: 0,
    recalculatedProjection: 0,
  },
  ir = 'undefined' != typeof window && void 0 !== window.MotionDebug,
  sr = ['', 'X', 'Y', 'Z'],
  or = { visibility: 'hidden' };
let rr = 0;
function ar(t, e, n, i) {
  const { latestValues: s } = e;
  s[t] && ((n[t] = s[t]), e.setStaticValue(t, 0), i && (i[t] = 0));
}
function lr(t) {
  if (((t.hasCheckedOptimisedAppear = !0), t.root === t)) return;
  const { visualElement: e } = t.options;
  if (!e) return;
  const n = Ze(e);
  if (window.MotionHasOptimisedAnimation(n, 'transform')) {
    const { layout: e, layoutId: i } = t.options;
    window.MotionCancelOptimisedAnimation(n, 'transform', A, !(e || i));
  }
  const { parent: i } = t;
  i && !i.hasCheckedOptimisedAppear && lr(i);
}
function ur({
  attachResizeListener: t,
  defaultParent: e,
  measureScroll: n,
  checkIsScrollRoot: i,
  resetTransform: s,
}) {
  return class {
    constructor(t = {}, n = null == e ? void 0 : e()) {
      ((this.id = rr++),
        (this.animationId = 0),
        (this.children = new Set()),
        (this.options = {}),
        (this.isTreeAnimating = !1),
        (this.isAnimationBlocked = !1),
        (this.isLayoutDirty = !1),
        (this.isProjectionDirty = !1),
        (this.isSharedProjectionDirty = !1),
        (this.isTransformDirty = !1),
        (this.updateManuallyBlocked = !1),
        (this.updateBlockedByResize = !1),
        (this.isUpdating = !1),
        (this.isSVG = !1),
        (this.needsReset = !1),
        (this.shouldResetTransform = !1),
        (this.hasCheckedOptimisedAppear = !1),
        (this.treeScale = { x: 1, y: 1 }),
        (this.eventHandlers = new Map()),
        (this.hasTreeAnimated = !1),
        (this.updateScheduled = !1),
        (this.scheduleUpdate = () => this.update()),
        (this.projectionUpdateScheduled = !1),
        (this.checkUpdateFailed = () => {
          this.isUpdating && ((this.isUpdating = !1), this.clearAllSnapshots());
        }),
        (this.updateProjection = () => {
          ((this.projectionUpdateScheduled = !1),
            ir && (nr.totalNodes = nr.resolvedTargetDeltas = nr.recalculatedProjection = 0),
            this.nodes.forEach(dr),
            this.nodes.forEach(xr),
            this.nodes.forEach(Pr),
            this.nodes.forEach(pr),
            ir && window.MotionDebug.record(nr));
        }),
        (this.resolvedRelativeTargetAt = 0),
        (this.hasProjected = !1),
        (this.isVisible = !0),
        (this.animationProgress = 0),
        (this.sharedNodes = new Map()),
        (this.latestValues = t),
        (this.root = n ? n.root || n : this),
        (this.path = n ? [...n.path, n] : []),
        (this.parent = n),
        (this.depth = n ? n.depth + 1 : 0));
      for (let e = 0; e < this.path.length; e++) this.path[e].shouldResetTransform = !0;
      this.root === this && (this.nodes = new Ro());
    }
    addEventListener(t, e) {
      return (
        this.eventHandlers.has(t) || this.eventHandlers.set(t, new ze()),
        this.eventHandlers.get(t).add(e)
      );
    }
    notifyListeners(t, ...e) {
      const n = this.eventHandlers.get(t);
      n && n.notify(...e);
    }
    hasListeners(t) {
      return this.eventHandlers.has(t);
    }
    mount(e, n = this.root.hasTreeAnimated) {
      if (this.instance) return;
      var i;
      ((this.isSVG = (i = e) instanceof SVGElement && 'svg' !== i.tagName), (this.instance = e));
      const { layoutId: s, layout: o, visualElement: r } = this.options;
      if (
        (r && !r.current && r.mount(e),
        this.root.nodes.add(this),
        this.parent && this.parent.children.add(this),
        n && (o || s) && (this.isLayoutDirty = !0),
        t)
      ) {
        let n;
        const i = () => (this.root.updateBlockedByResize = !1);
        t(e, () => {
          ((this.root.updateBlockedByResize = !0),
            n && n(),
            (n = (function (t, e) {
              const n = $e.now(),
                i = ({ timestamp: s }) => {
                  const o = s - n;
                  o >= e && (E(i), t(o - e));
                };
              return (A.read(i, !0), () => E(i));
            })(i, 250)),
            So.hasAnimatedSinceResize &&
              ((So.hasAnimatedSinceResize = !1), this.nodes.forEach(yr)));
        });
      }
      (s && this.root.registerSharedNode(s, this),
        !1 !== this.options.animate &&
          r &&
          (s || o) &&
          this.addEventListener(
            'didUpdate',
            ({ delta: t, hasLayoutChanged: e, hasRelativeTargetChanged: n, layout: i }) => {
              if (this.isTreeAnimationBlocked())
                return ((this.target = void 0), void (this.relativeTarget = void 0));
              const s = this.options.transition || r.getDefaultTransition() || Er,
                { onLayoutAnimationStart: o, onLayoutAnimationComplete: a } = r.getProps(),
                l = !this.targetLayout || !Jo(this.targetLayout, i) || n,
                u = !e && n;
              if (
                this.options.layoutRoot ||
                (this.resumeFrom && this.resumeFrom.instance) ||
                u ||
                (e && (l || !this.currentAnimation))
              ) {
                (this.resumeFrom &&
                  ((this.resumingFrom = this.resumeFrom),
                  (this.resumingFrom.resumingFrom = void 0)),
                  this.setAnimationOrigin(t, u));
                const e = { ...pe(s, 'layout'), onPlay: o, onComplete: a };
                ((r.shouldReduceMotion || this.options.layoutRoot) &&
                  ((e.delay = 0), (e.type = !1)),
                  this.startAnimation(e));
              } else
                (e || yr(this),
                  this.isLead() && this.options.onExitComplete && this.options.onExitComplete());
              this.targetLayout = i;
            }
          ));
    }
    unmount() {
      (this.options.layoutId && this.willUpdate(), this.root.nodes.remove(this));
      const t = this.getStack();
      (t && t.remove(this),
        this.parent && this.parent.children.delete(this),
        (this.instance = void 0),
        E(this.updateProjection));
    }
    blockUpdate() {
      this.updateManuallyBlocked = !0;
    }
    unblockUpdate() {
      this.updateManuallyBlocked = !1;
    }
    isUpdateBlocked() {
      return this.updateManuallyBlocked || this.updateBlockedByResize;
    }
    isTreeAnimationBlocked() {
      return this.isAnimationBlocked || (this.parent && this.parent.isTreeAnimationBlocked()) || !1;
    }
    startUpdate() {
      this.isUpdateBlocked() ||
        ((this.isUpdating = !0), this.nodes && this.nodes.forEach(Tr), this.animationId++);
    }
    getTransformTemplate() {
      const { visualElement: t } = this.options;
      return t && t.getProps().transformTemplate;
    }
    willUpdate(t = !0) {
      if (((this.root.hasTreeAnimated = !0), this.root.isUpdateBlocked()))
        return void (this.options.onExitComplete && this.options.onExitComplete());
      if (
        (window.MotionCancelOptimisedAnimation && !this.hasCheckedOptimisedAppear && lr(this),
        !this.root.isUpdating && this.root.startUpdate(),
        this.isLayoutDirty)
      )
        return;
      this.isLayoutDirty = !0;
      for (let s = 0; s < this.path.length; s++) {
        const t = this.path[s];
        ((t.shouldResetTransform = !0),
          t.updateScroll('snapshot'),
          t.options.layoutRoot && t.willUpdate(!1));
      }
      const { layoutId: e, layout: n } = this.options;
      if (void 0 === e && !n) return;
      const i = this.getTransformTemplate();
      ((this.prevTransformTemplateValue = i ? i(this.latestValues, '') : void 0),
        this.updateSnapshot(),
        t && this.notifyListeners('willUpdate'));
    }
    update() {
      this.updateScheduled = !1;
      if (this.isUpdateBlocked())
        return (this.unblockUpdate(), this.clearAllSnapshots(), void this.nodes.forEach(fr));
      (this.isUpdating || this.nodes.forEach(vr),
        (this.isUpdating = !1),
        this.nodes.forEach(gr),
        this.nodes.forEach(cr),
        this.nodes.forEach(hr),
        this.clearAllSnapshots());
      const t = $e.now();
      ((V.delta = Tt(0, 1e3 / 60, t - V.timestamp)),
        (V.timestamp = t),
        (V.isProcessing = !0),
        C.update.process(V),
        C.preRender.process(V),
        C.render.process(V),
        (V.isProcessing = !1));
    }
    didUpdate() {
      this.updateScheduled || ((this.updateScheduled = !0), Z.read(this.scheduleUpdate));
    }
    clearAllSnapshots() {
      (this.nodes.forEach(mr), this.sharedNodes.forEach(wr));
    }
    scheduleUpdateProjection() {
      this.projectionUpdateScheduled ||
        ((this.projectionUpdateScheduled = !0), A.preRender(this.updateProjection, !1, !0));
    }
    scheduleCheckAfterUnmount() {
      A.postRender(() => {
        this.isLayoutDirty ? this.root.didUpdate() : this.root.checkUpdateFailed();
      });
    }
    updateSnapshot() {
      !this.snapshot && this.instance && (this.snapshot = this.measure());
    }
    updateLayout() {
      if (!this.instance) return;
      if (
        (this.updateScroll(),
        !((this.options.alwaysMeasureLayout && this.isLead()) || this.isLayoutDirty))
      )
        return;
      if (this.resumeFrom && !this.resumeFrom.instance)
        for (let n = 0; n < this.path.length; n++) {
          this.path[n].updateScroll();
        }
      const t = this.layout;
      ((this.layout = this.measure(!1)),
        (this.layoutCorrected = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }),
        (this.isLayoutDirty = !1),
        (this.projectionDelta = void 0),
        this.notifyListeners('measure', this.layout.layoutBox));
      const { visualElement: e } = this.options;
      e && e.notify('LayoutMeasure', this.layout.layoutBox, t ? t.layoutBox : void 0);
    }
    updateScroll(t = 'measure') {
      let e = Boolean(this.options.layoutScroll && this.instance);
      if (
        (this.scroll &&
          this.scroll.animationId === this.root.animationId &&
          this.scroll.phase === t &&
          (e = !1),
        e)
      ) {
        const e = i(this.instance);
        this.scroll = {
          animationId: this.root.animationId,
          phase: t,
          isRoot: e,
          offset: n(this.instance),
          wasRoot: this.scroll ? this.scroll.isRoot : e,
        };
      }
    }
    resetTransform() {
      if (!s) return;
      const t = this.isLayoutDirty || this.shouldResetTransform || this.options.alwaysMeasureLayout,
        e = this.projectionDelta && !Go(this.projectionDelta),
        n = this.getTransformTemplate(),
        i = n ? n(this.latestValues, '') : void 0,
        o = i !== this.prevTransformTemplateValue;
      t &&
        (e || so(this.latestValues) || o) &&
        (s(this.instance, i), (this.shouldResetTransform = !1), this.scheduleRender());
    }
    measure(t = !0) {
      const e = this.measurePageBox();
      let n = this.removeElementScroll(e);
      var i;
      return (
        t && (n = this.removeTransform(n)),
        Mr((i = n).x),
        Mr(i.y),
        {
          animationId: this.root.animationId,
          measuredBox: e,
          layoutBox: n,
          latestValues: {},
          source: this.id,
        }
      );
    }
    measurePageBox() {
      var t;
      const { visualElement: e } = this.options;
      if (!e) return { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
      const n = e.measureViewportBox();
      if (
        !((null === (t = this.scroll) || void 0 === t ? void 0 : t.wasRoot) || this.path.some(Rr))
      ) {
        const { scroll: t } = this.root;
        t && (mo(n.x, t.offset.x), mo(n.y, t.offset.y));
      }
      return n;
    }
    removeElementScroll(t) {
      var e;
      const n = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
      if ((Wo(n, t), null === (e = this.scroll) || void 0 === e ? void 0 : e.wasRoot)) return n;
      for (let i = 0; i < this.path.length; i++) {
        const e = this.path[i],
          { scroll: s, options: o } = e;
        e !== this.root &&
          s &&
          o.layoutScroll &&
          (s.wasRoot && Wo(n, t), mo(n.x, s.offset.x), mo(n.y, s.offset.y));
      }
      return n;
    }
    applyTransform(t, e = !1) {
      const n = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
      Wo(n, t);
      for (let i = 0; i < this.path.length; i++) {
        const t = this.path[i];
        (!e &&
          t.options.layoutScroll &&
          t.scroll &&
          t !== t.root &&
          vo(n, { x: -t.scroll.offset.x, y: -t.scroll.offset.y }),
          so(t.latestValues) && vo(n, t.latestValues));
      }
      return (so(this.latestValues) && vo(n, this.latestValues), n);
    }
    removeTransform(t) {
      const e = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
      Wo(e, t);
      for (let n = 0; n < this.path.length; n++) {
        const t = this.path[n];
        if (!t.instance) continue;
        if (!so(t.latestValues)) continue;
        io(t.latestValues) && t.updateSnapshot();
        const i = Qs();
        (Wo(i, t.measurePageBox()),
          Ho(e, t.latestValues, t.snapshot ? t.snapshot.layoutBox : void 0, i));
      }
      return (so(this.latestValues) && Ho(e, this.latestValues), e);
    }
    setTargetDelta(t) {
      ((this.targetDelta = t), this.root.scheduleUpdateProjection(), (this.isProjectionDirty = !0));
    }
    setOptions(t) {
      this.options = { ...this.options, ...t, crossfade: void 0 === t.crossfade || t.crossfade };
    }
    clearMeasurements() {
      ((this.scroll = void 0),
        (this.layout = void 0),
        (this.snapshot = void 0),
        (this.prevTransformTemplateValue = void 0),
        (this.targetDelta = void 0),
        (this.target = void 0),
        (this.isLayoutDirty = !1));
    }
    forceRelativeParentToResolveTarget() {
      this.relativeParent &&
        this.relativeParent.resolvedRelativeTargetAt !== V.timestamp &&
        this.relativeParent.resolveTargetDelta(!0);
    }
    resolveTargetDelta(t = !1) {
      var e;
      const n = this.getLead();
      (this.isProjectionDirty || (this.isProjectionDirty = n.isProjectionDirty),
        this.isTransformDirty || (this.isTransformDirty = n.isTransformDirty),
        this.isSharedProjectionDirty || (this.isSharedProjectionDirty = n.isSharedProjectionDirty));
      const i = Boolean(this.resumingFrom) || this !== n;
      if (
        !(
          t ||
          (i && this.isSharedProjectionDirty) ||
          this.isProjectionDirty ||
          (null === (e = this.parent) || void 0 === e ? void 0 : e.isProjectionDirty) ||
          this.attemptToResolveRelativeTarget ||
          this.root.updateBlockedByResize
        )
      )
        return;
      const { layout: s, layoutId: o } = this.options;
      if (this.layout && (s || o)) {
        if (
          ((this.resolvedRelativeTargetAt = V.timestamp), !this.targetDelta && !this.relativeTarget)
        ) {
          const t = this.getClosestProjectingParent();
          t && t.layout && 1 !== this.animationProgress
            ? ((this.relativeParent = t),
              this.forceRelativeParentToResolveTarget(),
              (this.relativeTarget = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }),
              (this.relativeTargetOrigin = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }),
              Hs(this.relativeTargetOrigin, this.layout.layoutBox, t.layout.layoutBox),
              Wo(this.relativeTarget, this.relativeTargetOrigin))
            : (this.relativeParent = this.relativeTarget = void 0);
        }
        if (this.relativeTarget || this.targetDelta) {
          var r, a, l;
          if (
            (this.target ||
              ((this.target = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }),
              (this.targetWithTransforms = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } })),
            this.relativeTarget &&
            this.relativeTargetOrigin &&
            this.relativeParent &&
            this.relativeParent.target
              ? (this.forceRelativeParentToResolveTarget(),
                (r = this.target),
                (a = this.relativeTarget),
                (l = this.relativeParent.target),
                zs(r.x, a.x, l.x),
                zs(r.y, a.y, l.y))
              : this.targetDelta
                ? (Boolean(this.resumingFrom)
                    ? (this.target = this.applyTransform(this.layout.layoutBox))
                    : Wo(this.target, this.layout.layoutBox),
                  co(this.target, this.targetDelta))
                : Wo(this.target, this.layout.layoutBox),
            this.attemptToResolveRelativeTarget)
          ) {
            this.attemptToResolveRelativeTarget = !1;
            const t = this.getClosestProjectingParent();
            t &&
            Boolean(t.resumingFrom) === Boolean(this.resumingFrom) &&
            !t.options.layoutScroll &&
            t.target &&
            1 !== this.animationProgress
              ? ((this.relativeParent = t),
                this.forceRelativeParentToResolveTarget(),
                (this.relativeTarget = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }),
                (this.relativeTargetOrigin = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }),
                Hs(this.relativeTargetOrigin, this.target, t.target),
                Wo(this.relativeTarget, this.relativeTargetOrigin))
              : (this.relativeParent = this.relativeTarget = void 0);
          }
          ir && nr.resolvedTargetDeltas++;
        }
      }
    }
    getClosestProjectingParent() {
      if (this.parent && !io(this.parent.latestValues) && !oo(this.parent.latestValues))
        return this.parent.isProjecting() ? this.parent : this.parent.getClosestProjectingParent();
    }
    isProjecting() {
      return Boolean(
        (this.relativeTarget || this.targetDelta || this.options.layoutRoot) && this.layout
      );
    }
    calcProjection() {
      var t;
      const e = this.getLead(),
        n = Boolean(this.resumingFrom) || this !== e;
      let i = !0;
      if (
        ((this.isProjectionDirty ||
          (null === (t = this.parent) || void 0 === t ? void 0 : t.isProjectionDirty)) &&
          (i = !1),
        n && (this.isSharedProjectionDirty || this.isTransformDirty) && (i = !1),
        this.resolvedRelativeTargetAt === V.timestamp && (i = !1),
        i)
      )
        return;
      const { layout: s, layoutId: o } = this.options;
      if (
        ((this.isTreeAnimating = Boolean(
          (this.parent && this.parent.isTreeAnimating) ||
            this.currentAnimation ||
            this.pendingAnimation
        )),
        this.isTreeAnimating || (this.targetDelta = this.relativeTarget = void 0),
        !this.layout || (!s && !o))
      )
        return;
      Wo(this.layoutCorrected, this.layout.layoutBox);
      const r = this.treeScale.x,
        a = this.treeScale.y;
      (!(function (t, e, n, i = !1) {
        const s = n.length;
        if (!s) return;
        let o, r;
        e.x = e.y = 1;
        for (let a = 0; a < s; a++) {
          ((o = n[a]), (r = o.projectionDelta));
          const { visualElement: s } = o.options;
          (s && s.props.style && 'contents' === s.props.style.display) ||
            (i &&
              o.options.layoutScroll &&
              o.scroll &&
              o !== o.root &&
              vo(t, { x: -o.scroll.offset.x, y: -o.scroll.offset.y }),
            r && ((e.x *= r.x.scale), (e.y *= r.y.scale), co(t, r)),
            i && so(o.latestValues) && vo(t, o.latestValues));
        }
        (e.x < po && e.x > ho && (e.x = 1), e.y < po && e.y > ho && (e.y = 1));
      })(this.layoutCorrected, this.treeScale, this.path, n),
        !e.layout ||
          e.target ||
          (1 === this.treeScale.x && 1 === this.treeScale.y) ||
          ((e.target = e.layout.layoutBox),
          (e.targetWithTransforms = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } })));
      const { target: l } = e;
      l
        ? (this.projectionDelta && this.prevProjectionDelta
            ? ($o(this.prevProjectionDelta.x, this.projectionDelta.x),
              $o(this.prevProjectionDelta.y, this.projectionDelta.y))
            : this.createProjectionDeltas(),
          Ys(this.projectionDelta, this.layoutCorrected, l, this.latestValues),
          (this.treeScale.x === r &&
            this.treeScale.y === a &&
            tr(this.projectionDelta.x, this.prevProjectionDelta.x) &&
            tr(this.projectionDelta.y, this.prevProjectionDelta.y)) ||
            ((this.hasProjected = !0),
            this.scheduleRender(),
            this.notifyListeners('projectionUpdate', l)),
          ir && nr.recalculatedProjection++)
        : this.prevProjectionDelta && (this.createProjectionDeltas(), this.scheduleRender());
    }
    hide() {
      this.isVisible = !1;
    }
    show() {
      this.isVisible = !0;
    }
    scheduleRender(t = !0) {
      var e;
      if ((null === (e = this.options.visualElement) || void 0 === e || e.scheduleRender(), t)) {
        const t = this.getStack();
        t && t.scheduleRender();
      }
      this.resumingFrom && !this.resumingFrom.instance && (this.resumingFrom = void 0);
    }
    createProjectionDeltas() {
      ((this.prevProjectionDelta = {
        x: { translate: 0, scale: 1, origin: 0, originPoint: 0 },
        y: { translate: 0, scale: 1, origin: 0, originPoint: 0 },
      }),
        (this.projectionDelta = {
          x: { translate: 0, scale: 1, origin: 0, originPoint: 0 },
          y: { translate: 0, scale: 1, origin: 0, originPoint: 0 },
        }),
        (this.projectionDeltaWithTransform = {
          x: { translate: 0, scale: 1, origin: 0, originPoint: 0 },
          y: { translate: 0, scale: 1, origin: 0, originPoint: 0 },
        }));
    }
    setAnimationOrigin(t, e = !1) {
      const n = this.snapshot,
        i = n ? n.latestValues : {},
        s = { ...this.latestValues },
        o = {
          x: { translate: 0, scale: 1, origin: 0, originPoint: 0 },
          y: { translate: 0, scale: 1, origin: 0, originPoint: 0 },
        };
      ((this.relativeParent && this.relativeParent.options.layoutRoot) ||
        (this.relativeTarget = this.relativeTargetOrigin = void 0),
        (this.attemptToResolveRelativeTarget = !e));
      const r = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } },
        a = (n ? n.source : void 0) !== (this.layout ? this.layout.source : void 0),
        l = this.getStack(),
        u = !l || l.members.length <= 1,
        c = Boolean(a && !u && !0 === this.options.crossfade && !this.path.some(Ar));
      let h;
      ((this.animationProgress = 0),
        (this.mixTargetDelta = e => {
          const n = e / 1e3;
          var l, d, p, m, f, v;
          (Sr(o.x, t.x, n),
            Sr(o.y, t.y, n),
            this.setTargetDelta(o),
            this.relativeTarget &&
              this.relativeTargetOrigin &&
              this.layout &&
              this.relativeParent &&
              this.relativeParent.layout &&
              (Hs(r, this.layout.layoutBox, this.relativeParent.layout.layoutBox),
              (p = this.relativeTarget),
              (m = this.relativeTargetOrigin),
              (f = r),
              (v = n),
              br(p.x, m.x, f.x, v),
              br(p.y, m.y, f.y, v),
              h &&
                ((l = this.relativeTarget), (d = h), qo(l.x, d.x) && qo(l.y, d.y)) &&
                (this.isProjectionDirty = !1),
              h || (h = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } }),
              Wo(h, this.relativeTarget)),
            a &&
              ((this.animationValues = s),
              (function (t, e, n, i, s, o) {
                s
                  ? ((t.opacity = li(0, void 0 !== n.opacity ? n.opacity : 1, Oo(i))),
                    (t.opacityExit = li(void 0 !== e.opacity ? e.opacity : 1, 0, Io(i))))
                  : o &&
                    (t.opacity = li(
                      void 0 !== e.opacity ? e.opacity : 1,
                      void 0 !== n.opacity ? n.opacity : 1,
                      i
                    ));
                for (let r = 0; r < Lo; r++) {
                  const s = `border${ko[r]}Radius`;
                  let o = Bo(e, s),
                    a = Bo(n, s);
                  (void 0 === o && void 0 === a) ||
                    (o || (o = 0),
                    a || (a = 0),
                    0 === o || 0 === a || Fo(o) === Fo(a)
                      ? ((t[s] = Math.max(li(jo(o), jo(a), i), 0)),
                        (Vt.test(a) || Vt.test(o)) && (t[s] += '%'))
                      : (t[s] = a));
                }
                (e.rotate || n.rotate) && (t.rotate = li(e.rotate || 0, n.rotate || 0, i));
              })(s, i, this.latestValues, n, c, u)),
            this.root.scheduleUpdateProjection(),
            this.scheduleRender(),
            (this.animationProgress = n));
        }),
        this.mixTargetDelta(this.options.layoutRoot ? 1e3 : 0));
    }
    startAnimation(t) {
      (this.notifyListeners('animationStart'),
        this.currentAnimation && this.currentAnimation.stop(),
        this.resumingFrom &&
          this.resumingFrom.currentAnimation &&
          this.resumingFrom.currentAnimation.stop(),
        this.pendingAnimation && (E(this.pendingAnimation), (this.pendingAnimation = void 0)),
        (this.pendingAnimation = A.update(() => {
          ((So.hasAnimatedSinceResize = !0),
            (this.currentAnimation = (function (t, e, n) {
              const i = ut(t) ? t : _e(t);
              return (i.start(ms('', i, e, n)), i.animation);
            })(0, 1e3, {
              ...t,
              onUpdate: e => {
                (this.mixTargetDelta(e), t.onUpdate && t.onUpdate(e));
              },
              onComplete: () => {
                (t.onComplete && t.onComplete(), this.completeAnimation());
              },
            })),
            this.resumingFrom && (this.resumingFrom.currentAnimation = this.currentAnimation),
            (this.pendingAnimation = void 0));
        })));
    }
    completeAnimation() {
      this.resumingFrom &&
        ((this.resumingFrom.currentAnimation = void 0),
        (this.resumingFrom.preserveOpacity = void 0));
      const t = this.getStack();
      (t && t.exitAnimationComplete(),
        (this.resumingFrom = this.currentAnimation = this.animationValues = void 0),
        this.notifyListeners('animationComplete'));
    }
    finishAnimation() {
      (this.currentAnimation &&
        (this.mixTargetDelta && this.mixTargetDelta(1e3), this.currentAnimation.stop()),
        this.completeAnimation());
    }
    applyTransformsToTarget() {
      const t = this.getLead();
      let { targetWithTransforms: e, target: n, layout: i, latestValues: s } = t;
      if (e && n && i) {
        if (
          this !== t &&
          this.layout &&
          i &&
          Dr(this.options.animationType, this.layout.layoutBox, i.layoutBox)
        ) {
          n = this.target || { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
          const e = $s(this.layout.layoutBox.x);
          ((n.x.min = t.target.x.min), (n.x.max = n.x.min + e));
          const i = $s(this.layout.layoutBox.y);
          ((n.y.min = t.target.y.min), (n.y.max = n.y.min + i));
        }
        (Wo(e, n), vo(e, s), Ys(this.projectionDeltaWithTransform, this.layoutCorrected, e, s));
      }
    }
    registerSharedNode(t, e) {
      this.sharedNodes.has(t) || this.sharedNodes.set(t, new er());
      this.sharedNodes.get(t).add(e);
      const n = e.options.initialPromotionConfig;
      e.promote({
        transition: n ? n.transition : void 0,
        preserveFollowOpacity:
          n && n.shouldPreserveFollowOpacity ? n.shouldPreserveFollowOpacity(e) : void 0,
      });
    }
    isLead() {
      const t = this.getStack();
      return !t || t.lead === this;
    }
    getLead() {
      var t;
      const { layoutId: e } = this.options;
      return (e && (null === (t = this.getStack()) || void 0 === t ? void 0 : t.lead)) || this;
    }
    getPrevLead() {
      var t;
      const { layoutId: e } = this.options;
      return e ? (null === (t = this.getStack()) || void 0 === t ? void 0 : t.prevLead) : void 0;
    }
    getStack() {
      const { layoutId: t } = this.options;
      if (t) return this.root.sharedNodes.get(t);
    }
    promote({ needsReset: t, transition: e, preserveFollowOpacity: n } = {}) {
      const i = this.getStack();
      (i && i.promote(this, n),
        t && ((this.projectionDelta = void 0), (this.needsReset = !0)),
        e && this.setOptions({ transition: e }));
    }
    relegate() {
      const t = this.getStack();
      return !!t && t.relegate(this);
    }
    resetSkewAndRotation() {
      const { visualElement: t } = this.options;
      if (!t) return;
      let e = !1;
      const { latestValues: n } = t;
      if (
        ((n.z || n.rotate || n.rotateX || n.rotateY || n.rotateZ || n.skewX || n.skewY) && (e = !0),
        !e)
      )
        return;
      const i = {};
      n.z && ar('z', t, i, this.animationValues);
      for (let s = 0; s < sr.length; s++)
        (ar(`rotate${sr[s]}`, t, i, this.animationValues),
          ar(`skew${sr[s]}`, t, i, this.animationValues));
      t.render();
      for (const s in i)
        (t.setStaticValue(s, i[s]), this.animationValues && (this.animationValues[s] = i[s]));
      t.scheduleRender();
    }
    getProjectionStyles(t) {
      var e, n;
      if (!this.instance || this.isSVG) return;
      if (!this.isVisible) return or;
      const i = { visibility: '' },
        s = this.getTransformTemplate();
      if (this.needsReset)
        return (
          (this.needsReset = !1),
          (i.opacity = ''),
          (i.pointerEvents = ct(null == t ? void 0 : t.pointerEvents) || ''),
          (i.transform = s ? s(this.latestValues, '') : 'none'),
          i
        );
      const o = this.getLead();
      if (!this.projectionDelta || !this.layout || !o.target) {
        const e = {};
        return (
          this.options.layoutId &&
            ((e.opacity = void 0 !== this.latestValues.opacity ? this.latestValues.opacity : 1),
            (e.pointerEvents = ct(null == t ? void 0 : t.pointerEvents) || '')),
          this.hasProjected &&
            !so(this.latestValues) &&
            ((e.transform = s ? s({}, '') : 'none'), (this.hasProjected = !1)),
          e
        );
      }
      const r = o.animationValues || o.latestValues;
      (this.applyTransformsToTarget(),
        (i.transform = (function (t, e, n) {
          let i = '';
          const s = t.x.translate / e.x,
            o = t.y.translate / e.y,
            r = (null == n ? void 0 : n.z) || 0;
          if (
            ((s || o || r) && (i = `translate3d(${s}px, ${o}px, ${r}px) `),
            (1 === e.x && 1 === e.y) || (i += `scale(${1 / e.x}, ${1 / e.y}) `),
            n)
          ) {
            const {
              transformPerspective: t,
              rotate: e,
              rotateX: s,
              rotateY: o,
              skewX: r,
              skewY: a,
            } = n;
            (t && (i = `perspective(${t}px) ${i}`),
              e && (i += `rotate(${e}deg) `),
              s && (i += `rotateX(${s}deg) `),
              o && (i += `rotateY(${o}deg) `),
              r && (i += `skewX(${r}deg) `),
              a && (i += `skewY(${a}deg) `));
          }
          const a = t.x.scale * e.x,
            l = t.y.scale * e.y;
          return ((1 === a && 1 === l) || (i += `scale(${a}, ${l})`), i || 'none');
        })(this.projectionDeltaWithTransform, this.treeScale, r)),
        s && (i.transform = s(r, i.transform)));
      const { x: a, y: l } = this.projectionDelta;
      ((i.transformOrigin = `${100 * a.origin}% ${100 * l.origin}% 0`),
        o.animationValues
          ? (i.opacity =
              o === this
                ? null !==
                    (n =
                      null !== (e = r.opacity) && void 0 !== e ? e : this.latestValues.opacity) &&
                  void 0 !== n
                  ? n
                  : 1
                : this.preserveOpacity
                  ? this.latestValues.opacity
                  : r.opacityExit)
          : (i.opacity =
              o === this
                ? void 0 !== r.opacity
                  ? r.opacity
                  : ''
                : void 0 !== r.opacityExit
                  ? r.opacityExit
                  : 0));
      for (const u in Gt) {
        if (void 0 === r[u]) continue;
        const { correct: t, applyTo: e } = Gt[u],
          n = 'none' === i.transform ? r[u] : t(r[u], o);
        if (e) {
          const t = e.length;
          for (let s = 0; s < t; s++) i[e[s]] = n;
        } else i[u] = n;
      }
      return (
        this.options.layoutId &&
          (i.pointerEvents = o === this ? ct(null == t ? void 0 : t.pointerEvents) || '' : 'none'),
        i
      );
    }
    clearSnapshot() {
      this.resumeFrom = this.snapshot = void 0;
    }
    resetTree() {
      (this.root.nodes.forEach(t => {
        var e;
        return null === (e = t.currentAnimation) || void 0 === e ? void 0 : e.stop();
      }),
        this.root.nodes.forEach(fr),
        this.root.sharedNodes.clear());
    }
  };
}
function cr(t) {
  t.updateLayout();
}
function hr(t) {
  var e;
  const n = (null === (e = t.resumeFrom) || void 0 === e ? void 0 : e.snapshot) || t.snapshot;
  if (t.isLead() && t.layout && n && t.hasListeners('didUpdate')) {
    const { layoutBox: e, measuredBox: i } = t.layout,
      { animationType: s } = t.options,
      o = n.source !== t.layout.source;
    'size' === s
      ? to(t => {
          const i = o ? n.measuredBox[t] : n.layoutBox[t],
            s = $s(i);
          ((i.min = e[t].min), (i.max = i.min + s));
        })
      : Dr(s, n.layoutBox, e) &&
        to(i => {
          const s = o ? n.measuredBox[i] : n.layoutBox[i],
            r = $s(e[i]);
          ((s.max = s.min + r),
            t.relativeTarget &&
              !t.currentAnimation &&
              ((t.isProjectionDirty = !0),
              (t.relativeTarget[i].max = t.relativeTarget[i].min + r)));
        });
    const r = {
      x: { translate: 0, scale: 1, origin: 0, originPoint: 0 },
      y: { translate: 0, scale: 1, origin: 0, originPoint: 0 },
    };
    Ys(r, e, n.layoutBox);
    const a = {
      x: { translate: 0, scale: 1, origin: 0, originPoint: 0 },
      y: { translate: 0, scale: 1, origin: 0, originPoint: 0 },
    };
    o ? Ys(a, t.applyTransform(i, !0), n.measuredBox) : Ys(a, e, n.layoutBox);
    const l = !Go(r);
    let u = !1;
    if (!t.resumeFrom) {
      const i = t.getClosestProjectingParent();
      if (i && !i.resumeFrom) {
        const { snapshot: s, layout: o } = i;
        if (s && o) {
          const r = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
          Hs(r, n.layoutBox, s.layoutBox);
          const a = { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
          (Hs(a, e, o.layoutBox),
            Jo(r, a) || (u = !0),
            i.options.layoutRoot &&
              ((t.relativeTarget = a), (t.relativeTargetOrigin = r), (t.relativeParent = i)));
        }
      }
    }
    t.notifyListeners('didUpdate', {
      layout: e,
      snapshot: n,
      delta: a,
      layoutDelta: r,
      hasLayoutChanged: l,
      hasRelativeTargetChanged: u,
    });
  } else if (t.isLead()) {
    const { onExitComplete: e } = t.options;
    e && e();
  }
  t.options.transition = void 0;
}
function dr(t) {
  (ir && nr.totalNodes++,
    t.parent &&
      (t.isProjecting() || (t.isProjectionDirty = t.parent.isProjectionDirty),
      t.isSharedProjectionDirty ||
        (t.isSharedProjectionDirty = Boolean(
          t.isProjectionDirty || t.parent.isProjectionDirty || t.parent.isSharedProjectionDirty
        )),
      t.isTransformDirty || (t.isTransformDirty = t.parent.isTransformDirty)));
}
function pr(t) {
  t.isProjectionDirty = t.isSharedProjectionDirty = t.isTransformDirty = !1;
}
function mr(t) {
  t.clearSnapshot();
}
function fr(t) {
  t.clearMeasurements();
}
function vr(t) {
  t.isLayoutDirty = !1;
}
function gr(t) {
  const { visualElement: e } = t.options;
  (e && e.getProps().onBeforeLayoutMeasure && e.notify('BeforeLayoutMeasure'), t.resetTransform());
}
function yr(t) {
  (t.finishAnimation(),
    (t.targetDelta = t.relativeTarget = t.target = void 0),
    (t.isProjectionDirty = !0));
}
function xr(t) {
  t.resolveTargetDelta();
}
function Pr(t) {
  t.calcProjection();
}
function Tr(t) {
  t.resetSkewAndRotation();
}
function wr(t) {
  t.removeLeadSnapshot();
}
function Sr(t, e, n) {
  ((t.translate = li(e.translate, 0, n)),
    (t.scale = li(e.scale, 1, n)),
    (t.origin = e.origin),
    (t.originPoint = e.originPoint));
}
function br(t, e, n, i) {
  ((t.min = li(e.min, n.min, i)), (t.max = li(e.max, n.max, i)));
}
function Ar(t) {
  return t.animationValues && void 0 !== t.animationValues.opacityExit;
}
const Er = { duration: 0.45, ease: [0.4, 0, 0.1, 1] },
  Vr = t =>
    'undefined' != typeof navigator &&
    navigator.userAgent &&
    navigator.userAgent.toLowerCase().includes(t),
  Cr = Vr('applewebkit/') && !Vr('chrome/') ? Math.round : v;
function Mr(t) {
  ((t.min = Cr(t.min)), (t.max = Cr(t.max)));
}
function Dr(t, e, n) {
  return (
    'position' === t ||
    ('preserve-aspect' === t && ((i = Qo(e)), (s = Qo(n)), (o = 0.2), !(Math.abs(i - s) <= o)))
  );
  var i, s, o;
}
function Rr(t) {
  var e;
  return t !== t.root && (null === (e = t.scroll) || void 0 === e ? void 0 : e.wasRoot);
}
const kr = ur({
    attachResizeListener: (t, e) => Rs(t, 'resize', e),
    measureScroll: () => ({
      x: document.documentElement.scrollLeft || document.body.scrollLeft,
      y: document.documentElement.scrollTop || document.body.scrollTop,
    }),
    checkIsScrollRoot: () => !0,
  }),
  Lr = { current: void 0 },
  jr = ur({
    measureScroll: t => ({ x: t.scrollLeft, y: t.scrollTop }),
    defaultParent: () => {
      if (!Lr.current) {
        const t = new kr({});
        (t.mount(window), t.setOptions({ layoutScroll: !0 }), (Lr.current = t));
      }
      return Lr.current;
    },
    resetTransform: (t, e) => {
      t.style.transform = void 0 !== e ? e : 'none';
    },
    checkIsScrollRoot: t => Boolean('fixed' === window.getComputedStyle(t).position),
  }),
  Fr = {
    pan: {
      Feature: class extends Cs {
        constructor() {
          (super(...arguments), (this.removePointerDownListener = v));
        }
        onPointerDown(t) {
          this.session = new Fs(t, this.createPanHandlers(), {
            transformPagePoint: this.node.getTransformPagePoint(),
            contextWindow: yo(this.node),
          });
        }
        createPanHandlers() {
          const {
            onPanSessionStart: t,
            onPanStart: e,
            onPan: n,
            onPanEnd: i,
          } = this.node.getProps();
          return {
            onSessionStart: wo(t),
            onStart: wo(e),
            onMove: n,
            onEnd: (t, e) => {
              (delete this.session, i && A.postRender(() => i(t, e)));
            },
          };
        }
        mount() {
          this.removePointerDownListener = Ls(this.node.current, 'pointerdown', t =>
            this.onPointerDown(t)
          );
        }
        update() {
          this.session && this.session.updateHandlers(this.createPanHandlers());
        }
        unmount() {
          (this.removePointerDownListener(), this.session && this.session.end());
        }
      },
    },
    drag: {
      Feature: class extends Cs {
        constructor(t) {
          (super(t),
            (this.removeGroupControls = v),
            (this.removeListeners = v),
            (this.controls = new Po(t)));
        }
        mount() {
          const { dragControls: t } = this.node.getProps();
          (t && (this.removeGroupControls = t.subscribe(this.controls)),
            (this.removeListeners = this.controls.addListeners() || v));
        }
        unmount() {
          (this.removeGroupControls(), this.removeListeners());
        }
      },
      ProjectionNode: jr,
      MeasureLayout: Co,
    },
  };
function Br(t, e, n) {
  const { props: i } = t;
  t.animationState && i.whileHover && t.animationState.setActive('whileHover', 'Start' === n);
  const s = i['onHover' + n];
  s && A.postRender(() => s(e, ks(e)));
}
function Or(t, e, n) {
  const { props: i } = t;
  t.animationState && i.whileTap && t.animationState.setActive('whileTap', 'Start' === n);
  const s = i['onTap' + ('End' === n ? '' : n)];
  s && A.postRender(() => s(e, ks(e)));
}
const Ir = new WeakMap(),
  Ur = new WeakMap(),
  Nr = t => {
    const e = Ir.get(t.target);
    e && e(t);
  },
  Wr = t => {
    t.forEach(Nr);
  };
function $r(t, e, n) {
  const i = (function ({ root: t, ...e }) {
    const n = t || document;
    Ur.has(n) || Ur.set(n, {});
    const i = Ur.get(n),
      s = JSON.stringify(e);
    return (i[s] || (i[s] = new IntersectionObserver(Wr, { root: t, ...e })), i[s]);
  })(e);
  return (
    Ir.set(t, n),
    i.observe(t),
    () => {
      (Ir.delete(t), i.unobserve(t));
    }
  );
}
const Kr = { some: 0, all: 1 };
const Yr = {
    inView: {
      Feature: class extends Cs {
        constructor() {
          (super(...arguments), (this.hasEnteredView = !1), (this.isInView = !1));
        }
        startObserver() {
          this.unmount();
          const { viewport: t = {} } = this.node.getProps(),
            { root: e, margin: n, amount: i = 'some', once: s } = t,
            o = {
              root: e ? e.current : void 0,
              rootMargin: n,
              threshold: 'number' == typeof i ? i : Kr[i],
            };
          return $r(this.node.current, o, t => {
            const { isIntersecting: e } = t;
            if (this.isInView === e) return;
            if (((this.isInView = e), s && !e && this.hasEnteredView)) return;
            (e && (this.hasEnteredView = !0),
              this.node.animationState && this.node.animationState.setActive('whileInView', e));
            const { onViewportEnter: n, onViewportLeave: i } = this.node.getProps(),
              o = e ? n : i;
            o && o(t);
          });
        }
        mount() {
          this.startObserver();
        }
        update() {
          if ('undefined' == typeof IntersectionObserver) return;
          const { props: t, prevProps: e } = this.node;
          ['amount', 'margin', 'root'].some(
            (function ({ viewport: t = {} }, { viewport: e = {} } = {}) {
              return n => t[n] !== e[n];
            })(t, e)
          ) && this.startObserver();
        }
        unmount() {}
      },
    },
    tap: {
      Feature: class extends Cs {
        mount() {
          const { current: t } = this.node;
          t &&
            (this.unmount = Ie(
              t,
              t => (
                Or(this.node, t, 'Start'),
                (t, { success: e }) => Or(this.node, t, e ? 'End' : 'Cancel')
              ),
              { useGlobalTarget: this.node.props.globalTapTarget }
            ));
        }
        unmount() {}
      },
    },
    focus: {
      Feature: class extends Cs {
        constructor() {
          (super(...arguments), (this.isActive = !1));
        }
        onFocus() {
          let t = !1;
          try {
            t = this.node.current.matches(':focus-visible');
          } catch (e) {
            t = !0;
          }
          t &&
            this.node.animationState &&
            (this.node.animationState.setActive('whileFocus', !0), (this.isActive = !0));
        }
        onBlur() {
          this.isActive &&
            this.node.animationState &&
            (this.node.animationState.setActive('whileFocus', !1), (this.isActive = !1));
        }
        mount() {
          this.unmount = vi(
            Rs(this.node.current, 'focus', () => this.onFocus()),
            Rs(this.node.current, 'blur', () => this.onBlur())
          );
        }
        unmount() {}
      },
    },
    hover: {
      Feature: class extends Cs {
        mount() {
          const { current: t } = this.node;
          t &&
            (this.unmount = (function (t, e, n = {}) {
              const [i, s, o] = Me(t, n),
                r = De(t => {
                  const { target: n } = t,
                    i = e(t);
                  if ('function' != typeof i || !n) return;
                  const o = De(t => {
                    (i(t), n.removeEventListener('pointerleave', o));
                  });
                  n.addEventListener('pointerleave', o, s);
                });
              return (
                i.forEach(t => {
                  t.addEventListener('pointerenter', r, s);
                }),
                o
              );
            })(t, t => (Br(this.node, t, 'Start'), t => Br(this.node, t, 'End'))));
        }
        unmount() {}
      },
    },
  },
  zr = { layout: { ProjectionNode: jr, MeasureLayout: Co } },
  Xr = { current: null },
  Hr = { current: !1 };
const _r = [...ei, Tn, Dn],
  Gr = new WeakMap();
const qr = [
  'AnimationStart',
  'AnimationComplete',
  'Update',
  'BeforeLayoutMeasure',
  'LayoutMeasure',
  'LayoutAnimationStart',
  'LayoutAnimationComplete',
];
class Zr {
  scrapeMotionValuesFromProps(t, e, n) {
    return {};
  }
  constructor(
    {
      parent: t,
      props: e,
      presenceContext: n,
      reducedMotionConfig: i,
      blockInitialAnimation: s,
      visualState: o,
    },
    r = {}
  ) {
    ((this.current = null),
      (this.children = new Set()),
      (this.isVariantNode = !1),
      (this.isControllingVariants = !1),
      (this.shouldReduceMotion = null),
      (this.values = new Map()),
      (this.KeyframeResolver = qn),
      (this.features = {}),
      (this.valueSubscriptions = new Map()),
      (this.prevMotionValues = {}),
      (this.events = {}),
      (this.propEventSubscriptions = {}),
      (this.notifyUpdate = () => this.notify('Update', this.latestValues)),
      (this.render = () => {
        this.current &&
          (this.triggerBuild(),
          this.renderInstance(this.current, this.renderState, this.props.style, this.projection));
      }),
      (this.renderScheduledAt = 0),
      (this.scheduleRender = () => {
        const t = $e.now();
        this.renderScheduledAt < t && ((this.renderScheduledAt = t), A.render(this.render, !1, !0));
      }));
    const { latestValues: a, renderState: l, onUpdate: u } = o;
    ((this.onUpdate = u),
      (this.latestValues = a),
      (this.baseTarget = { ...a }),
      (this.initialValues = e.initial ? { ...a } : {}),
      (this.renderState = l),
      (this.parent = t),
      (this.props = e),
      (this.presenceContext = n),
      (this.depth = t ? t.depth + 1 : 0),
      (this.reducedMotionConfig = i),
      (this.options = r),
      (this.blockInitialAnimation = Boolean(s)),
      (this.isControllingVariants = $(e)),
      (this.isVariantNode = K(e)),
      this.isVariantNode && (this.variantChildren = new Set()),
      (this.manuallyAnimateOnMount = Boolean(t && t.current)));
    const { willChange: c, ...h } = this.scrapeMotionValuesFromProps(e, {}, this);
    for (const d in h) {
      const t = h[d];
      void 0 !== a[d] && ut(t) && t.set(a[d], !1);
    }
  }
  mount(t) {
    ((this.current = t),
      Gr.set(t, this),
      this.projection && !this.projection.instance && this.projection.mount(t),
      this.parent &&
        this.isVariantNode &&
        !this.isControllingVariants &&
        (this.removeFromVariantTree = this.parent.addVariantChild(this)),
      this.values.forEach((t, e) => this.bindToMotionValue(e, t)),
      Hr.current ||
        (function () {
          if (((Hr.current = !0), m))
            if (window.matchMedia) {
              const t = window.matchMedia('(prefers-reduced-motion)'),
                e = () => (Xr.current = t.matches);
              (t.addListener(e), e());
            } else Xr.current = !1;
        })(),
      (this.shouldReduceMotion =
        'never' !== this.reducedMotionConfig &&
        ('always' === this.reducedMotionConfig || Xr.current)),
      this.parent && this.parent.children.add(this),
      this.update(this.props, this.presenceContext));
  }
  unmount() {
    (Gr.delete(this.current),
      this.projection && this.projection.unmount(),
      E(this.notifyUpdate),
      E(this.render),
      this.valueSubscriptions.forEach(t => t()),
      this.valueSubscriptions.clear(),
      this.removeFromVariantTree && this.removeFromVariantTree(),
      this.parent && this.parent.children.delete(this));
    for (const t in this.events) this.events[t].clear();
    for (const t in this.features) {
      const e = this.features[t];
      e && (e.unmount(), (e.isMounted = !1));
    }
    this.current = null;
  }
  bindToMotionValue(t, e) {
    this.valueSubscriptions.has(t) && this.valueSubscriptions.get(t)();
    const n = mt.has(t),
      i = e.on('change', e => {
        ((this.latestValues[t] = e),
          this.props.onUpdate && A.preRender(this.notifyUpdate),
          n && this.projection && (this.projection.isTransformDirty = !0));
      }),
      s = e.on('renderRequest', this.scheduleRender);
    let o;
    (window.MotionCheckAppearSync && (o = window.MotionCheckAppearSync(this, t, e)),
      this.valueSubscriptions.set(t, () => {
        (i(), s(), o && o(), e.owner && e.stop());
      }));
  }
  sortNodePosition(t) {
    return this.current && this.sortInstanceNodePosition && this.type === t.type
      ? this.sortInstanceNodePosition(this.current, t.current)
      : 0;
  }
  updateFeatures() {
    let t = 'animation';
    for (t in R) {
      const e = R[t];
      if (!e) continue;
      const { isEnabled: n, Feature: i } = e;
      if (
        (!this.features[t] && i && n(this.props) && (this.features[t] = new i(this)),
        this.features[t])
      ) {
        const e = this.features[t];
        e.isMounted ? e.update() : (e.mount(), (e.isMounted = !0));
      }
    }
  }
  triggerBuild() {
    this.build(this.renderState, this.latestValues, this.props);
  }
  measureViewportBox() {
    return this.current
      ? this.measureInstanceViewportBox(this.current, this.props)
      : { x: { min: 0, max: 0 }, y: { min: 0, max: 0 } };
  }
  getStaticValue(t) {
    return this.latestValues[t];
  }
  setStaticValue(t, e) {
    this.latestValues[t] = e;
  }
  update(t, e) {
    ((t.transformTemplate || this.props.transformTemplate) && this.scheduleRender(),
      (this.prevProps = this.props),
      (this.props = t),
      (this.prevPresenceContext = this.presenceContext),
      (this.presenceContext = e));
    for (let n = 0; n < qr.length; n++) {
      const e = qr[n];
      this.propEventSubscriptions[e] &&
        (this.propEventSubscriptions[e](), delete this.propEventSubscriptions[e]);
      const i = t['on' + e];
      i && (this.propEventSubscriptions[e] = this.on(e, i));
    }
    ((this.prevMotionValues = (function (t, e, n) {
      for (const i in e) {
        const s = e[i],
          o = n[i];
        if (ut(s)) t.addValue(i, s);
        else if (ut(o)) t.addValue(i, _e(s, { owner: t }));
        else if (o !== s)
          if (t.hasValue(i)) {
            const e = t.getValue(i);
            !0 === e.liveStyle ? e.jump(s) : e.hasAnimated || e.set(s);
          } else {
            const e = t.getStaticValue(i);
            t.addValue(i, _e(void 0 !== e ? e : s, { owner: t }));
          }
      }
      for (const i in n) void 0 === e[i] && t.removeValue(i);
      return e;
    })(this, this.scrapeMotionValuesFromProps(t, this.prevProps, this), this.prevMotionValues)),
      this.handleChildMotionValue && this.handleChildMotionValue(),
      this.onUpdate && this.onUpdate(this));
  }
  getProps() {
    return this.props;
  }
  getVariant(t) {
    return this.props.variants ? this.props.variants[t] : void 0;
  }
  getDefaultTransition() {
    return this.props.transition;
  }
  getTransformPagePoint() {
    return this.props.transformPagePoint;
  }
  getClosestVariantNode() {
    return this.isVariantNode ? this : this.parent ? this.parent.getClosestVariantNode() : void 0;
  }
  addVariantChild(t) {
    const e = this.getClosestVariantNode();
    if (e)
      return (e.variantChildren && e.variantChildren.add(t), () => e.variantChildren.delete(t));
  }
  addValue(t, e) {
    const n = this.values.get(t);
    e !== n &&
      (n && this.removeValue(t),
      this.bindToMotionValue(t, e),
      this.values.set(t, e),
      (this.latestValues[t] = e.get()));
  }
  removeValue(t) {
    this.values.delete(t);
    const e = this.valueSubscriptions.get(t);
    (e && (e(), this.valueSubscriptions.delete(t)),
      delete this.latestValues[t],
      this.removeValueFromRenderState(t, this.renderState));
  }
  hasValue(t) {
    return this.values.has(t);
  }
  getValue(t, e) {
    if (this.props.values && this.props.values[t]) return this.props.values[t];
    let n = this.values.get(t);
    return (
      void 0 === n &&
        void 0 !== e &&
        ((n = _e(null === e ? void 0 : e, { owner: this })), this.addValue(t, n)),
      n
    );
  }
  readValue(t, e) {
    var n;
    let i =
      void 0 === this.latestValues[t] && this.current
        ? null !== (n = this.getBaseTargetFromProps(this.props, t)) && void 0 !== n
          ? n
          : this.readValueFromInstance(this.current, t, this.options)
        : this.latestValues[t];
    var s;
    return (
      null != i &&
        ('string' == typeof i && (Zn(i) || cn(i))
          ? (i = parseFloat(i))
          : ((s = i), !_r.find(ti(s)) && Dn.test(e) && (i = On(t, e))),
        this.setBaseTarget(t, ut(i) ? i.get() : i)),
      ut(i) ? i.get() : i
    );
  }
  setBaseTarget(t, e) {
    this.baseTarget[t] = e;
  }
  getBaseTarget(t) {
    var e;
    const { initial: n } = this.props;
    let i;
    if ('string' == typeof n || 'object' == typeof n) {
      const s = rt(
        this.props,
        n,
        null === (e = this.presenceContext) || void 0 === e ? void 0 : e.custom
      );
      s && (i = s[t]);
    }
    if (n && void 0 !== i) return i;
    const s = this.getBaseTargetFromProps(this.props, t);
    return void 0 === s || ut(s)
      ? void 0 !== this.initialValues[t] && void 0 === i
        ? void 0
        : this.baseTarget[t]
      : s;
  }
  on(t, e) {
    return (this.events[t] || (this.events[t] = new ze()), this.events[t].add(e));
  }
  notify(t, ...e) {
    this.events[t] && this.events[t].notify(...e);
  }
}
class Jr extends Zr {
  constructor() {
    (super(...arguments), (this.KeyframeResolver = ii));
  }
  sortInstanceNodePosition(t, e) {
    return 2 & t.compareDocumentPosition(e) ? 1 : -1;
  }
  getBaseTargetFromProps(t, e) {
    return t.style ? t.style[e] : void 0;
  }
  removeValueFromRenderState(t, { vars: e, style: n }) {
    (delete e[t], delete n[t]);
  }
  handleChildMotionValue() {
    this.childSubscription && (this.childSubscription(), delete this.childSubscription);
    const { children: t } = this.props;
    ut(t) &&
      (this.childSubscription = t.on('change', t => {
        this.current && (this.current.textContent = `${t}`);
      }));
  }
}
class Qr extends Jr {
  constructor() {
    (super(...arguments), (this.type = 'html'), (this.renderInstance = Xt));
  }
  readValueFromInstance(t, e) {
    if (mt.has(e)) {
      const t = Bn(e);
      return (t && t.default) || 0;
    }
    {
      const i = ((n = t), window.getComputedStyle(n)),
        s = (vt(e) ? i.getPropertyValue(e) : i[e]) || 0;
      return 'string' == typeof s ? s.trim() : s;
    }
    var n;
  }
  measureInstanceViewportBox(t, { transformPagePoint: e }) {
    return go(t, e);
  }
  build(t, e, n) {
    It(t, e, n.transformTemplate);
  }
  scrapeMotionValuesFromProps(t, e, n) {
    return Zt(t, e, n);
  }
}
class ta extends Jr {
  constructor() {
    (super(...arguments),
      (this.type = 'svg'),
      (this.isSVGTag = !1),
      (this.measureInstanceViewportBox = Qs));
  }
  getBaseTargetFromProps(t, e) {
    return t[e];
  }
  readValueFromInstance(t, e) {
    if (mt.has(e)) {
      const t = Bn(e);
      return (t && t.default) || 0;
    }
    return ((e = Ht.has(e) ? e : G(e)), t.getAttribute(e));
  }
  scrapeMotionValuesFromProps(t, e, n) {
    return Jt(t, e, n);
  }
  build(t, e, n) {
    $t(t, e, this.isSVGTag, n.transformTemplate);
  }
  renderInstance(t, e, n, i) {
    _t(t, e, 0, i);
  }
  mount(t) {
    ((this.isSVGTag = zt(t.tagName)), super.mount(t));
  }
}
const ea = B(
  ae({ ...Ds, ...Yr, ...Fr, ...zr }, (e, n) =>
    st(e) ? new ta(n) : new Qr(n, { allowProjection: e !== t.Fragment })
  )
);
export { c as j, ea as m };
//# sourceMappingURL=animation-CL1fW55q.js.map
