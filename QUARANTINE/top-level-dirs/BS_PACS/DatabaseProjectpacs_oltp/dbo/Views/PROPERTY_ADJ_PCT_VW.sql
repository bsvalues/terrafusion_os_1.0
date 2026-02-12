


CREATE VIEW dbo.PROPERTY_ADJ_PCT_VW
AS
SELECT neighborhood.hood_land_pct, 
    neighborhood.hood_imprv_pct, abs_subdv.abs_imprv_pct, 
    abs_subdv.abs_land_pct, prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, property_val.hood_cd, 
    property_val.abs_subdv_cd
FROM property_val INNER JOIN
    prop_supp_assoc ON 
    property_val.prop_id = prop_supp_assoc.prop_id AND 
    property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr AND
     property_val.sup_num = prop_supp_assoc.sup_num LEFT OUTER
     JOIN
    neighborhood ON 
    property_val.hood_cd = neighborhood.hood_cd AND 
    property_val.prop_val_yr = neighborhood.hood_yr LEFT OUTER JOIN
    abs_subdv ON 
    property_val.abs_subdv_cd = abs_subdv.abs_subdv_cd AND 
    property_val.prop_val_yr = abs_subdv.abs_subdv_yr

GO

