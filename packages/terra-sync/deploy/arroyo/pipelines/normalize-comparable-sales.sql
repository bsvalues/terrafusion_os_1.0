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

-- normalize-comparable-sales.sql
-- Arroyo streaming SQL — TerraFusion Sync v4 Phase 2.
--
-- Consumes Debezium CDC on dbo.sale.
-- Produces canonical ComparableSale events on
-- sync.canonical.comparable_sales.
--
-- Carries Benton PACS sale-qualifier metadata (sl_county_ratio_cd,
-- sl_ratio_type_cd, qualifier, suppress_on_ratio_rpt_cd, etc.) so
-- downstream ratio-study logic has full context.

CREATE CONNECTION kafka_source WITH (
    connector='kafka', type='source', format='json', bootstrap_servers='kafka:9092'
);
CREATE CONNECTION kafka_sink WITH (
    connector='kafka', type='sink', format='json', bootstrap_servers='kafka:9092'
);

CREATE TABLE source_sale (
    chg_of_owner_id INT,
    sl_price DECIMAL(18,2),
    adjusted_sl_price DECIMAL(18,2),
    sl_dt TIMESTAMP,
    sl_type_cd VARCHAR,
    sl_financing_cd VARCHAR,
    sl_county_ratio_cd VARCHAR,
    sl_ratio_type_cd VARCHAR,
    sl_ratio VARCHAR,
    sl_qualifier VARCHAR,
    suppress_on_ratio_rpt_cd VARCHAR,
    include_no_calc BOOLEAN,
    land_only_sale BOOLEAN,
    __op VARCHAR,
    __deleted VARCHAR
) WITH (
    connection='kafka_source',
    topic='sync.source.harris.benton.pacs_oltp.dbo.sale'
);

CREATE TABLE canonical_sales (
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
    topic='sync.canonical.comparable_sales'
);

INSERT INTO canonical_sales
SELECT
    uuid_generate_v4() AS event_id,
    '1.0' AS schema_version,
    CASE WHEN __deleted='true' THEN 'delete' ELSE 'upsert' END AS event_type,
    '19190019-1919-1919-1919-191919191919' AS county_id,
    'ComparableSale' AS entity,
    'harris-pacs' AS source_system,
    CAST(chg_of_owner_id AS VARCHAR) AS source_id,
    COALESCE(sl_dt, CURRENT_TIMESTAMP) AS occurred_at_utc,
    CURRENT_TIMESTAMP AS ingested_at_utc,
    json_object(
        'chg_of_owner_id', chg_of_owner_id,
        'sale_price', sl_price,
        'adjusted_sale_price', adjusted_sl_price,
        'sale_date', sl_dt,
        'sale_type_cd', sl_type_cd,
        'financing_cd', sl_financing_cd,
        'county_ratio_cd', sl_county_ratio_cd,
        'ratio_type_cd', sl_ratio_type_cd,
        'ratio_raw', sl_ratio,
        'qualifier', sl_qualifier,
        'suppress_on_ratio_rpt_cd', suppress_on_ratio_rpt_cd,
        'include_no_calc', include_no_calc,
        'land_only_sale', land_only_sale
    ) AS after_json
FROM source_sale
WHERE chg_of_owner_id IS NOT NULL;
