

Create View Main_Area_cd as
--(
SELECT *, ROW_NUMBER() OVER (PARTITION BY prop_id ORDER BY imprv_det_val DESC) AS row_id 
		FROM [pacs_oltp].[dbo].imprv_detail
			WHERE [pacs_oltp].[dbo].imprv_detail.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system) 
			--and sale_id=0
			and imprv_detail.imprv_det_desc like 'Main Area'
			and imprv_detail.imprv_det_type_cd like '%MA%'
			--) as idf			ON land.prop_id = idf.prop_id AND imprv_fix.row_id = 1 AND idf.prop_val_yr = (select appr_yr from [pacs_oltp].[dbo].pacs_system)

GO

