
create view [dbo].[__Commercail_Exempt] as
SELECT ce.[prop_id]
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
	  ,xcoord
      ,YCoord
      ,[Shape]

  FROM [pacs_oltp].[dbo].[__Com_exempt]ce
 LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[Shape].STCentroid().STX as XCoord,	[Shape].STCentroid().STY as YCoord ,shape
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]) sp on ce.prop_id=sp.prop_id

GO

