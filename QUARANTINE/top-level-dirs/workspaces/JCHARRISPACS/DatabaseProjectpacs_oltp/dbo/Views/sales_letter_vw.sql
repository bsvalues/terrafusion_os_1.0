
CREATE VIEW [dbo].[sales_letter_vw]
AS
SELECT coo.chg_of_owner_id, 
	coo.deed_num, 
	coo.deed_book_id,
	coo.deed_book_page,
	coo.deed_dt,
	coo.coo_sl_dt,
	pv.legal_desc,
	pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_market + pv.timber_market AS land_market_val,
	pv.imprv_hstd_val + pv.imprv_non_hstd_val AS imprv_market_val, 
	pv.land_hstd_val + pv.land_non_hstd_val + pv.ag_market + pv.timber_market + pv.imprv_hstd_val + pv.imprv_non_hstd_val AS market_value,
	buyer_account.file_as_name AS buyer_name, 
	buyer_address.primary_addr AS buyer_primary_addr, 
	buyer_address.addr_line1 AS buyer_addr_line1, 
	buyer_address.addr_line2 AS buyer_addr_line2, 
	buyer_address.addr_line3 AS buyer_addr_line3, 
	buyer_address.addr_city AS buyer_addr_city, 
	buyer_address.addr_state AS buyer_addr_state, 
	buyer_address.country_cd AS buyer_country_cd, 
	buyer_address.addr_zip AS buyer_addr_zip, 
	sa.seller_id, 
	seller_account.file_as_name AS seller_name, 
	seller_address.primary_addr AS seller_primary_addr, 
	seller_address.addr_line1 AS seller_addr_line1, 
	seller_address.addr_line2 AS seller_addr_line2, 
	seller_address.addr_line3 AS seller_addr_line3, 
	seller_address.addr_city AS seller_addr_city, 
	seller_address.addr_state AS seller_addr_state, 
	seller_address.country_cd AS seller_country_cd, 
	seller_address.addr_zip AS seller_addr_zip,
	p.prop_id, 
	p.geo_id,
	p.prop_type_cd,
	pv.map_id,
        situs.primary_situs, situs.situs_num, situs.situs_street_prefx,
        situs.situs_street, situs.situs_street_sufix, situs.situs_unit,
        situs.situs_city, situs.situs_state, situs.situs_zip, situs.situs_display,
	coo.buyer_lttr_prt_dt,
	coo.seller_lttr_prt_dt,
	coo.lttr_id,
	ba.buyer_id,
	coo.deed_type_cd,
	s.sl_state_cd,
	s.sl_school_id,
	s.sl_type_cd,
	(select count(coopa.prop_id) from chg_of_owner_prop_assoc coopa where chg_of_owner_id = coo.chg_of_owner_id) as prop_count,
	buyer_address.zip as buyer_address_zip,
	buyer_address.zip_4_2 as buyer_address_zip_4_2,
	buyer_address.cass as buyer_address_cass,
	seller_address.zip as seller_address_zip,
	seller_address.zip_4_2 as seller_address_zip_4_2,
	seller_address.cass as seller_address_cass

FROM chg_of_owner as coo
with (nolock)
INNER JOIN chg_of_owner_prop_assoc as coopa
with (nolock)
ON coo.chg_of_owner_id = coopa.chg_of_owner_id
INNER JOIN property as p
with (nolock)
ON coopa.prop_id = p.prop_id 
LEFT OUTER JOIN sale as s
with (nolock)
ON coo.chg_of_owner_id = s.chg_of_owner_id 
LEFT OUTER JOIN situs
with (nolock)
ON p.prop_id = situs.prop_id 
AND situs.primary_situs = 'Y' 
LEFT OUTER JOIN prop_supp_assoc as psa
with (nolock)
on coopa.sup_tax_yr = psa.owner_tax_yr
and coopa.prop_id = psa.prop_id
LEFT OUTER JOIN property_val as pv
with (nolock)
on psa.owner_tax_yr = pv.prop_val_yr
and psa.sup_num = pv.sup_num
and psa.prop_id = pv.prop_id
INNER JOIN buyer_assoc as ba
with (nolock)
ON coo.chg_of_owner_id = ba.chg_of_owner_id
LEFT OUTER JOIN account as buyer_account 
with (nolock)
on ba.buyer_id = buyer_account.acct_id
INNER JOIN address as buyer_address 
with (nolock)
ON buyer_account.acct_id = buyer_address.acct_id 
AND buyer_address.primary_addr = 'Y' 
LEFT OUTER JOIN seller_assoc as sa
with (nolock)
ON coo.chg_of_owner_id = sa.chg_of_owner_id
and coopa.prop_id = sa.prop_id
INNER JOIN account as seller_account 
with (nolock)
ON sa.seller_id = seller_account.acct_id 
INNER JOIN address as seller_address 
with (nolock)
ON seller_account.acct_id = seller_address.acct_id 
AND seller_address.primary_addr = 'Y'

GO

