import { execFile } from 'child_process';
import { promisify } from 'util';
const run = promisify(execFile);
const psql = 'C:/Program Files/PostgreSQL/17/bin/psql.exe';
const env = { ...process.env, PGPASSWORD: 'devpassword123' };
const CONN = 'host=127.0.0.1 port=5432 dbname=terrafusion user=postgres';

async function q(sql) {
  try {
    const r = await run(psql, [CONN, '-t', '-A', '-c', sql], { env, timeout: 30000 });
    return r.stdout.trim();
  } catch (e) {
    return 'ERR: ' + (e.stderr ?? e.message).substring(0, 200);
  }
}

const total = await q('SELECT count(*) FROM canonical_tf.tf_parcel');
process.stdout.write('tf_parcel total:       ' + total + '\n');

const live = await q(`SELECT count(*) FROM sync_bridge.source_xref WHERE "TfEntityType"='parcel' AND "IsActive"`);
process.stdout.write('source_xref live:      ' + live + '\n');

const debris = await q(`SELECT count(*) FROM canonical_tf.tf_parcel p WHERE p."TfParcelId" NOT IN (SELECT x."TfEntityId" FROM sync_bridge.source_xref x WHERE x."TfEntityType"='parcel' AND x."IsActive")`);
process.stdout.write('tf_parcel debris:      ' + debris + '\n');

const distinctAll = await q(`SELECT count(DISTINCT "ParcelNumber") FROM canonical_tf.tf_parcel`);
process.stdout.write('distinct ParcelNumber: ' + distinctAll + '\n');

const ownerTotal = await q('SELECT count(*) FROM canonical_tf.tf_parcel_owner_link');
process.stdout.write('owner_link total:      ' + ownerTotal + '\n');

const ownerDangling = await q(`SELECT count(*) FROM canonical_tf.tf_parcel_owner_link WHERE "TfParcelId" NOT IN (SELECT x."TfEntityId" FROM sync_bridge.source_xref x WHERE x."TfEntityType"='parcel' AND x."IsActive")`);
process.stdout.write('owner_link dangling:   ' + ownerDangling + '\n');
