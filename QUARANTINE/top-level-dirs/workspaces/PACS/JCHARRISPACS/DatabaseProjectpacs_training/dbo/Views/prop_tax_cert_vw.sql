

CREATE VIEW prop_tax_cert_vw
AS
SELECT fee.fee_id, fee.type_cd, fee.fee_dt, account.file_as_name, 
    fee_tax_cert_assoc.tax_cert_num, fee_tax_cert_assoc.ref_num, 
    fee_tax_cert_assoc.prop_id, fee_tax_cert_assoc.effective_dt, 
    fee_tax_cert_assoc.num_copies, account.acct_id, 
    fee_tax_cert_assoc.comment
FROM fee_tax_cert_assoc
JOIN fee ON
	fee_tax_cert_assoc.fee_id = fee.fee_id
join fee_acct_assoc on
	fee.fee_id = fee_acct_assoc.fee_id
JOIN account ON
	fee_acct_assoc.acct_id = account.acct_id

GO

