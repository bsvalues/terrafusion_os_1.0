


CREATE VIEW dbo.batch_vw
AS
SELECT TOP 100 PERCENT batch.batch_id, batch.balance_dt, batch.close_dt, 
    batch.deposit_date, batch.create_dt, batch.user_id, 
    batch.comment, batch.distribution_id, batch.description, 
    pacs_user.pacs_user_name, pacs_user.full_name
FROM batch INNER JOIN
    pacs_user ON batch.user_id = pacs_user.pacs_user_id
ORDER by batch.batch_id DESC

GO

