create view exemp_gov as 
SELECT  g.[prop_id]
      ,[owner_id]
      ,[exmpt_tax_yr]
      ,[owner_tax_yr]
      ,[prop_type_cd]
      ,[exmpt_type_cd]
      ,[applicant_nm]
      ,[sup_num]
      ,[effective_tax_yr]
      ,[qualify_yr]
      ,[sp_date_approved]
      ,[sp_expiration_date]
      ,[sp_comment]
      ,[sp_value_type]
      ,[sp_value_option]
      ,[absent_flag]
      ,[absent_expiration_date]
      ,[absent_comment]
      ,[deferral_date]
      ,[apply_local_option_pct_only]
      ,[apply_no_exemption_amount]
      ,[exmpt_subtype_cd]
      ,[exemption_pct]
	    ,[CENTROID_X]
        ,[CENTROID_Y]
	   -- ,[Shape]
		,[Shape_Leng]
   
	   FROM [pacs_oltp].[dbo].[__Gov_exempt] g
  
inner join 
(select [OBJECTID_1]
      ,[Shape]
      ,[Parcel_ID]
      ,[Prop_ID]
      ,[CENTROID_X]
      ,[CENTROID_Y]
      ,[Shape_Leng]
      ,[OBJECTID]
from [pacs_oltp].[dbo].[_PARCEL_])as sp on g.prop_id=sp.prop_id

GO

