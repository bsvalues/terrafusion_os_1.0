create view ls_SecondaryComm_Idust_Land as
select distinct
SecondaryComm_Indust_Land,
sls.[prop_id]as prop_id,
sum_of_land_segs as SecondaryComm_Indust_Land_Land_Segments,  
legal_acreage as SecondaryComm_Indust_Land_Legal_Acreage,
sum_of_land_seg_mrkt_val as SecondaryComm_Indust_Land_Seg_Market,
total_ag_unit_price as SecondaryComm_Indust_Land_Ag_UnitPrice  
  from  [pacs_oltp].[dbo].[__aland_type] 
   left join __sum_land_seg sls on sls.prop_id=__aland_type.prop_id where SecondaryComm_Indust_Land is not null and SecondaryComm_Indust_Land not like '0%'

GO

