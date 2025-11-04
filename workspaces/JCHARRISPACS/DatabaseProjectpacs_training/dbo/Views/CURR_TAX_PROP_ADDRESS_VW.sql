




CREATE VIEW CURR_TAX_PROP_ADDRESS_VW
AS
SELECT property_val.legal_desc,
	property.col_owner_id as owner_id, 
	owner.pct_ownership,
	account.file_as_name, 
	address.addr_line1,
	address.addr_line2,
	address.addr_line3, 
	address.addr_city,
	address.addr_state,
	address.addr_zip, 
	address.country_cd,
	address.primary_addr, 
	address.is_international,
	prop_supp_assoc.owner_tax_yr,
	prop_supp_assoc.sup_num, 
	property.geo_id,
	address.ml_deliverable, 
	prop_supp_assoc.prop_id,
	property.ref_id1,
	property.ref_id2, 
	property_type.prop_type_desc,
	property.prop_type_cd,
        situs.primary_situs, situs.situs_num,
        situs.situs_street_prefx, situs.situs_street,
        situs.situs_street_sufix, situs.situs_unit,
        situs.situs_city, situs.situs_state,
        situs.situs_zip, situs.situs_display,
	REPLACE(situs.situs_display, CHAR(13) + CHAR(10), ' ') as situs
FROM account as a
INNER JOIN	owner ON 
		a.acct_id = owner.owner_id 

INNER JOIN	prop_supp_assoc ON 
		owner.prop_id = prop_supp_assoc.prop_id 
AND owner.owner_tax_yr = prop_supp_assoc.owner_tax_yr 
AND owner.sup_num = prop_supp_assoc.sup_num 

INNER JOIN	property_val ON
		property_val.prop_id = prop_supp_assoc.prop_id 
AND property_val.sup_num = prop_supp_assoc.sup_num 
AND property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr 

INNER JOIN	property ON 
		prop_supp_assoc.prop_id = property.prop_id 

INNER join account on
	account.acct_id = property.col_owner_id 

INNER JOIN	property_type ON 
		property.prop_type_cd = property_type.prop_type_cd 
LEFT OUTER JOIN	situs ON 
		property.prop_id = situs.prop_id 
AND situs.primary_situs = 'Y' 
LEFT OUTER JOIN	address ON 
		property.col_owner_id = address.acct_id 
AND address.primary_addr = 'Y'

WHERE prop_supp_assoc.owner_tax_yr IN
(
	SELECT MAX(owner_tax_yr)
	FROM prop_supp_assoc AS psa, pacs_system
	WHERE psa.prop_id = property_val.prop_id
		AND owner_tax_yr <= pacs_system.tax_yr
)

GO

