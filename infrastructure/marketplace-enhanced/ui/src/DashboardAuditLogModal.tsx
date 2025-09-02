import React from 'react';
import './DashboardAuditLogModal.css';

export function DashboardAuditLogModal({ plugin, logs, onClose }) {
  return (
    <div className="tf-modal-overlay">
      <div className="tf-modal tf-modal-audit">
        <div className="tf-modal-header"><>

          <h2>Audit Log: {plugin.name}</h2>
          <button
</> className="tf-modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="tf-modal-content">
          <table className="tf-audit-table">
            <thead>
              <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Status</th></tr>
            </thead>
            <tbody>
              {logs && logs.length > 0 ? logs.map((log, i) => (
                <tr key={i}><>

                  <td>{log.timestamp}</td>
                  <td
</>>{log.user}</td><>

                  <td>{log.action}</td>
                  <td
</>>{log.status}</td>
                </tr>
              )) : <tr><td colSpan={4}>No audit log entries.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="tf-modal-footer">
          <button className="tf-btn tf-btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
