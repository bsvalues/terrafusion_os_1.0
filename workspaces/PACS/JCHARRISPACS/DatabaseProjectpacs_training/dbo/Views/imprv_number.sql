create view imprv_number as

SELECT *, ROW_NUMBER() OVER (PARTITION BY prop_id ORDER BY imprv_id DESC) AS row_id 
		FROM [pacs_oltp].[dbo].imprv 
			WHERE [pacs_oltp].[dbo].imprv.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) and sale_id=0
			--and imprv_type_cd='c'
			--order by imprv_desc

GO

