


CREATE VIEW dbo.FEE_PROP_ASSOC_VW
AS
/*
	Note that although the view is named fee_prop_assoc_vw,
	it is actually for tax certificates, whose fees are
	always tied to an account
*/
SELECT prop_supp_assoc.owner_tax_yr, address.primary_addr, 
    owner.owner_id, account.file_as_name, owner.pct_ownership, 
    address.addr_line1, address.addr_line2, address.addr_line3, 
    address.addr_city, address.addr_state, address.addr_zip, 
    property.geo_id, property_val.land_hstd_val, 
    property_val.land_non_hstd_val, property_val.imprv_hstd_val, 
    property_val.imprv_non_hstd_val, property_val.assessed_val, 
    property_val.ag_market, property_val.ag_use_val, 
    property_val.timber_market, property_val.timber_use, 
    property_val.legal_desc, property_val.legal_acreage, 
    fee_tax_cert_assoc.prop_id, fee_tax_cert_assoc.tax_cert_num, 
    fee_tax_cert_assoc.ref_num, fee_tax_cert_assoc.effective_dt, 
    fee_tax_cert_assoc.comment, fee_tax_cert_assoc.fee_id
FROM address RIGHT OUTER JOIN
    owner INNER JOIN
    account ON owner.owner_id = account.acct_id INNER JOIN
    fee_tax_cert_assoc INNER JOIN
    property INNER JOIN
    prop_supp_assoc INNER JOIN
    property_val ON 
    prop_supp_assoc.prop_id = property_val.prop_id AND 
    prop_supp_assoc.owner_tax_yr = property_val.prop_val_yr AND
     prop_supp_assoc.sup_num = property_val.sup_num ON 
    property.prop_id = prop_supp_assoc.prop_id ON 
    fee_tax_cert_assoc.prop_id = property.prop_id ON 
    owner.prop_id = property_val.prop_id AND 
    owner.owner_tax_yr = property_val.prop_val_yr AND 
    owner.sup_num = property_val.sup_num ON 
    address.acct_id = account.acct_id
WHERE (prop_supp_assoc.owner_tax_yr IN
        (SELECT MAX(owner_tax_yr)
      FROM prop_supp_assoc AS psa, pacs_system
      WHERE psa.prop_id = property_val.prop_id AND 
           owner_tax_yr <= pacs_system.tax_yr)) AND 
    ((address.primary_addr = 'T') OR
    (address.primary_addr = 'Y'))

GO

