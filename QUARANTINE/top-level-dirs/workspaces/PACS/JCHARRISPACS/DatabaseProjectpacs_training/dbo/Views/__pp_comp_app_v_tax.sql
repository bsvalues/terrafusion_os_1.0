/****** Script for SelectTopNRows command from SSMS  ******/
create view __pp_comp_app_v_tax as 

SELECT ppa.[prop_id]
      ,ppa.[geo_id]
      ,ppa.[file_as_name]
      ,ppa.[addr_line1]
      ,ppa.[addr_line2]
      ,ppa.[addr_line3]
      ,ppa.[addr_city]
      ,ppa.[addr_state]
      ,ppa.[addr_zip]
      ,ppa.[situs_display]
      ,ppa.[tax_area_number]
      ,ppa.[If populated, this is Farm Asset]
	  ,ppt.[If populated, this is Farm Asset]			'	tax_yr	[If populated, this is Farm Asset]	 '
      ,ppa.[appraised_non_classified]	
	  ,	ppt.	[appraised_non_classified]				'	tax_yr	[appraised_non_classified]	 '
      ,ppa.[Total_Appraised_Value]
	  ,	ppt.	[Total_Appraised_Value]					'	tax_yr	[Total_Appraised_Value]	 '
      ,ppa.[If populated, this is a Farm Asset]
	  ,	ppt.	[If populated, this is a Farm Asset]	'	tax_yr	[If populated, this is a Farm Asset]	 '
      ,ppa.[taxable_non_classified]
	  ,	ppt.	[taxable_non_classified]				'	tax_yr	[taxable_non_classified]	 '
      ,ppa.[Total_Taxable_Value]
	  ,	ppt.	[Total_Taxable_Value]					'	tax_yr	[Total_Taxable_Value]'
      ,ppa.[Exemptions]
	  ,	ppt.	[Exemptions]							'	tax_yr	[Exemptions]	 '

      ,ppa.[dba_name]
	   ,	ppt.	[dba_name]							'	tax_yr	[dba_name]	 '


	   		 
      ,ppa.[prop_val_yr]

  FROM [pacs_oltp].[dbo].[__Pers_Prop] as ppa
  left join 
  [pacs_oltp].[dbo].[__Pers_Prop_tax yr] as ppt
  on ppa.prop_id=ppt.prop_id

GO

