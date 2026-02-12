
create view [dbo].[permits_current] as 
SELECT     prop_building_permit_assoc.prop_id,   building_permit.bldg_permit_id, building_permit.bldg_permit_status, building_permit.bldg_permit_cad_status, building_permit.bldg_permit_type_cd, building_permit.bldg_permit_sub_type_cd, 
                         building_permit.bldg_permit_num, building_permit.bldg_permit_issuer, building_permit.bldg_permit_issue_dt, building_permit.bldg_permit_limit_dt, building_permit.bldg_permit_dt_complete, 
                         building_permit.bldg_permit_val, building_permit.bldg_permit_appraiser_id, building_permit.bldg_permit_dt_worked, building_permit.bldg_permit_pct_complete, 
                         building_permit.bldg_permit_builder, building_permit.bldg_permit_builder_phone, building_permit.bldg_permit_active, building_permit.bldg_permit_last_chg, building_permit.bldg_permit_cmnt, 
                         building_permit.bldg_permit_issued_to, building_permit.bldg_permit_owner_phone, building_permit.bldg_permit_res_com, building_permit.bldg_permit_source, building_permit.bldg_permit_pct_complete_override, building_permit.bldg_permit_calc_value, building_permit.bldg_permit_desc, 
                         building_permit.bldg_permit_county_percent_complete, building_permit.bldg_permit_import_status, building_permit.active_bit, building_permit.bldg_permit_other_id, 
                         building_permit.bldg_permit_worksheet_type_cd
						 , coords.XCoord, coords.YCoord
FROM            building_permit LEFT OUTER JOIN
                         prop_building_permit_assoc ON building_permit.bldg_permit_id = prop_building_permit_assoc.bldg_permit_id

						 INNER JOIN

(SELECT     prop_id, abs_subdv, neighborhood, subset, map_id, region, state_cd, property_use_cd
FROM          pacs_oltp.dbo.property_profile p (nolock)

WHERE      (prop_val_yr IN

(SELECT     appr_yr
FROM          pacs_oltp.dbo.pacs_system))) AS pp ON prop_building_permit_assoc.prop_id = pp.prop_id 

inner join 
((SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[Shape].STCentroid().STX as XCoord,[Shape].STCentroid().STY as YCoord 
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS])) as coords
		on prop_building_permit_assoc.prop_id=coords.prop_id
where 
bldg_permit_active='t'

GO

