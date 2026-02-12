


CREATE VIEW dbo.batch_close_day_vw
AS
SELECT batch_close_day.close_day_id, 
    batch_close_day.balance_dt, batch_close_day.close_by_id, 
    batch_close_day.close_dt, pacs_user.pacs_user_name
FROM batch_close_day INNER JOIN
    pacs_user ON 
    batch_close_day.close_by_id = pacs_user.pacs_user_id

GO

