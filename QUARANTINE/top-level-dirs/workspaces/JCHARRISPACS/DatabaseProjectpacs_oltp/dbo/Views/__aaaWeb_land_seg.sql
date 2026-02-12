create view __aaaWeb_land_seg as 
SELECT 
ld.[prop_id]
, [land_seg_id]
      ,[sale_id]
      ,[land_type_cd]
      ,[land_type_desc]
      ,[size_acres]
      ,[size_square_feet]
      ,[effective_front]
      ,[effective_depth]
      ,[land_seg_mkt_val]
      ,[ag_val]
      ,[mkt_unit_price]
      ,[ls_code]
      ,[ls_method]
      ,[owner_tax_yr]
      ,[sup_num]
	  ,XCoord,YCoord,shape
  FROM [pacs_oltp].[dbo].[web_land_detail_vw] ld
  inner join 
(select CENTROID_X as Xcoord,CENTROID_Y as Ycoord,shape,prop_id
from benton_spatial_data.dbo.[PARCELSANDASSESS])as sp on ld.prop_id=sp.prop_id


  where owner_tax_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)

GO

