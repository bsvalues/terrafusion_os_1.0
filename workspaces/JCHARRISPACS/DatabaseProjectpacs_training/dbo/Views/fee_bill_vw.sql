
CREATE VIEW [dbo].[fee_bill_vw]
AS
SELECT 
	bfa.bill_id,
  acc.file_as_name as tax_payer,
  ft.fee_type_desc as fee_type_name,
  b.prop_id, b.bill_type, b.payment_status_type_cd as bill_payment_status_type_cd,
  f.*
from dbo.fee as f with (nolock)
  inner join dbo.bill_fee_assoc as bfa with(nolock) on (bfa.fee_id = f.fee_id)
  inner join dbo.bill as b with(nolock) on (b.bill_id = bfa.bill_id)
  left join dbo.account as acc with (nolock) on (acc.acct_id = f.owner_id)
  left join dbo.fee_type as ft with(nolock) on (ft.fee_type_cd = f.fee_type_cd)

GO

