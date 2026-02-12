


CREATE VIEW dbo.batch_distribution_history_vw
AS
SELECT batch_distribution_history.trans_type, 
    batch_distribution_history.message, 
    batch_distribution_history.pacs_user_id, 
    batch_distribution_history.trans_dt, 
    batch_distribution_history.balance_dt, 
    pacs_user.pacs_user_name
FROM batch_distribution_history INNER JOIN
    pacs_user ON 
    batch_distribution_history.pacs_user_id = pacs_user.pacs_user_id
GROUP BY batch_distribution_history.trans_type, 
    batch_distribution_history.message, 
    batch_distribution_history.pacs_user_id, 
    batch_distribution_history.trans_dt, 
    batch_distribution_history.balance_dt, 
    pacs_user.pacs_user_name

GO

