import { execFile } from 'child_process';
import { promisify } from 'util';
const run = promisify(execFile);
const psql = 'C:/Program Files/PostgreSQL/17/bin/psql.exe';
const env = { ...process.env, PGPASSWORD: 'devpassword123' };
const CONN = 'host=127.0.0.1 port=5432 dbname=terrafusion user=postgres';

async function q(label, sql) {
  try {
    const r = await run(psql, [CONN, '-t', '-A', '-c', sql], { env, timeout: 30000 });
    process.stdout.write(label + r.stdout.trim() + '\n');
  } catch (e) {
    process.stdout.write(label + 'ERR: ' + (e.stderr ?? e.message).substring(0, 100) + '\n');
  }
}

// Post-cleanup state
await q('tf_parcel total:          ', 'SELECT count(*) FROM canonical_tf.tf_parcel');
await q('source_xref live parcels: ', `SELECT count(*) FROM sync_bridge.source_xref WHERE "TfEntityType"='parcel' AND "IsActive"`);
await q('tf_parcel debris:         ', `SELECT count(*) FROM canonical_tf.tf_parcel p WHERE NOT EXISTS (SELECT 1 FROM sync_bridge.source_xref x WHERE x."TfEntityType"='parcel' AND x."IsActive" AND x."TfEntityId"=p."TfParcelId")`);
await q('distinct ParcelNumber:    ', `SELECT count(DISTINCT "ParcelNumber") FROM canonical_tf.tf_parcel`);
await q('owner_link total:         ', 'SELECT count(*) FROM canonical_tf.tf_parcel_owner_link');
await q('owner_link dangling:      ', `SELECT count(*) FROM canonical_tf.tf_parcel_owner_link o WHERE NOT EXISTS (SELECT 1 FROM sync_bridge.source_xref x WHERE x."TfEntityType"='parcel' AND x."IsActive" AND x."TfEntityId"=o."TfParcelId")`);
process.stdout.write('--- domain lanes (must be unchanged) ---\n');
await q('tf_land:                  ', 'SELECT count(*) FROM canonical_tf.tf_land');
await q('tf_improvement:           ', 'SELECT count(*) FROM canonical_tf.tf_improvement');
await q('tf_parcel_geom:           ', 'SELECT count(*) FROM gis_tf.tf_parcel_geom');
await q('tf_assessment:            ', 'SELECT count(*) FROM canonical_tf.tf_assessment');
await q('tf_assessment_bill_current:', 'SELECT count(*) FROM canonical_tf.tf_assessment_bill_current');
await q('tf_assessment_bill_line:  ', 'SELECT count(*) FROM canonical_tf.tf_assessment_bill_line');
await q('tf_exemption:             ', 'SELECT count(*) FROM canonical_tf.tf_exemption');
await q('tf_parcel_tax_area:       ', 'SELECT count(*) FROM canonical_tf.tf_parcel_tax_area');
await q('tf_tax_bill_current:      ', 'SELECT count(*) FROM canonical_tf.tf_tax_bill_current');
await q('tf_tax_bill_line:         ', 'SELECT count(*) FROM canonical_tf.tf_tax_bill_line');
process.stdout.write('--- dangling check on non-owner lanes ---\n');
await q('tf_land dangling:         ', `SELECT count(*) FROM canonical_tf.tf_land WHERE "TfParcelId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sync_bridge.source_xref x WHERE x."TfEntityType"='parcel' AND x."IsActive" AND x."TfEntityId"="TfParcelId")`);
await q('tf_improvement dangling:  ', `SELECT count(*) FROM canonical_tf.tf_improvement WHERE "TfParcelId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sync_bridge.source_xref x WHERE x."TfEntityType"='parcel' AND x."IsActive" AND x."TfEntityId"="TfParcelId")`);
await q('tf_assessment dangling:   ', `SELECT count(*) FROM canonical_tf.tf_assessment WHERE "TfParcelId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sync_bridge.source_xref x WHERE x."TfEntityType"='parcel' AND x."IsActive" AND x."TfEntityId"="TfParcelId")`);
await q('tf_exemption dangling:    ', `SELECT count(*) FROM canonical_tf.tf_exemption WHERE "TfParcelId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sync_bridge.source_xref x WHERE x."TfEntityType"='parcel' AND x."IsActive" AND x."TfEntityId"="TfParcelId")`);
await q('tf_parcel_tax_area dangling:', `SELECT count(*) FROM canonical_tf.tf_parcel_tax_area WHERE "TfParcelId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sync_bridge.source_xref x WHERE x."TfEntityType"='parcel' AND x."IsActive" AND x."TfEntityId"="TfParcelId")`);
await q('tf_tax_bill_line dangling:', `SELECT count(*) FROM canonical_tf.tf_tax_bill_line WHERE "TfParcelId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM sync_bridge.source_xref x WHERE x."TfEntityType"='parcel' AND x."IsActive" AND x."TfEntityId"="TfParcelId")`);
