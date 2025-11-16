import React from 'react';
import { utils, writeFile } from 'xlsx';

export function DashboardExportButton({ plugins }) {
  const handleExport = (type) => {
    let data = plugins.map(({ name, version, healthy, launchCount, errors, onboarding, tags, categories, owner, uptime }) => ({
      name, version, healthy, launchCount, errors: errors.join('; '), onboarding: onboarding.join('; '), tags: tags.join(', '), categories: categories.join(', '), owner, uptime
    }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Plugins');
    if (type === 'csv') writeFile(wb, 'terrafusion-plugins.csv', { bookType: 'csv' });
    else if (type === 'xlsx') writeFile(wb, 'terrafusion-plugins.xlsx', { bookType: 'xlsx' });
    else if (type === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'terrafusion-plugins.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  };
  return (
    <div className="tf-export-dropdown"><>

      <button className="tf-btn tf-btn-export" aria-haspopup="listbox">Export ▼</button>
      <div
</>
className="tf-export-menu"><>

        <button onClick={()=>handleExport('csv')}>Export as CSV</button>
        <button
</>
onClick={()=>handleExport('xlsx')}>Export as Excel</button>
        <button onClick={()=>handleExport('json')}>Export as JSON</button>
      </div>
    </div>
  );
}
