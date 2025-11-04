create view __aaMainArea as
SELECT  [prop_id]
      ,[prop_val_yr]
    ,[imprv_det_type_cd] 



 
  FROM [pacs_oltp].[dbo].[imprv_detail]
	 where  prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
			and sale_id=0
			--and
			and imprv_det_desc='Main Area' 
			and [imprv_det_type_cd] like 'MA%'

			--as id on imprv_fix.prop_id = id.prop_id AND imprv_fix.imprv_id = id.imprv_id AND 			imprv_items.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) 

GO

