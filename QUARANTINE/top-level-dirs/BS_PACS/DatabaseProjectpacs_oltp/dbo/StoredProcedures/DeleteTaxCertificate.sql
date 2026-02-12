

CREATE PROCEDURE DeleteTaxCertificate

@input_fee_id	int

AS

delete from prop_tax_cert_info
where fee_id = @input_fee_id

delete from fee_prop_entity_assoc
where fee_id = @input_fee_id

delete from fee_tax_cert_assoc
where fee_id = @input_fee_id

delete fee_prop_assoc
where fee_id = @input_fee_id

delete fee_acct_assoc
where fee_id = @input_fee_id

delete from fee
where fee_id = @input_fee_id

GO

