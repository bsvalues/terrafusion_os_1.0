-- mv_properties.sql
-- RisingWave source + materialized view + JDBC sink.
-- Consumes sync.canonical.property; upserts into shadow."Properties".
--
-- Situs city/state/zip arrive via a separate Arroyo enrichment pass
-- (Phase 2.1). They land NULL here until that pipeline merges.

CREATE SOURCE IF NOT EXISTS src_canonical_property (
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
    topic = 'sync.canonical.property',
    properties.bootstrap.server = 'kafka:9092',
    scan.startup.mode = 'earliest'
) FORMAT PLAIN ENCODE JSON;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_properties AS
SELECT
    gen_random_uuid() AS "Id",
    county_id::uuid AS "CountyId",
    (after_json::jsonb->>'prop_id')::varchar AS "ParcelId",
    'PACS-' || (after_json::jsonb->>'prop_id') AS "PropertyId",
    after_json::jsonb->>'geo_id' AS "GeoId",
    after_json::jsonb->>'neighborhood' AS "Neighborhood",
    NULL::varchar AS "SitusCity",
    NULL::varchar AS "SitusState",
    NULL::varchar AS "SitusZip",
    after_json::jsonb->>'prop_type_cd' AS "PropertyUseCode",
    after_json::jsonb->>'legal_desc' AS "LegalDescription",
    ingested_at_utc AS "LastUpdated"
FROM src_canonical_property
WHERE event_type = 'upsert';

CREATE SINK sink_shadow_properties
FROM mv_properties
WITH (
    connector = 'jdbc',
    jdbc.url = 'jdbc:postgresql://postgres:5432/terrafusion?user=postgres&password=devpassword123',
    table.name = 'shadow."Properties"',
    primary_key = 'CountyId,ParcelId',
    type = 'upsert'
);
