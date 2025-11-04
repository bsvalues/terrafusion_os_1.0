

CREATE VIEW ptd_acreage_summary_vw
AS

select entity_id,  -- single codes
year,
as_of_sup_num,
date,
land_type_cd,
convert(numeric(14,0), land_acres) as land_acres,
land_market_val,
land_ag_val,
entity_type_count,
dataset_id
from ptd_mt_state_report_acreage_detail with (nolock)
where (land_type_cd = 'IRCP' or land_type_cd = 'DLCP'
    or land_type_cd = 'BRNW' or land_type_cd = 'ORCH'  
    or land_type_cd = 'IMPR' or land_type_cd = 'NATP'
    or land_type_cd = 'WDLF' or land_type_cd = 'OTHR')

union

select entity_id,  -- timber at productivity
year,
as_of_sup_num,
max(date) as date,
'TP' as land_type_cd,
convert(numeric(14,0), sum(land_acres)) as land_acres,
sum(land_market_val) as land_market_val,
sum(land_ag_val) as land_ag_val,
sum(entity_type_count) as entity_type_count,
dataset_id
from ptd_mt_state_report_acreage_detail with (nolock)
where land_type_cd like '[HPM][1234]PR'
group by entity_id, year, as_of_sup_num, dataset_id

union

select entity_id,  -- timber at restricted use
year,
as_of_sup_num,
max(date),
'TR' as land_type_cd,
convert(numeric(14,0), sum(land_acres)) as land_acres,
sum(land_market_val) as land_market_val,
sum(land_ag_val) as land_ag_val,
sum(entity_type_count) as entity_type_count,
dataset_id
from ptd_mt_state_report_acreage_detail with (nolock)
where land_type_cd like '[HPM][1234]RU'
group by entity_id, year, as_of_sup_num, dataset_id

union

select entity_id,  -- 78 timber
year,
as_of_sup_num,
max(date),
'T78' as land_type_cd,
convert(numeric(14,0), sum(land_acres)) as land_acres,
sum(land_market_val) as land_market_val,
sum(land_ag_val) as land_ag_val,
sum(entity_type_count) as entity_type_count,
dataset_id
from ptd_mt_state_report_acreage_detail with (nolock)
where land_type_cd like '__78'
group by entity_id, year, as_of_sup_num, dataset_id

union

select entity_id,  -- transition to timber
year,
as_of_sup_num,
max(date),
'TT' as land_type_cd,
convert(numeric(14,0), sum(land_acres)) as land_acres,
sum(land_market_val) as land_market_val,
sum(land_ag_val) as land_ag_val,
sum(entity_type_count) as entity_type_count,
dataset_id
from ptd_mt_state_report_acreage_detail with (nolock)
where (land_type_cd = 'HDT1' or land_type_cd = 'MXT1' or land_type_cd = 'PNT1')
group by entity_id, year, as_of_sup_num, dataset_id

GO

