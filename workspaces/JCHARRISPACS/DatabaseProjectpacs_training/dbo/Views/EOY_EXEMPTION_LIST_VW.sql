
CREATE VIEW dbo.EOY_EXEMPTION_LIST_VW
AS
SELECT distinct property.exmpt_reset, property_exemption.exmpt_type_cd, 
    prop_supp_assoc.prop_id, 
    prop_supp_assoc.owner_tax_yr,
    ac.file_as_name,   property.geo_id, a.addr_zip, a.zip, a.cass, a.route, a.zip_4_2
FROM property INNER JOIN
    prop_supp_assoc ON 
    property.prop_id = prop_supp_assoc.prop_id INNER JOIN
    property_exemption ON 
    prop_supp_assoc.prop_id = property_exemption.prop_id AND 
    prop_supp_assoc.sup_num = property_exemption.sup_num AND
     prop_supp_assoc.owner_tax_yr = property_exemption.owner_tax_yr
INNER JOIN
    account ac ON
    ac.acct_id = property_exemption.owner_id
LEFT OUTER JOIN address a ON
        ac.acct_id = a.acct_id AND
	a.primary_addr = 'Y'
WHERE (property.exmpt_reset = 'T')

GO

