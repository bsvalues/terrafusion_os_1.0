CREATE view [dbo].[payment_receipt_property_vw]

as

SELECT
  pr.payment_id, pr.prop_id, ta.tax_area_id, ta.tax_area_number, s.situs_id,
  s.situs_display AS situs_addr, o.owner_id, oa.file_as_name AS owner_name,
  oaa.addr_line1 AS owner_addr1, oaa.addr_line2 AS owner_addr2,
  oaa.addr_line3 AS owner_addr3,
oaa.addr_city as owner_city, oaa.addr_state as owner_state, oaa.addr_zip as owner_zip,
oaa.is_international, 
oaa.country_cd,

 pv.legal_desc AS legal_desc,
 pv.legal_acreage,
 p.geo_id,
 p.dba_name

from payment_receipt_distinct_property_list_vw pr 
LEFT OUTER JOIN prop_supp_assoc psa WITH (NOLOCK)
	ON pr.prop_id = psa.prop_id AND psa.owner_tax_yr = 
		(SELECT MAX(owner_tax_yr) FROM prop_supp_assoc WHERE prop_id = pr.prop_id)
LEFT OUTER JOIN property p WITH (NOLOCK)
   ON p.prop_id = psa.prop_id 
LEFT OUTER JOIN property_tax_area prta WITH (NOLOCK)
   ON prta.prop_id = psa.prop_id AND prta.year = psa.owner_tax_yr AND prta.sup_num = psa.sup_num
LEFT OUTER JOIN tax_area ta WITH (NOLOCK)
   ON ta.tax_area_id = prta.tax_area_id
LEFT OUTER JOIN situs s WITH (NOLOCK)
   ON s.prop_id = pr.prop_id AND primary_situs = 'Y'

outer apply (
	select top 1 item_paid_owner_id owner_id
	from payment_transaction_assoc pta with(nolock)
	where pta.payment_id = pr.payment_id
	and pta.prop_id = pr.prop_id
	order by pta.year desc, pta.sup_num desc
) owner_at_payment_time

outer apply (
	select top 1 owner_id
	from owner with(nolock)
	where owner.prop_id = psa.prop_id
	and owner.owner_tax_yr = psa.owner_tax_yr
	and owner.sup_num = psa.sup_num
) property_owner

outer apply (
	select isnull(owner_at_payment_time.owner_id, property_owner.owner_id) owner_id
) o

LEFT OUTER JOIN account oa WITH (NOLOCK)
   ON oa.acct_id = o.owner_id

outer apply (
	select top 1 address.*
	from address with(nolock)
	where address.acct_id = o.owner_id
	order by (case when address.primary_addr = 'Y' then 1 else 2 end)
) oaa

LEFT OUTER JOIN property_val pv WITH (NOLOCK)
   ON pv.prop_id = psa.prop_id AND pv.prop_val_yr = psa.owner_tax_yr AND pv.sup_num = psa.sup_num

GO

