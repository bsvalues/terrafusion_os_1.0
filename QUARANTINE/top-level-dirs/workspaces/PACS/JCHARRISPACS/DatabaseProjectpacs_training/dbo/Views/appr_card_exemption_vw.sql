
CREATE VIEW dbo.appr_card_exemption_vw
AS
SELECT property_exemption.prop_id, 
    property_exemption.exmpt_tax_yr, 
    property_exemption.exmpt_type_cd, exmpt_type.exmpt_desc, 
    property_exemption.sup_num,
	property_exemption.owner_id
FROM property_exemption INNER JOIN
    exmpt_type ON 
    property_exemption.exmpt_type_cd = exmpt_type.exmpt_type_cd
	AND property_exemption.exmpt_type_cd NOT IN ('AG') --HS13853 added this to not show ag PratimaV

GO

