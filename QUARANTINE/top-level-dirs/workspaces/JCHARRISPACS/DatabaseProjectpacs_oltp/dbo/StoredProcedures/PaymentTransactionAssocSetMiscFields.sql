
create procedure PaymentTransactionAssocSetMiscFields
	@payment_id int,
	@transaction_id int
as

set nocount on

	update pta
	set
		pta.receipt_legal_acreage = pv.legal_acreage,
		pta.receipt_legal_desc = pv.legal_desc
	from payment_transaction_assoc as pta
	join prop_supp_assoc as psa with(nolock) on
		psa.owner_tax_yr = pta.year and
		psa.prop_id = pta.prop_id
	join property_val as pv with(nolock) on
		pv.prop_val_yr = psa.owner_tax_yr and
		pv.sup_num = psa.sup_num and
		pv.prop_id = psa.prop_id
	where
		pta.payment_id = @payment_id and
		pta.transaction_id = @transaction_id

GO

