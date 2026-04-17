-- PHASE 2 SCOPE NOTE:
--   Emits the subset of spec §6.2 required for shadow-parity:
--   event_id, schema_version, event_type, county_id, entity,
--   source_system, source_id, occurred_at_utc, ingested_at_utc,
--   after_json.
--   Deferred to Phase 3: `before` (prior values), `provenance`
--   (debezium_offset, connector_name, transform_pipeline,
--   transform_version), and `audit_chain` (prev_event_hash,
--   this_event_hash). These are not required for row-existence
--   shadow-parity; they are required for bidirectional writeback
--   and forensics, both Phase 3 scope.

-- normalize-cama.sql
-- Arroyo streaming SQL — TerraFusion Sync v4 Phase 2.
--
-- Consumes Debezium CDC on dbo.imprv (building/improvement rows).
-- Produces canonical CamaCharacteristic events on sync.canonical.cama
-- matching the event shape in spec §6.2.
--
-- source_id is <prop_id>:<prop_val_yr> so multiple tax-year snapshots
-- of the same parcel's improvements produce distinct canonical events.

CREATE CONNECTION kafka_source WITH (
    connector='kafka', type='source', format='json', bootstrap_servers='kafka:9092'
);
CREATE CONNECTION kafka_sink WITH (
    connector='kafka', type='sink', format='json', bootstrap_servers='kafka:9092'
);

CREATE TABLE source_imprv (
    prop_id INT,
    prop_val_yr INT,
    imprv_id INT,
    imprv_type_cd VARCHAR,
    imprv_state_cd VARCHAR,
    imprv_val DECIMAL(18,2),
    physical_pct DECIMAL(7,4),
    dep_pct DECIMAL(7,4),
    __op VARCHAR,
    __deleted VARCHAR
) WITH (
    connection='kafka_source',
    topic='sync.source.harris.benton.pacs_oltp.dbo.imprv'
);

CREATE TABLE canonical_cama (
    event_id VARCHAR,
    schema_version VARCHAR,
    event_type VARCHAR,
    county_id VARCHAR,
    entity VARCHAR,
    source_system VARCHAR,
    source_id VARCHAR,
    occurred_at_utc TIMESTAMP,
    ingested_at_utc TIMESTAMP,
    after_json VARCHAR
) WITH (
    connection='kafka_sink',
    topic='sync.canonical.cama'
);

INSERT INTO canonical_cama
SELECT
    uuid_generate_v4() AS event_id,
    '1.0' AS schema_version,
    CASE WHEN __deleted='true' THEN 'delete' ELSE 'upsert' END AS event_type,
    '19190019-1919-1919-1919-191919191919' AS county_id,
    'CamaCharacteristic' AS entity,
    'harris-pacs' AS source_system,
    CAST(prop_id AS VARCHAR) || ':' || CAST(prop_val_yr AS VARCHAR) AS source_id,
    CURRENT_TIMESTAMP AS occurred_at_utc,
    CURRENT_TIMESTAMP AS ingested_at_utc,
    json_object(
        'parcel_id', CAST(prop_id AS VARCHAR),
        'tax_year', prop_val_yr,
        'building_type', imprv_type_cd,
        'building_state', imprv_state_cd,
        'improvement_val', imprv_val,
        'physical_pct', physical_pct,
        'depreciation_pct', dep_pct
    ) AS after_json
FROM source_imprv
WHERE prop_id IS NOT NULL;
