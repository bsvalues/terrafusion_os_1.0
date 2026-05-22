import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import CompsPage from './pages/CompsPage';
import CostSchedulesPage from './pages/CostSchedulesPage';
import LevyPage from './pages/LevyPage';
import RatioStudyPage from './pages/RatioStudyPage';
import RegressionPage from './pages/RegressionPage';
import SaleQualificationPage from './pages/SaleQualificationPage';
import CurrentUsePage from './pages/CurrentUsePage';
import CurrentUseInterestPage from './pages/CurrentUseInterestPage';
import CurrentUseRemovalsPage from './pages/CurrentUseRemovalsPage';
import './App.css';

const NAV_ITEMS = [
  { path: '/ratio-study',        label: 'Ratio Study' },
  { path: '/comps',              label: 'Comps' },
  { path: '/sale-qualification', label: 'Sale Qualification' },
  { path: '/regression',         label: 'Regression' },
  { path: '/cost-schedules',     label: 'Cost Schedules' },
  { path: '/levy',               label: 'Levy' },
  { path: '/current-use',        label: 'Current Use' },
] as const;

function NavBar() {
  const { pathname } = useLocation();
  return (
    <nav className="tf-nav">
      <span className="tf-nav-brand">TerraForge</span>
      <ul className="tf-nav-links">
        {NAV_ITEMS.map(({ path, label }) => (
          <li key={path}>
            <Link
              to={path}
              className={pathname.startsWith(path) ? 'tf-nav-link tf-nav-link--active' : 'tf-nav-link'}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="tf-root">
        <NavBar />
        <main className="tf-main">
          <Routes>
            <Route index element={<Navigate to="/ratio-study" replace />} />
            <Route path="/ratio-study"        element={<RatioStudyPage />} />
            <Route path="/comps"              element={<CompsPage />} />
            <Route path="/sale-qualification" element={<SaleQualificationPage />} />
            <Route path="/regression"         element={<RegressionPage />} />
            <Route path="/cost-schedules"     element={<CostSchedulesPage />} />
            <Route path="/levy"               element={<LevyPage />} />
            <Route path="/current-use"        element={<CurrentUsePage />} />
            <Route path="/current-use/interest" element={<CurrentUseInterestPage />} />
            <Route path="/current-use/removals" element={<CurrentUseRemovalsPage />} />
          </Routes>
        </main>
        <footer className="tf-footer">
          TerraFusion · TerraForge · Benton County WA · {new Date().getFullYear()}
        </footer>
      </div>
    </BrowserRouter>
  );
}
