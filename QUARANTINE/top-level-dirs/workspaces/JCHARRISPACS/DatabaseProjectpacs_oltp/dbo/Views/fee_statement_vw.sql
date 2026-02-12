
CREATE VIEW dbo.fee_statement_vw
AS
select 
	fee.fee_id, 
	fee_tax_cert_assoc.tax_cert_num, 
    fee_tax_cert_assoc.ref_num,
	fee_acct_assoc.acct_id,
	fee_prop_assoc.prop_id,
	GET_LEGAL_DESC_TAX_VW.geo_id, 
    GET_LEGAL_DESC_TAX_VW.legal_desc, 
    fee_tax_cert_assoc.prop_id AS tax_cert_prop_id,
	case
		when (fee.current_amount_due - fee.amount_paid) > 0.00
		then 0
		else 1
	end as fee_paid
from fee with (nolock)
join fee_tax_cert_assoc with (nolock) on
	fee_tax_cert_assoc.fee_id = fee.fee_id
join GET_LEGAL_DESC_TAX_VW with (nolock) on
		fee_tax_cert_assoc.prop_id = GET_LEGAL_DESC_TAX_VW.prop_id
left join fee_acct_assoc on
	fee.fee_id = fee_acct_assoc.fee_id
left outer join fee_prop_assoc on
	fee.fee_id = fee_prop_assoc.fee_id

GO

