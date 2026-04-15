/**
 * SaleFilterBar — committed-on-apply filter bar for SalesForge queue.
 * Filters are only applied when user clicks "Apply filters" (not live).
 */

import { useSalesForgeStore } from '../salesForgeStore';

export function SaleFilterBar() {
  const filterForm       = useSalesForgeStore((s) => s.filterForm);
  const committedFilters = useSalesForgeStore((s) => s.committedFilters);
  const setFilterForm    = useSalesForgeStore((s) => s.setFilterForm);
  const applyFilters     = useSalesForgeStore((s) => s.applyFilters);
  const clearFilters     = useSalesForgeStore((s) => s.clearFilters);

  const hasFilters = Object.values(committedFilters).some((v) => v != null);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') applyFilters();
  };

  return (
    <div className="sf-filterbar">
      <div className="sf-filter-row">
        <label className="sf-filter-group">
          <span className="sf-filter-label">Neighborhood</span>
          <input
            className="sf-filter-input"
            type="text"
            placeholder="e.g. 1A"
            value={filterForm.hood}
            onChange={(e) => setFilterForm({ hood: e.target.value })}
            onKeyDown={handleKey}
          />
        </label>

        <label className="sf-filter-group">
          <span className="sf-filter-label">Property type</span>
          <input
            className="sf-filter-input"
            type="text"
            placeholder="e.g. residential"
            value={filterForm.propertyType}
            onChange={(e) => setFilterForm({ propertyType: e.target.value })}
            onKeyDown={handleKey}
          />
        </label>

        <label className="sf-filter-group sf-filter-group--narrow">
          <span className="sf-filter-label">Sale date from</span>
          <input
            className="sf-filter-input"
            type="date"
            value={filterForm.saleDateFrom}
            onChange={(e) => setFilterForm({ saleDateFrom: e.target.value })}
          />
        </label>

        <label className="sf-filter-group sf-filter-group--narrow">
          <span className="sf-filter-label">Sale date to</span>
          <input
            className="sf-filter-input"
            type="date"
            value={filterForm.saleDateTo}
            onChange={(e) => setFilterForm({ saleDateTo: e.target.value })}
          />
        </label>

        <label className="sf-filter-group sf-filter-group--narrow">
          <span className="sf-filter-label">Min price ($)</span>
          <input
            className="sf-filter-input"
            type="number"
            placeholder="0"
            min={0}
            value={filterForm.minPrice}
            onChange={(e) => setFilterForm({ minPrice: e.target.value })}
          />
        </label>

        <label className="sf-filter-group sf-filter-group--narrow">
          <span className="sf-filter-label">Max price ($)</span>
          <input
            className="sf-filter-input"
            type="number"
            placeholder="any"
            min={0}
            value={filterForm.maxPrice}
            onChange={(e) => setFilterForm({ maxPrice: e.target.value })}
          />
        </label>

        <div className="sf-filter-actions">
          <button type="button" className="sf-btn sf-btn--apply" onClick={applyFilters}>
            Apply filters
          </button>
          {hasFilters && (
            <button type="button" className="sf-btn sf-btn--clear" onClick={clearFilters}>
              Clear
            </button>
          )}
          {hasFilters && (
            <span style={{ fontSize: '0.75rem', color: 'var(--sf-warn)' }}>Filters active</span>
          )}
        </div>
      </div>
    </div>
  );
}
