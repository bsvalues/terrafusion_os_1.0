create view lease_hold_properties as
SELECT  bs.[prop_id]
      ,[prop_val_yr]
      ,[geo_id]
      ,[prop_type_cd]
      ,[prop_type_desc]
      ,[dba_name]
      ,[legal_desc]
      ,[appraised_val]
      ,[abs_subdv_cd]
      ,[mapsco]
      ,[map_id]
      ,[udi_parent_prop_id]
      ,[agent_cd]
      ,[situs_display]
      ,[situs_num]
      ,[situs_street]
      ,[street_name]
      ,[situs_city]
      ,[hood_cd]
      ,[hood_name]
      ,[owner_name]
      ,[addr_line1]
      ,[addr_line2]
      ,[addr_line3]
      ,[addr_city]
      ,[addr_state]
      ,[addr_zip]
      ,[country_cd]
      ,[owner_id]
      ,[pct_ownership]
      ,[udi_child_prop_id]
      ,[percent_type]
      ,[exemptions]
      ,[state_cd]
      ,[jurisdictions]
      ,[image_path]
      ,[show_values]
      ,[tax_area_id]
      ,[tax_area]
      ,[dor_use_code]
      ,[open_space]
      ,[dfl]
      ,[historic]
      ,[remodel]
      ,[multi_fam]
      ,[township_code]
      ,[range_code]
      ,[township_section]
      ,[legal_acreage]
      ,[non_taxed_mkt_val]
      ,[is_leased_land_property]
      ,[web_suppression]
      ,[confidential_flag]
      ,[certification_dt]
      ,[all_taxes_paid]
      ,[sale_date]
      ,[township]
      ,[Range]
	  
      ,XCoord
      ,YCoord
      ,[Geometry]
	  
  FROM [web_internet_benton].[dbo].[clientdb_property_vw]
  left join 
( SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [Shape_Area] DESC) 
AS order_id,
[Prop_ID],
[Geometry].STCentroid().STX as XCoord,
[Geometry].STCentroid().STY as YCoord ,
geometry

FROM 
[Benton_spatial_data].[dbo].[parcel]) bs 
  
  on [web_internet_benton].[dbo].[clientdb_property_vw].[prop_id]=bs.prop_id

  where prop_val_yr= (select appr_yr from pacs_oltp.dbo.pacs_system)
  and hood_cd like '8%'

GO

