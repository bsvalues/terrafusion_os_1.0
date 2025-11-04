


CREATE VIEW dbo.supp_real_mobile_totals_vw
AS
SELECT COUNT(property.prop_id) AS prop_count, 
    SUM(property_val.land_hstd_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS land_hstd_val, 
    SUM(property_val.land_non_hstd_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS land_non_hstd_val, 
    SUM(property_val.imprv_hstd_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS imprv_hstd_val, 
    SUM(property_val.imprv_non_hstd_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS imprv_non_hstd_val, 
    SUM(property_val.ag_market * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS ag_market, 
    SUM(property_val.timber_market * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS timber_market, 
    SUM(property_val.appraised_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS appraised_val, 
    entity_prop_assoc.entity_id, 
    SUM(property_val.timber_use * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS timber_use, 
    SUM(property_val.ag_use_val * entity_prop_assoc.entity_prop_pct
     / 100 * owner.pct_ownership / 100) AS ag_use_val, 
    property_val.prop_val_yr AS owner_tax_yr, 
    property_val.sup_num
FROM property_val INNER JOIN
    property ON 
    property_val.prop_id = property.prop_id INNER JOIN
    entity_prop_assoc ON 
    property_val.prop_id = entity_prop_assoc.prop_id AND 
    property_val.prop_val_yr = entity_prop_assoc.tax_yr AND 
    property_val.sup_num = entity_prop_assoc.sup_num INNER JOIN
    owner ON 
    property_val.prop_val_yr = owner.owner_tax_yr AND 
    property_val.prop_id = owner.prop_id AND 
    property_val.sup_num = owner.sup_num
WHERE (property.prop_type_cd = 'R' OR
    property.prop_type_cd = 'MH') AND 
    (property_val.prop_inactive_dt IS NULL) AND 
    (NOT EXISTS
        (SELECT *
      FROM property_exemption
      WHERE property_exemption.prop_id = property_val.prop_id AND
            property_exemption.sup_num = property_val.sup_num
            AND 
           property_exemption.owner_tax_yr = property_val.prop_val_yr
            AND 
           ((property_exemption.exmpt_type_cd = 'EX' AND 
           termination_dt IS NULL AND effective_dt IS NULL) OR
           (property_exemption.exmpt_type_cd = 'EX' AND 
           effective_dt IS NOT NULL AND datepart(year, 
           effective_dt) > property_val.prop_val_yr) OR
           (property_exemption.exmpt_type_cd = 'EX' AND 
           termination_dt IS NOT NULL AND datepart(year, 
           termination_dt) > property_val.prop_val_yr))))
GROUP BY entity_prop_assoc.entity_id, property_val.prop_val_yr, 
    property_val.sup_num

GO

