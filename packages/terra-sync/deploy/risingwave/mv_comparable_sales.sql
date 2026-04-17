-- mv_comparable_sales.sql
-- RisingWave source + MV + sink. Consumes sync.canonical.comparable_sales;
-- upserts into shadow."ComparableSales".
--
-- ParcelId arrives NULL in this MV — the Arroyo sales pipeline does
-- not currently join to the chg_of_owner_prop_assoc table. Phase 2.1
-- adds the join so each sale carries its associated parcel.

CREATE SOURCE IF NOT EXISTS src_canonical_sales (
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
    topic = 'sync.canonical.comparable_sales',
    properties.bootstrap.server = 'kafka:9092',
    scan.startup.mode = 'earliest'
) FORMAT PLAIN ENCODE JSON;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_sales AS
SELECT
    gen_random_uuid() AS "Id",
    county_id::uuid AS "CountyId",
    NULL::varchar AS "ParcelId",
    (after_json::jsonb->>'sale_date')::timestamp AS "SaleDate",
    (after_json::jsonb->>'sale_price')::numeric AS "SalePrice",
    (after_json::jsonb->>'adjusted_sale_price')::numeric AS "AdjustedSalePrice",
    (after_json::jsonb->>'sale_type_cd')::varchar AS "SaleTypeCode",
    (after_json::jsonb->>'county_ratio_cd')::varchar AS "CountyRatioCode",
    (after_json::jsonb->>'qualifier')::varchar AS "Qualifier",
    (after_json::jsonb->>'suppress_on_ratio_rpt_cd')::varchar AS "SuppressOnRatioRptCd",
    (after_json::jsonb->>'include_no_calc')::boolean AS "IncludeNoCalc",
    (after_json::jsonb->>'land_only_sale')::boolean AS "LandOnlySale"
FROM src_canonical_sales
WHERE event_type = 'upsert';

CREATE SINK sink_shadow_sales FROM mv_sales
WITH (
    connector = 'jdbc',
    jdbc.url = 'jdbc:postgresql://postgres:5432/terrafusion?user=postgres&password=devpassword123',
    table.name = 'shadow."ComparableSales"',
    primary_key = 'Id',
    type = 'upsert'
);
