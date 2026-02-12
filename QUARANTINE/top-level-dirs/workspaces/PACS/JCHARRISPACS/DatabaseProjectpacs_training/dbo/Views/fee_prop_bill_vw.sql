

CREATE VIEW [dbo].[fee_prop_bill_vw]
AS
SELECT f.fee_id, f.year, f.fee_type_cd,
	f.owner_id, f.statement_id, f.initial_amount_due, f.current_amount_due, f.amount_paid,
	f.amount_due_override, f.effective_due_date, f.comment, f.fee_create_date, f.last_modified,
	f.code, f.payment_status_type_cd, f.payout_agreement_id, f.sup_num, f.rollback_id,
	f.is_active, f.payment_group_id, f.display_year,

  bfa.bill_id,
  acc.file_as_name as tax_payer,
  ft.fee_type_desc as fee_type_name,
  fpa.prop_id, b.bill_type, b.payment_status_type_cd as bill_payment_status_type_cd

from fee as f with (nolock)
  join fee_property_vw as fpa with(nolock) on (fpa.fee_id = f.fee_id)
  left join bill_fee_assoc as bfa with(nolock) on (bfa.fee_id = f.fee_id)
  left join bill as b with(nolock) on (b.bill_id = bfa.bill_id)
  left join account as acc with (nolock) on (acc.acct_id = f.owner_id)
  left join fee_type as ft with(nolock) on (ft.fee_type_cd = f.fee_type_cd)

GO

