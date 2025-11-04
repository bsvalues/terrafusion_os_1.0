


CREATE VIEW dbo.CURR_PROPERTY_MORTGAGE_VW
AS
SELECT prop_supp_assoc.owner_tax_yr AS sup_yr, 
    prop_supp_assoc.sup_num, p.prop_type_cd, 
    t.prop_type_desc, property_val.legal_desc, 
    p.prop_id AS mortgage_prop_id, property_val.prop_inactive_dt, 
    mortgage_assoc.mortgage_co_id, 
    property_val.prop_val_yr
FROM property_type t INNER JOIN
    property p ON t.prop_type_cd = p.prop_type_cd INNER JOIN
    prop_supp_assoc ON 
    p.prop_id = prop_supp_assoc.prop_id INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.sup_num = property_val.sup_num AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr INNER
     JOIN
    mortgage_assoc ON 
    p.prop_id = mortgage_assoc.prop_id
WHERE (property_val.prop_inactive_dt IS NULL) AND 
    (property_val.prop_val_yr IN
        (SELECT MAX(owner_tax_yr)
      FROM prop_supp_assoc
      WHERE prop_id = p.prop_id))

GO

