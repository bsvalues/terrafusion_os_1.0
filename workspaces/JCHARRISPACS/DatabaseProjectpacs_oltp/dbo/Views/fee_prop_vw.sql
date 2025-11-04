
CREATE VIEW dbo.fee_prop_vw
AS

SELECT 
	0 as bill_id,
  acc.file_as_name as tax_payer,
  ft.fee_type_desc as fee_type_name,
  fpv.prop_id, '' as bill_type, f.payment_status_type_cd as bill_payment_status_type_cd,
  f.*
from dbo.fee as f with (nolock)
  inner join fee_property_vw as fpv with (nolock) on (fpv.fee_id = f.fee_id)
  left join dbo.account as acc with (nolock) on (acc.acct_id = f.owner_id)
  left join dbo.fee_type as ft with(nolock) on (ft.fee_type_cd = f.fee_type_cd)

GO

