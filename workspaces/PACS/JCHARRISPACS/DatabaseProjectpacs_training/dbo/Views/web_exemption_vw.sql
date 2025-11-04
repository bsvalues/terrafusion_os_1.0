
CREATE VIEW dbo.web_exemption_vw
AS
SELECT prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, prop_supp_assoc.sup_num, 
    owner.owner_id, property_exemption.exmpt_type_cd
FROM owner INNER JOIN
    prop_supp_assoc ON 
    owner.prop_id = prop_supp_assoc.prop_id AND 
    owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr AND 
    owner.sup_num = prop_supp_assoc.sup_num RIGHT OUTER JOIN
    property_exemption ON 
    owner.prop_id = property_exemption.prop_id AND 
    owner.owner_id = property_exemption.owner_id AND 
    owner.owner_tax_yr = property_exemption.owner_tax_yr AND 
    owner.sup_num = property_exemption.sup_num

GO

