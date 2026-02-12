





CREATE VIEW dbo.month_to_date_refund_vw
AS
SELECT pacs_user_id, entity_id, SUM(refund_due) 
    AS refund_due
FROM month_to_date_recap
GROUP BY pacs_user_id, entity_id

GO

