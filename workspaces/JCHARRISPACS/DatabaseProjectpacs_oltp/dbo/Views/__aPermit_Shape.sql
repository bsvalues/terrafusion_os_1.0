create view __aPermit_Shape as 
SELECT 
vw.prop_id, bldg_permit_id,
 bldg_permit_status, 
issuer_description,
bldg_permit_num,
bldg_permit_type_cd,
bld_permit_desc,
bldg_permit_issue_dt, 
bldg_permit_cad_status, 
cad_status_description, 
bldg_permit_active, 
file_as_name, 
bldg_permit_val,
bldg_permit_cmnt,
bldg_permit_dt_complete,
coords.XCoord,coords.YCoord, coords.shape
FROM 
BUILDING_PERMIT_VW 					as vw
  LEFT JOIN 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],[Shape].STCentroid().STX as XCoord,	[Shape].STCentroid().STY as YCoord ,shape
		FROM [Benton_spatial_data].[dbo].[PARCELSANDASSESS]
	) as coords ON vw.prop_id = coords.Prop_ID AND coords.order_id = 1
WHERE 
bldg_permit_issue_dt > '2019-01-01' AND bldg_permit_issue_dt < GETDATE()

--ORDER BY vw.prop_id, bldg_permit_issue_dt DESC

GO

