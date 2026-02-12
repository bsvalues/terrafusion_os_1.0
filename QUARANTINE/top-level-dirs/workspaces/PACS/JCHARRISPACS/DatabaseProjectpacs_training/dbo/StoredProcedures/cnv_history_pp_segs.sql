


-- ****************************************************************
-- Stored Procedure	: cnv_computech_history_pers_prop_seg
-- Purpose			: Convert Clallam data into pers_prop_seg
-- Created By		: ST
-- Date				: 02/11/2009
-- Modified         : 2012 MP
-- ****************************************************************



/*

begin tran
rollback tran
commit tran


exec cnv_history_pp_segs


*/



CREATE procedure cnv_history_pp_segs


as

set nocount on



alter table pacs_oltp.dbo.pers_prop_seg disable trigger all
		

print 'Process Pers Prop segs...'

-- Pers_prop_seg
	
insert pacs_oltp.dbo.pers_prop_seg 
(
pp_seg_id,
prop_id,
prop_val_yr,
sup_num,
sale_id,
pp_sched_cd,
pp_table_meth_cd,
pp_type_cd,
pp_class_cd,
pp_vin,
pp_density_cd,
pp_adj_cd,
pp_area,
pp_unit_count,
pp_yr_aquired,
pp_state_cd,
pp_dep_method,
pp_deprec_type_cd,
pp_deprec_deprec_cd,
pp_deprec_override,
pp_deprec_pct,
pp_pct_good,
pp_orig_cost,
pp_economic_pct,
pp_physical_pct,
pp_flat_val,
pp_rendered_val,
pp_method_val,
pp_prior_yr_val,
pp_appraise_meth,
pp_new_val_yr,
pp_new_val,
pp_mkt_val,
pp_appraised_val,
pp_unit_price,
pp_qual_cd,
pp_description,
pp_comment,
pp_active_flag,
farm_asset
)
select
CAST( ROW_NUMBER() OVER(ORDER BY p.prop_id) AS INT)  + (SELECT ISNULL(MAX(pp_seg_id),10) FROM pacs_oltp.DBO.pers_prop_seg WITH(NOLOCK)) AS pp_seg_id,
p.prop_id as prop_id,
2011  as prop_val_yr,
0 as sup_num,
0 as sale_id,
null as pp_sched_cd,
null as pp_table_meth_cd,
'CONV' as pp_type_cd,
NULL as pp_class_cd,
null as pp_vin,
null as pp_density_cd,
null as pp_adj_cd,
1 as pp_area,
1 as pp_unit_count,
NULL as pp_yr_aquired,
59 as pp_state_cd,   --select top 2 * from cpavhsta
null as pp_dep_method,
null as pp_deprec_type_cd,
null as pp_deprec_deprec_cd,
'F' as pp_deprec_override,
100 as pp_deprec_pct,
100 as pp_pct_good,
0  as pp_orig_cost, --orig pur price
100 as pp_economic_pct,
100 as pp_physical_pct,
value as pp_flat_val,  
0	as pp_rendered_val,
0 as pp_method_val,
null as pp_prior_yr_val,
'F' as pp_appraise_meth,
null as pp_new_val_yr,
0 as pp_new_val,
value as pp_mkt_val,  
value as pp_appraised_val,  
0 as pp_unit_price,
null as pp_qual_cd,
NULL as pp_description,
NULL as pp_comment,
'T' as pp_active_flag,
0 as farm_asset

--select top 10 pv.* 
from props_to_add a
join pacs_oltp..property p on p.ref_id1 = a.geo_id
join pacs_oltp..property_val pv on pv.prop_val_yr=2011 and pv.prop_id=p.prop_id
where a.geo_id is not null



print 'Nextids...'

exec pacs_oltp..updatenextids

set nocount off


alter table pacs_oltp.dbo.pers_prop_seg enable trigger all
	
print 'Done....'




SET ANSI_NULLS ON

GO

