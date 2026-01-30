import type { Session } from '../auth/session';

export function sessionToPilotHeaders(session: Session): Record<string, string> {
  const headers: Record<string, string> = {
    'x-user-id': session.userId,
    'x-county-id': session.countyId,
  };

  if (session.role) headers['x-role'] = session.role;
  if (session.mode) headers['x-mode'] = session.mode;
  if (session.parcelId) headers['x-parcel-id'] = session.parcelId;
  if (session.permissions?.length) {
    headers['x-permissions'] = session.permissions.join(',');
  }

  return headers;
}
