-- normalize-property-assessments.sql
-- Arroyo streaming SQL — TerraFusion Sync v4 Phase 2.
--
-- Distills dbo.property_val CDC events into canonical
-- PropertyAssessment events on sync.canonical.property_assessments.
--
-- Filters to sup_num = 0 (certified roll without supplement). Earlier
-- certified years flow through; amendment-year assessments are a
-- separate Phase 3 pipeline.
--
-- source_id is <prop_id>:<prop_val_yr>:<sup_num> for uniqueness across
-- years and supplements (even though we filter sup_num=0 here).

CREATE CONNECTION kafka_source WITH (
    connector='kafka', type='source', format='json', bootstrap_servers='kafka:9092'
);
CREATE CONNECTION kafka_sink WITH (
    connector='kafka', type='sink', format='json', bootstrap_servers='kafka:9092'
);

CREATE TABLE source_pv (
    prop_id INT,
    prop_val_yr INT,
    sup_num INT,
    assessed_val DECIMAL(18,2),
    market DECIMAL(18,2),
    imprv_val DECIMAL(18,2),
    land_hstd_val DECIMAL(18,2),
    land_non_hstd_val DECIMAL(18,2),
    legal_desc VARCHAR,
    legal_desc_2 VARCHAR,
    __op VARCHAR,
    __deleted VARCHAR
) WITH (
    connection='kafka_source',
    topic='sync.source.harris.benton.pacs_oltp.dbo.property_val'
);

CREATE TABLE canonical_pa (
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
    topic='sync.canonical.property_assessments'
);

INSERT INTO canonical_pa
SELECT
    uuid_generate_v4() AS event_id,
    '1.0' AS schema_version,
    CASE WHEN __deleted='true' THEN 'delete' ELSE 'upsert' END AS event_type,
    '19190019-1919-1919-1919-191919191919' AS county_id,
    'PropertyAssessment' AS entity,
    'harris-pacs' AS source_system,
    CAST(prop_id AS VARCHAR) || ':' || CAST(prop_val_yr AS VARCHAR) || ':' || CAST(sup_num AS VARCHAR) AS source_id,
    CURRENT_TIMESTAMP AS occurred_at_utc,
    CURRENT_TIMESTAMP AS ingested_at_utc,
    json_object(
        'prop_id', prop_id,
        'assessment_year', prop_val_yr,
        'sup_num', sup_num,
        'assessed_value', assessed_val,
        'market_value', market,
        'improvement_value', imprv_val,
        'land_value', COALESCE(land_hstd_val, 0) + COALESCE(land_non_hstd_val, 0),
        'legal_description', TRIM(COALESCE(legal_desc, '') || ' ' || COALESCE(legal_desc_2, ''))
    ) AS after_json
FROM source_pv
WHERE prop_id IS NOT NULL AND sup_num = 0;
