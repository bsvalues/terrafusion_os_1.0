create view ls_Non_Buildable as
select distinct
non_buildable,
sls.[prop_id]as prop_id,
sum_of_land_segs as non_buildable_Land_Segments,  
legal_acreage as non_buildable_Legal_Acreage,
sum_of_land_seg_mrkt_val as non_buildable_Seg_Market,
total_ag_unit_price as non_buildable_Ag_UnitPrice  
  from  [pacs_oltp].[dbo].[__aland_type] 
   left join __sum_land_seg sls on sls.prop_id=__aland_type.prop_id where non_buildable is not null and non_buildable not like '0%'

GO

