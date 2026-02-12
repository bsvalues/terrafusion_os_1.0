

CREATE VIEW dbo.payment_trans_void_info_vw
AS
SELECT     dbo.payment_trans.transaction_id, dbo.payment_trans.payment_id, dbo.payment_trans.void_date, dbo.pacs_user.full_name AS void_by_name, 
                      dbo.payment_trans.void_reason, dbo.batch.description AS void_batch
FROM         dbo.payment_trans LEFT OUTER JOIN
                      dbo.batch ON dbo.payment_trans.void_batch_id = dbo.batch.batch_id LEFT OUTER JOIN
                      dbo.pacs_user ON dbo.payment_trans.void_by_id = dbo.pacs_user.pacs_user_id
WHERE     (dbo.payment_trans.void_trans = 'Y')

GO

