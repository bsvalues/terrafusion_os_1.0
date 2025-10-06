# 🏛️ TerraFusion Portal Migration Architecture

**Date:** October 2025  
**Status:** Architecture Design  
**Objective:** Migrate 4 standalone HTML portals to React apps using Terra-UI component library

---

## 📋 Portals to Migrate

### 1. **Education Management Portal**
- **File:** `education-management-portal.html`
- **Features:** Student enrollment, staff management, curriculum tracking, budget oversight
- **Components Needed:** TerraTable (student lists), TerraCard (department stats), TerraModal (forms)

### 2. **Emergency Management Portal**
- **File:** `emergency-management-portal.html`
- **Features:** Incident tracking, resource allocation, real-time alerts, response coordination
- **Components Needed:** TerraMetric (active incidents), TerraBadge (alert levels), TerraLoader (live updates)

### 3. **Smart Transportation Portal**
- **File:** `smart-transportation-portal.html`
- **Features:** Traffic monitoring, route optimization, infrastructure management, public transit
- **Components Needed:** TerraGrid (vehicle fleet), TerraTable (route schedules), WebGLTranscendence (map background)

### 4. **Parks & Recreation Portal**
- **File:** `parks-recreation-portal.html`
- **Features:** Facility bookings, program registration, maintenance scheduling, event management
- **Components Needed:** TerraCard (facilities), TerraTable (bookings), TerraInput (search/filter)

---

## 🏗️ Unified React Architecture

### **Directory Structure**
```
terrafusion-cos/
├── frontend_engine/              # Core engine (already built)
│   ├── src/
│   │   ├── components/           # Terra-UI component library (11 components)
│   │   ├── theme/                # ThemeProvider
│   │   └── styles/               # Global CSS
│   ├── index.jsx                 # Entry point
│   └── App.jsx                   # Main app router
│
└── portals/                      # NEW - Portal applications
    ├── shared/                   # Shared portal components
    │   ├── PortalLayout.jsx      # Common layout wrapper
    │   ├── PortalNav.jsx         # Navigation sidebar
    │   ├── PortalHeader.jsx      # Header with breadcrumbs
    │   └── PortalFooter.jsx      # Footer component
    │
    ├── education/                # Education Management Portal
    │   ├── index.jsx             # Portal entry point
    │   ├── routes.jsx            # Portal-specific routes
    │   ├── pages/
    │   │   ├── DashboardPage.jsx
    │   │   ├── StudentsPage.jsx
    │   │   ├── StaffPage.jsx
    │   │   └── BudgetPage.jsx
    │   └── components/           # Portal-specific components
    │       ├── StudentTable.jsx
    │       └── EnrollmentForm.jsx
    │
    ├── emergency/                # Emergency Management Portal
    │   ├── index.jsx
    │   ├── routes.jsx
    │   ├── pages/
    │   │   ├── DashboardPage.jsx
    │   │   ├── IncidentsPage.jsx
    │   │   └── ResourcesPage.jsx
    │   └── components/
    │       ├── IncidentMap.jsx
    │       └── AlertWidget.jsx
    │
    ├── transportation/           # Smart Transportation Portal
    │   ├── index.jsx
    │   ├── routes.jsx
    │   ├── pages/
    │   │   ├── DashboardPage.jsx
    │   │   ├── FleetPage.jsx
    │   │   └── RoutesPage.jsx
    │   └── components/
    │       ├── VehicleTracker.jsx
    │       └── RouteOptimizer.jsx
    │
    └── parks/                    # Parks & Recreation Portal
        ├── index.jsx
        ├── routes.jsx
        ├── pages/
        │   ├── DashboardPage.jsx
        │   ├── FacilitiesPage.jsx
        │   └── BookingsPage.jsx
        └── components/
            ├── FacilityCard.jsx
            └── BookingCalendar.jsx
```

---

## 🎯 Shared Components

### **PortalLayout.jsx**
```jsx
/**
 * Shared layout wrapper for all portals
 * Provides consistent navigation, header, and footer
 */
import React from 'react';
import { ThemeProvider } from '../../frontend_engine/src/theme/ThemeProvider';
import PortalNav from './PortalNav';
import PortalHeader from './PortalHeader';
import PortalFooter from './PortalFooter';

const PortalLayout = ({ children, title, portal }) => {
  return (
    <ThemeProvider>
      <div className="portal-layout">
        <PortalNav activePortal={portal} />
        <div className="portal-content">
          <PortalHeader title={title} />
          <main className="portal-main">
            {children}
          </main>
          <PortalFooter />
        </div>
      </div>
    </ThemeProvider>
  );
};

export default PortalLayout;
```

### **PortalNav.jsx**
```jsx
/**
 * Unified navigation sidebar for all portals
 * Uses TerraButton for navigation items
 */
import React from 'react';
import { TerraButton } from '../../frontend_engine/src/components';

const PortalNav = ({ activePortal }) => {
  const portals = [
    { id: 'education', label: 'Education', icon: '🎓', path: '/education' },
    { id: 'emergency', label: 'Emergency', icon: '🚨', path: '/emergency' },
    { id: 'transportation', label: 'Transportation', icon: '🚌', path: '/transportation' },
    { id: 'parks', label: 'Parks & Rec', icon: '🌳', path: '/parks' },
  ];

  return (
    <nav className="portal-nav">
      <div className="portal-nav-logo">
        TerraFusion OS
      </div>
      <div className="portal-nav-items">
        {portals.map(portal => (
          <TerraButton
            key={portal.id}
            variant={activePortal === portal.id ? 'primary' : 'ghost'}
            onClick={() => window.location.href = portal.path}
            icon={portal.icon}
          >
            {portal.label}
          </TerraButton>
        ))}
      </div>
    </nav>
  );
};

export default PortalNav;
```

---

## 🔄 Routing Strategy

### **App-Level Routing (React Router v6)**
```jsx
// terrafusion-cos/frontend_engine/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Portal imports
import EducationPortal from '../portals/education';
import EmergencyPortal from '../portals/emergency';
import TransportationPortal from '../portals/transportation';
import ParksPortal from '../portals/parks';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Portal routes */}
        <Route path="/education/*" element={<EducationPortal />} />
        <Route path="/emergency/*" element={<EmergencyPortal />} />
        <Route path="/transportation/*" element={<TransportationPortal />} />
        <Route path="/parks/*" element={<ParksPortal />} />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/education" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### **Portal-Level Routing**
```jsx
// terrafusion-cos/portals/education/routes.jsx
import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StaffPage from './pages/StaffPage';

export default function EducationRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/students" element={<StudentsPage />} />
      <Route path="/staff" element={<StaffPage />} />
      <Route path="/budget" element={<BudgetPage />} />
    </Routes>
  );
}
```

---

## 📦 Data Flow Architecture

### **State Management (React Context API)**
```jsx
// terrafusion-cos/portals/shared/PortalContext.jsx
import React, { createContext, useContext, useState } from 'react';

const PortalContext = createContext();

export const usePortal = () => useContext(PortalContext);

export const PortalProvider = ({ children, portalId }) => {
  const [userData, setUserData] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchData = async (endpoint) => {
    const response = await fetch(`/api/${portalId}/${endpoint}`);
    return response.json();
  };

  const value = {
    portalId,
    userData,
    permissions,
    notifications,
    fetchData,
    setUserData,
  };

  return (
    <PortalContext.Provider value={value}>
      {children}
    </PortalContext.Provider>
  );
};
```

### **API Integration**
```jsx
// terrafusion-cos/portals/shared/api.js
const API_BASE = process.env.REACT_APP_API_URL || '/api';

export const api = {
  // Education endpoints
  education: {
    getStudents: () => fetch(`${API_BASE}/education/students`).then(r => r.json()),
    getStaff: () => fetch(`${API_BASE}/education/staff`).then(r => r.json()),
    enrollStudent: (data) => fetch(`${API_BASE}/education/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  },
  
  // Emergency endpoints
  emergency: {
    getIncidents: () => fetch(`${API_BASE}/emergency/incidents`).then(r => r.json()),
    createAlert: (alert) => fetch(`${API_BASE}/emergency/alerts`, {
      method: 'POST',
      body: JSON.stringify(alert)
    })
  },
  
  // Add other portals...
};
```

---

## 🎨 Example Portal Page

### **Education Dashboard Page**
```jsx
// terrafusion-cos/portals/education/pages/DashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { TerraMetric, TerraCard, TerraGrid } from '../../../frontend_engine/src/components';
import { usePortal } from '../../shared/PortalContext';
import PortalLayout from '../../shared/PortalLayout';

const DashboardPage = () => {
  const { fetchData } = usePortal();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchData('dashboard/stats').then(setStats);
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <PortalLayout title="Education Dashboard" portal="education">
      <TerraGrid columns={4} gap="lg">
        <TerraMetric
          value={stats.totalStudents}
          label="Total Students"
          subtitle="Current enrollment"
          trend="up"
          icon="👨‍🎓"
        />
        <TerraMetric
          value={stats.staffCount}
          label="Staff Members"
          subtitle="Active personnel"
          trend="neutral"
          icon="👩‍🏫"
        />
        <TerraMetric
          value={`${stats.attendanceRate}%`}
          label="Attendance Rate"
          subtitle="Last 30 days"
          trend="up"
          icon="📊"
        />
        <TerraMetric
          value={`$${stats.budget.toLocaleString()}`}
          label="Annual Budget"
          subtitle="FY 2025"
          trend="neutral"
          icon="💰"
        />
      </TerraGrid>

      <TerraCard variant="elevated" style={{ marginTop: '2rem' }}>
        <h2>Recent Activity</h2>
        {/* Activity list here */}
      </TerraCard>
    </PortalLayout>
  );
};

export default DashboardPage;
```

---

## 🔨 Migration Steps

### **Phase 1: Setup (Week 1)**
1. Install React Router: `npm install react-router-dom`
2. Create `portals/` directory structure
3. Build shared components (PortalLayout, PortalNav, PortalHeader)
4. Create PortalContext for state management

### **Phase 2: Education Portal (Week 2)**
1. Extract data/structure from `education-management-portal.html`
2. Create pages: Dashboard, Students, Staff, Budget
3. Build portal-specific components (StudentTable, EnrollmentForm)
4. Connect to API endpoints
5. Test and validate

### **Phase 3: Emergency Portal (Week 3)**
1. Extract data/structure from `emergency-management-portal.html`
2. Create pages: Dashboard, Incidents, Resources, Alerts
3. Build IncidentMap and AlertWidget components
4. Implement real-time updates (WebSocket)
5. Test and validate

### **Phase 4: Transportation Portal (Week 4)**
1. Extract data/structure from `smart-transportation-portal.html`
2. Create pages: Dashboard, Fleet, Routes, Infrastructure
3. Build VehicleTracker and RouteOptimizer
4. Integrate WebGLTranscendence for map background
5. Test and validate

### **Phase 5: Parks Portal (Week 5)**
1. Extract data/structure from `parks-recreation-portal.html`
2. Create pages: Dashboard, Facilities, Bookings, Events
3. Build FacilityCard and BookingCalendar
4. Implement booking system
5. Test and validate

### **Phase 6: Integration & Optimization (Week 6)**
1. Unified navigation testing
2. Performance optimization (lazy loading)
3. Bundle size analysis
4. Accessibility audit (WCAG 2.1 AA)
5. Production deployment

---

## 📊 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Initial Load** | < 2 seconds | Lighthouse Performance Score |
| **Route Transition** | < 200ms | React DevTools Profiler |
| **Bundle Size** | < 500 KB (main) | webpack-bundle-analyzer |
| **Portal Bundles** | < 100 KB each | Code splitting per portal |
| **API Response** | < 300ms | Network tab timing |
| **Accessibility** | AA (WCAG 2.1) | axe DevTools audit |

---

## 🔐 Security Considerations

### **Authentication**
- JWT tokens in httpOnly cookies
- Token refresh on expiration
- Role-based access control (RBAC) per portal

### **API Security**
- CORS configuration for production domain
- Rate limiting (100 requests/minute per user)
- Input validation and sanitization

### **Data Protection**
- Encrypt sensitive data at rest
- HTTPS only in production
- Audit logging for all portal actions

---

## 🚀 Next Steps

1. **Install Dependencies:**
   ```bash
   cd terrafusion-cos/frontend_engine
   npm install react-router-dom axios
   ```

2. **Create Portal Structure:**
   ```bash
   mkdir -p portals/{shared,education,emergency,transportation,parks}
   ```

3. **Build Shared Components:**
   - Start with PortalLayout.jsx
   - Create PortalNav.jsx with Terra-UI buttons
   - Build PortalContext for state management

4. **Begin Education Portal:**
   - Extract HTML structure
   - Map to React components
   - Connect API endpoints

---

**Status:** Architecture Complete ✅  
**Ready for Implementation:** Yes  
**Estimated Timeline:** 6 weeks  
**Next Action:** Install dependencies and create portal structure

---

"Government. Transcended." 🏛️⚡
