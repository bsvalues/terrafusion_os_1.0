-- mv_cama_characteristics.sql
-- RisingWave source + MV + sink. Consumes sync.canonical.cama;
-- upserts into shadow."CamaCharacteristics".

CREATE SOURCE IF NOT EXISTS src_canonical_cama (
    event_id varchar,
    schema_version varchar,
    event_type varchar,
    county_id varchar,
    entity varchar,
    source_system varchar,
    source_id varchar,
    occurred_at_utc timestamp,
    ingested_at_utc timestamp,
    after_json varchar
)
WITH (
    connector = 'kafka',
    topic = 'sync.canonical.cama',
    properties.bootstrap.server = 'kafka:9092',
    scan.startup.mode = 'earliest'
) FORMAT PLAIN ENCODE JSON;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_cama AS
SELECT
    gen_random_uuid() AS "Id",
    county_id::uuid AS "CountyId",
    (after_json::jsonb->>'parcel_id')::varchar AS "ParcelId",
    (after_json::jsonb->>'tax_year')::int AS "TaxYear",
    (after_json::jsonb->>'building_type')::varchar AS "BuildingType",
    (after_json::jsonb->>'improvement_val')::numeric AS "ImprvVal",
    (after_json::jsonb->>'physical_pct')::numeric AS "PhysicalDepreciationPct",
    (after_json::jsonb->>'depreciation_pct')::numeric AS "DepreciationPct",
    ingested_at_utc AS "UpdatedAt"
FROM src_canonical_cama
WHERE event_type = 'upsert';

CREATE SINK sink_shadow_cama FROM mv_cama
WITH (
    connector = 'jdbc',
    jdbc.url = 'jdbc:postgresql://postgres:5432/terrafusion?user=postgres&password=devpassword123',
    table.name = 'shadow."CamaCharacteristics"',
    primary_key = 'CountyId,ParcelId,TaxYear',
    type = 'upsert'
);
