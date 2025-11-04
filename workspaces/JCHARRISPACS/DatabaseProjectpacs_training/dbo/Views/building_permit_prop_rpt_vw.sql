


CREATE VIEW building_permit_prop_rpt_vw
AS
SELECT
    prop_building_permit_assoc.bldg_permit_id,
    property.prop_id, property.prop_type_cd, property.other, property_val.abs_subdv_cd, property_val.map_id,
    account.file_as_name,
    prop_supp_assoc.owner_tax_yr,
    property_val.appraised_val, property_val.legal_desc
FROM
    { oj ((((prop_building_permit_assoc prop_building_permit_assoc INNER JOIN property property ON
        prop_building_permit_assoc.prop_id = property.prop_id)
     INNER JOIN owner owner ON
        property.prop_id = owner.prop_id)
     INNER JOIN prop_supp_assoc prop_supp_assoc ON
        owner.prop_id = prop_supp_assoc.prop_id AND
    owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr AND
    owner.sup_num = prop_supp_assoc.sup_num)
     INNER JOIN account account ON
        owner.owner_id = account.acct_id)
     INNER JOIN property_val property_val ON
        prop_supp_assoc.prop_id = property_val.prop_id AND
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
    prop_supp_assoc.sup_num = property_val.sup_num}

GO

