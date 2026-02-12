


CREATE VIEW [dbo].[BUILDING_PERMIT_VW]
AS
SELECT bp.bldg_permit_id,
    bp.bldg_permit_sub_type_cd, 
	bld_permit_sub_type.Description								as sub_type_description,
	bp.bldg_permit_status, 
	bp_issuer_status_cd.Description								as issuer_description,
	bp.bldg_permit_cmnt,
    bp.bldg_permit_num, 
    bp.bldg_permit_street_num, 
	bp.bldg_permit_street_prefix, 
	bp.bldg_permit_street_name, 
	bp.bldg_permit_street_suffix, 
    bp.bldg_permit_city,
	appraiser.appraiser_nm, 
    bp.bldg_permit_type_cd, bld_permit_type.bld_permit_desc, bld_permit_type.permit_type_flag,
	bp.bldg_permit_issue_dt,
	bp.bldg_permit_issued_to, 
	bp.bldg_permit_appraiser_id, 
    bldg_permit_cad_status, 
	bp_cad_status_cd.Description as cad_status_description,
	bldg_permit_val,
	bldg_permit_area,bldg_permit_county_percent_complete,bldg_permit_desc,bldg_permit_dt_worked,bldg_permit_dt_complete,
    bldg_permit_res_com,

    bldg_permit_sub_division,
    bldg_permit_plat,
 

    bldg_permit_active,
    BUILDING_PERMIT_PROP_VW.prop_id, 
    BUILDING_PERMIT_PROP_VW.file_as_name
   -- bp.bldg_permit_val

FROM 
		bld_permit_type 
	RIGHT OUTER JOIN
		BUILDING_PERMIT_PROP_VW 
	RIGHT OUTER JOIN
		building_permit bp ON  BUILDING_PERMIT_PROP_VW.bldg_permit_id = bp.bldg_permit_id ON  bld_permit_type.bld_permit_type_cd = bp.bldg_permit_type_cd
    LEFT OUTER JOIN 
		bp_issuer_status_cd ON  bp.bldg_permit_status = bp_issuer_status_cd.IssuerStatus
    LEFT OUTER JOIN 
		bld_permit_sub_type ON bp.bldg_permit_sub_type_cd = bld_permit_sub_type.PermitSubtypeCode
    LEFT OUTER JOIN 
		appraiser ON bp.bldg_permit_appraiser_id = appraiser.appraiser_id
    LEFT OUTER JOIN 
		bp_cad_status_cd ON bp.bldg_permit_cad_status = bp_cad_status_cd.CadStatus

GO

