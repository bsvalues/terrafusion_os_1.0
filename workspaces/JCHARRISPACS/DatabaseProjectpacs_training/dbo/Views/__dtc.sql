

create view [dbo].[__dtc] as 
Select [prop_id] ,imprv_id, imprv_det_meth_cd
	  ,imprv_det_val   
      ,[imprv_det_class_cd]
	  ,[condition_cd]
      ,[imprv_det_type_cd]       
      ,[imprv_det_desc]
      ,[imprv_det_area]      
      ,[unit_price]
      ,[yr_built]
      ,[imprv_det_adj_val]
      ,[ref_id1]
FROM [pacs_oltp].[dbo].[imprv_detail]
	where prop_val_yr=(select appr_yr  from pacs_oltp.dbo.pacs_system)  
		-- and imprv_det_type_cd ='covdeck'
			and sup_num=0
				 and sale_id=0

GO

