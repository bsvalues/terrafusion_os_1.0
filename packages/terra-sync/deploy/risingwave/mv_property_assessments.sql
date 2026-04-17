-- mv_property_assessments.sql
-- RisingWave source + MV + sink. Consumes sync.canonical.property_assessments;
-- upserts into shadow."PropertyAssessments".

CREATE SOURCE IF NOT EXISTS src_canonical_pa (
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
    topic = 'sync.canonical.property_assessments',
    properties.bootstrap.server = 'kafka:9092',
    scan.startup.mode = 'earliest'
) FORMAT PLAIN ENCODE JSON;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_property_assessments AS
SELECT
    gen_random_uuid() AS "Id",
    county_id::uuid AS "CountyId",
    (after_json::jsonb->>'prop_id')::varchar AS "PropertyParcelId",
    (after_json::jsonb->>'assessment_year')::int AS "AssessmentYear",
    (after_json::jsonb->>'assessed_value')::numeric AS "AssessedValue",
    (after_json::jsonb->>'market_value')::numeric AS "MarketValue",
    (after_json::jsonb->>'improvement_value')::numeric AS "ImprovementValue",
    (after_json::jsonb->>'land_value')::numeric AS "LandValue"
FROM src_canonical_pa
WHERE event_type = 'upsert';

CREATE SINK sink_shadow_pa FROM mv_property_assessments
WITH (
    connector = 'jdbc',
    jdbc.url = 'jdbc:postgresql://postgres:5432/terrafusion?user=postgres&password=devpassword123',
    table.name = 'shadow."PropertyAssessments"',
    primary_key = 'CountyId,PropertyParcelId,AssessmentYear',
    type = 'upsert'
);
