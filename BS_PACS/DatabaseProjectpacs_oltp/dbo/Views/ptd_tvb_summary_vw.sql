

CREATE VIEW ptd_tvb_summary_vw
AS

select entity_id,
year,
as_of_sup_num,
date,
category_cd,
convert(numeric(14,0), case when category_cd like 'D%'
	then category_acres else category_count end) as number_of_items,
category_amt,
dataset_id,
category_d_count
from ptd_mt_state_report_tvb with (nolock)
where category_cd <> 'X' and category_cd not like 'J%'

union

select entity_id,
year,
as_of_sup_num,
max(date) as date,
'J' as category_cd,
sum(category_count) as number_of_items,
sum(category_amt) as category_amt,
dataset_id,
category_d_count
from ptd_mt_state_report_tvb with (nolock)
where category_cd like 'J%'
group by entity_id, year, as_of_sup_num, dataset_id, category_d_count

GO

