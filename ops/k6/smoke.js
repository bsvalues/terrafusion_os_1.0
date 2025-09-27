import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = { vus: 1, duration: '30s' };
export default function () {
  const res = http.get('http://localhost:5046/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = { vus: 1, duration: '30s' };
export default function () {
  const res = http.get('http://localhost:5046/health');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
