
CREATE VIEW dbo.property_supp_exemption_vw
AS
SELECT prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr, prop_supp_assoc.sup_num, 
    owner.owner_id, property_exemption.exmpt_type_cd
FROM prop_supp_assoc INNER JOIN
    owner ON prop_supp_assoc.prop_id = owner.prop_id AND 
    prop_supp_assoc.owner_tax_yr = owner.owner_tax_yr AND 
    prop_supp_assoc.sup_num = owner.sup_num INNER JOIN
    property_exemption ON 
    owner.owner_id = property_exemption.owner_id AND 
    owner.prop_id = property_exemption.prop_id AND 
    owner.owner_tax_yr = property_exemption.exmpt_tax_yr AND 
    owner.owner_tax_yr = property_exemption.owner_tax_yr AND 
    owner.sup_num = property_exemption.sup_num

GO

