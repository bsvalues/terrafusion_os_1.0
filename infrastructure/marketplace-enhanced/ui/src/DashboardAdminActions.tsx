import React from 'react';

export function DashboardAdminActions({ plugin, onAction }) {
  const [show, setShow] = React.useState(false);
  const [confirm, setConfirm] = React.useState(null);

  const handleAction = (action) => {
    setConfirm(action);
  };
  const handleConfirm = () => {
    onAction(confirm, plugin);
    setConfirm(null);
    setShow(false);
  };
  return (
    <div className="tf-admin-actions">
      <button
        className="tf-btn tf-btn-admin"
        onClick={()=>setShow(!show)}
        aria-haspopup="listbox"
        aria-expanded={show}
        aria-controls="tf-admin-menu-list"
        aria-label="Open admin actions menu"
      >
        Admin ▼
      </button>
      {show && (
        <ul
          className="tf-admin-menu"
          role="listbox"
          aria-label="Plugin admin actions"
          id="tf-admin-menu-list"
        >
          <li><button onClick={()=>handleAction('disable')} aria-label={`Disable ${plugin.name}`}>Disable</button></li>
          <li><button onClick={()=>handleAction('restart')} aria-label={`Restart ${plugin.name}`}>Restart</button></li>
          <li><button onClick={()=>handleAction('promote')} aria-label={`Promote ${plugin.name}`}>Promote</button></li>
          <li><button onClick={()=>handleAction('audit')} aria-label={`View audit log for ${plugin.name}`}>View Audit Log</button></li>
        </ul>
      )}
      {confirm && (
        <div className="tf-confirm-modal" role="dialog" aria-modal="true" aria-label="Confirm admin action">
          <p>Are you sure you want to <strong>{confirm}</strong> <strong>{plugin.name}</strong>?</p><>

          <button className="tf-btn tf-btn-confirm" onClick={handleConfirm} aria-label={`Confirm ${confirm} for ${plugin.name}`}>Yes</button>
          <button
</>
className="tf-btn tf-btn-cancel" onClick={()=>setConfirm(null)} aria-label="Cancel admin action">No</button>
        </div>
      )}
    </div>
  );
}
