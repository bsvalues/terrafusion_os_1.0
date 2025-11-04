
create view TaxRateChangeReportData
as
select	curr_yr_tax_rate.tax_rate_yr,
	curr_yr_tax_rate.entity_id, 
	entity.entity_cd,
	'M & O Tax Rate:' as rate_name,
	prev_yr_tax_rate.m_n_o_tax_pct as prev_yr,
	curr_yr_tax_rate.m_n_o_tax_pct as curr_yr
from 		tax_rate as curr_yr_tax_rate with (nolock) 

inner join	tax_rate as prev_yr_tax_rate with (nolock) 
	on prev_yr_tax_rate.tax_rate_yr = curr_yr_tax_rate.tax_rate_yr - 1
	and prev_yr_tax_rate.entity_id = curr_yr_tax_rate.entity_id

inner join 	entity
	on entity.entity_id = curr_yr_tax_rate.entity_id

where prev_yr_tax_rate.m_n_o_tax_pct <> curr_yr_tax_rate.m_n_o_tax_pct
UNION
select	curr_yr_tax_rate.tax_rate_yr,
	curr_yr_tax_rate.entity_id, 
	entity.entity_cd,
	'I & S Tax Rate:' as rate_name,
	prev_yr_tax_rate.i_n_s_tax_pct as prev_yr,
	curr_yr_tax_rate.i_n_s_tax_pct as curr_yr
from 		tax_rate as curr_yr_tax_rate with (nolock) 

inner join	tax_rate as prev_yr_tax_rate with (nolock) 
	on prev_yr_tax_rate.tax_rate_yr = curr_yr_tax_rate.tax_rate_yr - 1
	and prev_yr_tax_rate.entity_id = curr_yr_tax_rate.entity_id

inner join 	entity
	on entity.entity_id = curr_yr_tax_rate.entity_id
where prev_yr_tax_rate.i_n_s_tax_pct <> curr_yr_tax_rate.i_n_s_tax_pct
UNION
select	curr_yr_tax_rate.tax_rate_yr,
	curr_yr_tax_rate.entity_id, 
	entity.entity_cd,
	'Protected I & S Tax Rate:' as rate_name,
	prev_yr_tax_rate.prot_i_n_s_tax_pct as prev_yr,
	curr_yr_tax_rate.prot_i_n_s_tax_pct as curr_yr
from 		tax_rate as curr_yr_tax_rate with (nolock) 

inner join	tax_rate as prev_yr_tax_rate with (nolock) 
	on prev_yr_tax_rate.tax_rate_yr = curr_yr_tax_rate.tax_rate_yr - 1
	and prev_yr_tax_rate.entity_id = curr_yr_tax_rate.entity_id

inner join 	entity
	on entity.entity_id = curr_yr_tax_rate.entity_id

where prev_yr_tax_rate.prot_i_n_s_tax_pct <> curr_yr_tax_rate.prot_i_n_s_tax_pct
UNION
select	curr_yr_tax_rate.tax_rate_yr,
	curr_yr_tax_rate.entity_id, 
	entity.entity_cd,
	'Sales Tax Rate:' as rate_name,
	prev_yr_tax_rate.sales_tax_pct as prev_yr,
	curr_yr_tax_rate.sales_tax_pct as curr_yr
from 		tax_rate as curr_yr_tax_rate with (nolock) 

inner join	tax_rate as prev_yr_tax_rate with (nolock) 
	on prev_yr_tax_rate.tax_rate_yr = curr_yr_tax_rate.tax_rate_yr - 1
	and prev_yr_tax_rate.entity_id = curr_yr_tax_rate.entity_id

inner join 	entity
	on entity.entity_id = curr_yr_tax_rate.entity_id

where prev_yr_tax_rate.sales_tax_pct <> curr_yr_tax_rate.sales_tax_pct

GO

