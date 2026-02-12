
CREATE VIEW dbo.payout_agreement_payment_history_vw
AS
SELECT DISTINCT  [payout_agreement_id],[payment_id]
  FROM [payout_agreement_payment_history]

GO

