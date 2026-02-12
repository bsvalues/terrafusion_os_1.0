



CREATE VIEW dbo.PROPERTY_BUILDING_PERMIT_VW
AS
SELECT prop_building_permit_assoc.prop_id, 
    building_permit.bldg_permit_id, 
    building_permit.bldg_permit_type_cd, 
    bld_permit_type.bld_permit_desc, 
    building_permit.bldg_permit_num, 
    building_permit.bldg_permit_issue_dt, 
    building_permit.bldg_permit_builder, 
    building_permit.bldg_permit_val, 
    building_permit.bldg_permit_area
FROM prop_building_permit_assoc RIGHT OUTER JOIN
    building_permit ON 
    prop_building_permit_assoc.bldg_permit_id = building_permit.bldg_permit_id
     LEFT OUTER JOIN
    bld_permit_type ON 
    building_permit.bldg_permit_type_cd = bld_permit_type.bld_permit_type_cd

GO

