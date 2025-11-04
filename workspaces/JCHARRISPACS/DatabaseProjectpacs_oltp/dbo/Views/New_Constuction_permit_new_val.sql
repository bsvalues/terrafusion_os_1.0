   create view New_Constuction_permit_new_val as
   SELECT prop_id, ROW_NUMBER() over (partition by prop_id ORDER BY bldg_permit_id DESC) AS order_id,new_value 
			FROM [pacs_oltp].[dbo].[New_Const_current]

GO

