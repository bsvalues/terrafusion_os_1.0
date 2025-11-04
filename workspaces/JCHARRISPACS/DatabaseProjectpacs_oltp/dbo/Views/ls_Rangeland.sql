create view ls_Rangeland as
select distinct
Rangeland ,
sls.[prop_id]as prop_id,
sum_of_land_segs as Rangeland_Land_Segments,  
legal_acreage as Rangeland_Legal_Acreage,
sum_of_land_seg_mrkt_val as Rangeland_Segment_Market,
total_ag_unit_price as Rangeland_Ag_UnitPrice  
  from [pacs_oltp].[dbo].[__aland_type] 
   left join __sum_land_seg sls on sls.prop_id=__aland_type.prop_id where Rangeland is not null and Rangeland not like '0%'

GO

