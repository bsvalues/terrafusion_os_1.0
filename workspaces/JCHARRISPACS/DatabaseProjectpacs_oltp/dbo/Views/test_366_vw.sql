








CREATE VIEW dbo.test_366_vw
AS
SELECT owner.owner_id, owner.owner_tax_yr, 
    SUM(property_val.assessed_val * owner.pct_ownership / 100) 
    AS owner_assessed_val
FROM prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num AND 
    prop_supp_assoc.prop_id = property_val.prop_id INNER JOIN
    property ON 
    property_val.prop_id = property.prop_id INNER JOIN
    owner ON 
    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr AND 
    prop_supp_assoc.prop_id = owner.prop_id AND 
    prop_supp_assoc.sup_num = owner.sup_num INNER JOIN
    entity_prop_assoc ON 
    prop_supp_assoc.prop_id = entity_prop_assoc.prop_id AND 
    prop_supp_assoc.owner_tax_yr = entity_prop_assoc.tax_yr AND
     prop_supp_assoc.sup_num = entity_prop_assoc.sup_num
WHERE (property.prop_type_cd = 'MN' OR
    property.prop_type_cd = 'P') AND 
    (property_val.prop_inactive_dt IS NULL) AND 
    (NOT EXISTS
        (SELECT *
      FROM owner_links
      WHERE main_owner_id = owner.owner_id))
GROUP BY owner.owner_id, owner.owner_tax_yr
HAVING (SUM(property_val.assessed_val * owner.pct_ownership / 100)
     <= 500)

GO

