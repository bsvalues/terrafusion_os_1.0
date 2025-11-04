

create view fee_vw
as
select
	fee.type_cd,
	fee_type.fee_type_desc,
	account.file_as_name,
	fee.fee_id,
	
	fee_acct_assoc.acct_id,

	fee.fee_dt,
	fee.amt_due,
	fee.amt_pd,
	fee.comment,
	account.first_name,
	account.last_name,
	fee.year,
	fee_tax_cert_assoc.prop_id as tax_cert_prop_id,
	fee_tax_cert_assoc.tax_cert_num,

	fee_prop_assoc.prop_id as fee_prop_id,

	property_type.prop_type_desc,

--	fee_prop_vw.legal_desc,
	pv.legal_desc,

	fee_litigation_assoc.litigation_id

from fee
left outer join fee_type on /* Should always join, however, type_cd is nullable, so just in case, it is a left outer */
	fee.type_cd = fee_type.fee_type_cd
left outer join fee_acct_assoc on
	fee.fee_id = fee_acct_assoc.fee_id
left outer join fee_prop_assoc on
	fee.fee_id = fee_prop_assoc.fee_id
left outer join fee_litigation_assoc on
	fee.fee_id = fee_litigation_assoc.litigation_id
left outer join fee_tax_cert_assoc on
	fee.fee_id = fee_tax_cert_assoc.fee_id
left outer join property on /* Note that property is joined on the tax-certificate property */
	fee_tax_cert_assoc.prop_id = property.prop_id
left outer join property_type on
	property.prop_type_cd = property_type.prop_type_cd
left outer join account on
	fee_acct_assoc.acct_id = account.acct_id
--left outer join fee_prop_vw on /* Note that fee_prop_vw is joined on the fee's property association */
--	fee_prop_assoc.prop_id = fee_prop_vw.prop_id
left outer join max_layer_vw on
	fee_prop_assoc.prop_id = max_layer_vw.prop_id
left outer join property_val as pv on
	fee_prop_assoc.prop_id = pv.prop_id and
	max_layer_vw.max_prop_val_yr = pv.prop_val_yr and
	max_layer_vw.max_sup_num = pv.sup_num

GO

