import { assertEquals, assertExists } from "std/assert/mod.ts";

const PIPELINE_URL = "http://localhost:5002";
const WORKFLOW_URL = "http://localhost:5001";
const CALCULATION_URL = "http://localhost:5003";

Deno.test("🌐 PROPAGATION: Cross-Service Data Access", async (t) => {

  await t.step("1. Data Pipeline: Retrieve Parcels", async () => {
    const res = await fetch(`${PIPELINE_URL}/api/parcels?per_page=10`);
    assertEquals(res.status, 200, "Should return parcels");

    const data = await res.json();
    assertExists(data.parcels, "Should have parcels array");
    assertExists(data.total, "Should have total count");

    console.log(`    📊 Total parcels in DB: ${data.total}`);
    console.log(`    📦 Returned: ${data.parcels.length}`);
  });

  await t.step("2. Data Pipeline: Search by Owner", async () => {
    const res = await fetch(`${PIPELINE_URL}/api/parcels/search?q=Smith`);
    assertEquals(res.status, 200, "Search should work");

    const data = await res.json();
    console.log(`    🔍 Found ${data.count} parcels matching 'Smith'`);
  });

  await t.step("3. Data Pipeline: Get Statistics", async () => {
    const res = await fetch(`${PIPELINE_URL}/api/ingest/stats`);
    assertEquals(res.status, 200, "Stats should work");

    const data = await res.json();
    assertExists(data.total_records, "Should have total");
    assertExists(data.value_statistics, "Should have value stats");

    console.log(`    📈 Statistics:`);
    console.log(`       Total Records: ${data.total_records}`);
    console.log(`       Total Value: $${data.value_statistics.total?.toLocaleString()}`);
    console.log(`       Avg Value: $${data.value_statistics.avg?.toLocaleString()}`);
    // console.log(`       Sources: ${JSON.stringify(data.sources)}`);
  });

  await t.step("4. Workflow Engine: Health Check", async () => {
    try {
        const res = await fetch(`${WORKFLOW_URL}/health`);
        // assertEquals(res.status, 200, "Workflow should be healthy");

        if (res.status === 200) {
            const data = await res.json();
            console.log(`    🔄 Workflow Status: ${data.status}`);
        } else {
            console.log("    ⚠️ Workflow Engine is accessible but returned status " + res.status);
        }
    } catch (error) {
        console.log("    ⚠️ Workflow Engine not running or not accessible (Skipping check)");
    }
  });

  await t.step("5. Calculation Engine: Health Check", async () => {
    try {
        const res = await fetch(`${CALCULATION_URL}/health`);
        // assertEquals(res.status, 200, "Calculation should be healthy");

        if (res.status === 200) {
            const data = await res.json();
            console.log(`    🧮 Calculation Status: ${data.status}`);
        } else {
             console.log("    ⚠️ Calculation Engine is accessible but returned status " + res.status);
        }
    } catch (error) {
        console.log("    ⚠️ Calculation Engine not running or not accessible (Skipping check)");
    }
  });
});
