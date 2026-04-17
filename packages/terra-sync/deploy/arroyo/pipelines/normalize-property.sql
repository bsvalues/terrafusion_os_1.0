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

-- normalize-property.sql
-- Arroyo streaming SQL pipeline for TerraFusion Sync v4, Phase 2.
--
-- Consumes Debezium CDC topics for the Benton Harris PACS property +
-- property_val tables. Produces canonical property events on
-- sync.canonical.property that match the JSON shape published in the
-- Sync v4 control plane design spec §6.2.
--
-- Delete handling: Debezium's ExtractNewRecordState SMT with
-- delete.handling.mode=rewrite produces flat rows with __deleted='true'
-- for deletions. We translate that into canonical event_type='delete'.
--
-- Current-year semantics: we pick the row from property_val where
-- prop_val_yr = MAX(prop_val_yr) for that prop_id and sup_num = 0
-- (current certified roll, no supplement).

CREATE CONNECTION kafka_source WITH (
    connector = 'kafka',
    type = 'source',
    format = 'json',
    bootstrap_servers = 'kafka:9092'
);

CREATE CONNECTION kafka_sink WITH (
    connector = 'kafka',
    type = 'sink',
    format = 'json',
    bootstrap_servers = 'kafka:9092'
);

CREATE TABLE source_property (
    prop_id INT,
    geo_id VARCHAR,
    prop_type_cd VARCHAR,
    legal_desc VARCHAR,
    prop_create_dt TIMESTAMP,
    __op VARCHAR,
    __deleted VARCHAR
) WITH (
    connection = 'kafka_source',
    topic = 'sync.source.harris.benton.pacs_oltp.dbo.property'
);

CREATE TABLE source_property_val (
    prop_id INT,
    prop_val_yr INT,
    sup_num INT,
    hood_cd VARCHAR,
    assessed_val DECIMAL(18,2),
    market DECIMAL(18,2),
    imprv_val DECIMAL(18,2),
    land_hstd_val DECIMAL(18,2),
    land_non_hstd_val DECIMAL(18,2),
    __op VARCHAR,
    __deleted VARCHAR
) WITH (
    connection = 'kafka_source',
    topic = 'sync.source.harris.benton.pacs_oltp.dbo.property_val'
);

CREATE TABLE canonical_property (
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
    connection = 'kafka_sink',
    topic = 'sync.canonical.property'
);

INSERT INTO canonical_property
SELECT
    uuid_generate_v4() AS event_id,
    '1.0' AS schema_version,
    CASE WHEN p.__deleted = 'true' THEN 'delete' ELSE 'upsert' END AS event_type,
    '19190019-1919-1919-1919-191919191919' AS county_id,
    'Property' AS entity,
    'harris-pacs' AS source_system,
    CAST(p.prop_id AS VARCHAR) AS source_id,
    COALESCE(p.prop_create_dt, CURRENT_TIMESTAMP) AS occurred_at_utc,
    CURRENT_TIMESTAMP AS ingested_at_utc,
    json_object(
      'prop_id', p.prop_id,
      'geo_id', p.geo_id,
      'prop_type_cd', p.prop_type_cd,
      'legal_desc', p.legal_desc,
      'neighborhood', pv.hood_cd,
      'assessment_year', pv.prop_val_yr,
      'assessed_val', pv.assessed_val,
      'market_val', pv.market,
      'imprv_val', pv.imprv_val,
      'land_val', COALESCE(pv.land_hstd_val, 0) + COALESCE(pv.land_non_hstd_val, 0)
    ) AS after_json
FROM source_property p
LEFT JOIN source_property_val pv
    ON p.prop_id = pv.prop_id
   AND pv.prop_val_yr = (
       SELECT MAX(prop_val_yr)
       FROM source_property_val
       WHERE prop_id = p.prop_id
   )
   AND pv.sup_num = 0
WHERE p.prop_id IS NOT NULL;
