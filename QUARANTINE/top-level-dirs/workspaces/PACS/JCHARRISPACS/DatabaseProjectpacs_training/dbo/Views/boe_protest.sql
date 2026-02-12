
create view [dbo].[boe_protest] as
SELECT  [_arb_protest].[prop_id]
      ,[prop_val_yr]
      ,[case_id]
      ,[prot_create_dt]
      ,[prot_complete_dt]
      ,[prot_type]
      ,[prot_status]
	   ,[opinion_of_value]
      ,[prot_taxpayer_comments]
     ,[prot_appraiser_assigned_imprv_val]
	 ,[prot_appraiser_assigned_land_val]
      ,[prot_appraiser_assigned_val]
      ,[closed_pacs_user_id]
      ,[bGenerateCompGrid]
      ,[status_date_changed]
      ,[status_changed_user_id]
      ,[associated_inquiry]
      
      ,[prot_appr_docket_id]
      ,[case_prepared]
	  
      ,[decision_reason_cd]
	  ,XCoord
	  ,YCoord
      ,[Geometry]
  FROM [pacs_oltp].[dbo].[_arb_protest]
														

	 left join

  (SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [OBJECTID] DESC) 
AS order_id,
[Prop_ID],
[Geometry],
 [CENTROID_X]as XCoord,
      [CENTROID_Y]  as YCoord 


FROM 
[Benton_spatial_data].[dbo].[PARCEL]
) as coords
 
ON 

[_arb_protest].[prop_id] = coords.Prop_ID AND coords.order_id = 1

WHERE 
XCoord IS NOT NULL 
--and
--prop_val_yr = --2018 (select appr_yr  from pacs_oltp.dbo.pacs_system)  

GO

