create view ls_OS_Market as
select distinct
OS_Market,
sls.[prop_id]as prop_id,
sum_of_land_segs as OS_Market_Land_Segments,  
legal_acreage as OS_Market_Legal_Acreage,
sum_of_land_seg_mrkt_val as OS_Market_Seg_Market,
total_ag_unit_price as OS_Market_Ag_UnitPrice  
  from  [pacs_oltp].[dbo].[__aland_type] 
   left join __sum_land_seg sls on sls.prop_id=__aland_type.prop_id where OS_Market is not null and OS_Market not like '0%'

GO

