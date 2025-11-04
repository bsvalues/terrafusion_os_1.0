CREATE VIEW
[dbo].[import_payment_vw]
AS
SELECT TOP 0 ip.payment_run_id, ip.prop_id, ip.geo_id, a.file_as_name as owner_name,
  ip.[year], ip.amount_paid, ip.status,
  (case when ip.amount_due <> ip.amount_paid then 1 else 0 end) as is_half_payment
from dbo.import_payment ip with (nolock)
  join dbo.import_payment_run as ipr with (nolock)
    on ipr.payment_run_id = ip.payment_run_id
  join dbo.property as p with(nolock) on p.prop_id = ip.prop_id
  join dbo.account a on a.acct_id = p.col_owner_id

GO

