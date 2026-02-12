

CREATE VIEW dbo.income_prop_link_vw
AS
SELECT     dbo.income_prop_assoc.income_id, dbo.income_prop_assoc.prop_id, dbo.income_prop_assoc.sup_num, dbo.income_prop_assoc.prop_val_yr, 
                      dbo.property_val.legal_desc, dbo.situs.primary_situs,
                      dbo.situs.situs_num, dbo.situs.situs_street_prefx, dbo.situs.situs_street,
                      dbo.situs.situs_street_sufix, dbo.situs.situs_unit, dbo.situs.situs_city, dbo.situs.situs_state,
                      dbo.situs.situs_zip, dbo.situs.situs_display,
                      dbo.income_prop_assoc.income_pct, dbo.income_prop_assoc.income_value
FROM         dbo.income_prop_assoc INNER JOIN
                      dbo.prop_supp_assoc ON dbo.income_prop_assoc.prop_id = dbo.prop_supp_assoc.prop_id AND 
                      dbo.income_prop_assoc.prop_val_yr = dbo.prop_supp_assoc.owner_tax_yr AND 
                      dbo.income_prop_assoc.sup_num = dbo.prop_supp_assoc.sup_num INNER JOIN
                      dbo.property_val ON dbo.prop_supp_assoc.prop_id = dbo.property_val.prop_id AND 
                      dbo.prop_supp_assoc.owner_tax_yr = dbo.property_val.prop_val_yr AND 
                      dbo.prop_supp_assoc.sup_num = dbo.property_val.sup_num LEFT OUTER JOIN
                      dbo.situs ON dbo.property_val.prop_id = dbo.situs.prop_id

GO

