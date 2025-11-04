
CREATE VIEW [dbo].[import_payment_tenders_vw]
AS
SELECT ipt.payment_run_id, tt.tender_type_desc, ipt.description,
  ipt.ref_number, ipt.amount
from dbo.import_payment_tenders ipt with (nolock)
  join dbo.tender_type as tt with (nolock)
    on tt.tender_type_cd = ipt.tender_type

GO

