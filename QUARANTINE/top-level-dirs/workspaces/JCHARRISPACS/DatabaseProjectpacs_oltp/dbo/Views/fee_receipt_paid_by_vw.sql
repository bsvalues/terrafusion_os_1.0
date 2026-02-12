

CREATE VIEW fee_receipt_paid_by_vw
AS
select p.payment_id,
	case when p.payee_id > 0 then a.acct_id else 0 end as acct_id,
	case when p.payee_id > 0 then a.file_as_name else p.paid_by end as file_as_name,
	case when p.payee_id > 0 then ad.addr_line1 else '' end as addr_line_1,
	case when p.payee_id > 0 then ad.addr_line2 else '' end as addr_line_2,
	case when p.payee_id > 0 then ad.addr_line3 else '' end as addr_line_3,
	case when p.payee_id > 0 then rtrim(ad.addr_city) + ', ' + rtrim(ad.addr_state) + ' ' + rtrim(ad.addr_zip) else '' end as addr_csz,
	case when p.payee_id > 0 then ad.addr_city else '' end as addr_city,
	case when p.payee_id > 0 then ad.addr_state else '' end as addr_state,
	case when p.payee_id > 0 then ad.addr_zip else '' end as addr_zip,
	case when p.payee_id > 0 then ad.country_cd else '' end as country_cd,
	case when p.payee_id > 0 then ad.is_international else cast(0 as bit) end as is_international

	
from payment p with (nolock)
left outer join account a with (nolock) on
	p.payee_id = a.acct_id
left outer join address ad with (nolock) on
	a.acct_id = ad.acct_id and
	ad.primary_addr = 'Y'

GO

