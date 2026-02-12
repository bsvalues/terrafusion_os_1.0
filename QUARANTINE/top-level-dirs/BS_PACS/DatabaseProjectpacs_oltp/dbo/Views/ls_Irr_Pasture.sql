create view ls_Irr_Pasture as
select distinct
Irr_Pasture,
sls.[prop_id]as prop_id,
sum_of_land_segs as Irr_Pasture_Land_Segments,  
legal_acreage as Irr_Pasture_Legal_Acreage,
sum_of_land_seg_mrkt_val as Irr_Pasture_Seg_Market,
total_ag_unit_price as Irr_Pasture_Ag_UnitPrice  
  from  [pacs_oltp].[dbo].[__aland_type] 
   left join __sum_land_seg sls on sls.prop_id=__aland_type.prop_id where Irr_Pasture is not null and Irr_Pasture not like '0%'

GO

