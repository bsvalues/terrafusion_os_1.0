import http from "k6/http"
import { check, sleep } from "k6"
import { Rate } from "k6/metrics"

export const errorRate = new Rate("errors")

export const options = {
  stages: [
    { duration: "2m", target: 100 },
    { duration: "5m", target: 100 },
    { duration: "2m", target: 200 },
    { duration: "5m", target: 200 },
    { duration: "2m", target: 300 },
    { duration: "5m", target: 300 },
    { duration: "10m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(99)<1500"],
    http_req_failed: ["rate<0.1"],
    errors: ["rate<0.1"],
  },
}

const BASE_URL = __ENV.TARGET_URL || "http://localhost:3000"

export default function () {
  let response = http.get(`${BASE_URL}/api/health`)

  const checkRes = check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  })

  errorRate.add(!checkRes)

  response = http.get(`${BASE_URL}/dashboard`)
  check(response, {
    "dashboard loads": (r) => r.status === 200,
  })

  response = http.get(`${BASE_URL}/api/properties`)
  check(response, {
    "properties API works": (r) => r.status === 200,
  })

  sleep(1)
}
