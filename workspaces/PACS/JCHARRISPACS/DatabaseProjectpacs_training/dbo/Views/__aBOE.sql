
create view [dbo].[__aBOE] as
SELECT 
		[ParcelID]
      ,[geo_id]
      ,[simple_geo_id]
      ,[CaseYear]
      ,[SupNumber]
      ,[Owner]
      ,[legal_desc]
      ,[abs_subdv_cd]
      ,[hood_cd]
      ,[PTD]
      ,[prop_type_cd]
      ,[market]

      ,[owner_id]
      ,[ref_id1]
      ,[protest_by_name]
   
      ,[hearing_appraisal_staff_name] as appraisal_staff

    
  
      
      ,[prot_full_ratification_dt] as ratification_dt
      ,[begin_land_hstd_val]
      ,[begin_land_non_hstd_val]
      ,[begin_imprv_hstd_val]
      ,[begin_imprv_non_hstd_val]
      ,[begin_ag_use_val]
      ,[begin_ag_market]
   
      ,[begin_market]
      ,[begin_appraised_val]
      ,[begin_ten_percent_cap]
      ,[begin_assessed_val]
      ,[begin_rendered_val]
      ,[begin_exemptions]
  
      ,[final_land_hstd_val]
      ,[final_land_non_hstd_val]
      ,[final_imprv_hstd_val]
      ,[final_imprv_non_hstd_val]
      ,[final_ag_use_val]
      ,[final_ag_market]
      ,[final_market]
      ,[final_appraised_val]
      ,[final_ten_percent_cap]
      ,[final_assessed_val]
      ,[final_rendered_val]
      ,[final_exemptions]
      ,[final_entities]
      ,[Appraiser]
      ,[hearing_scheduled_date]
      ,[docket_id]
      ,[last_appraiser_id]
      ,[imprv_type_cd]
      ,[property_use_cd]
      ,[lProtestCount]
      ,[hearing_appraisor_full_name]
      ,[lProtestByCount]
      ,[offsite]
      ,[img_path]
      ,[dtObject]
      ,[Xcoord]
      ,[YCoord]
  FROM [pacs_oltp].[dbo].[__boe_vw]
  where CaseYear=(select appr_yr -1 from pacs_oltp.dbo.pacs_system)

GO

