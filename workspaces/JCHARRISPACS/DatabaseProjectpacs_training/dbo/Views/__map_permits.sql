create view  __map_permits as

SELECT 
prop_id, 
bldg_permit_id,
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
bldg_permit_dt_complete
FROM 
BUILDING_PERMIT_VW 					as vw
WHERE 
bldg_permit_issue_dt > '2017-01-01' AND bldg_permit_issue_dt < GETDATE()

GO

