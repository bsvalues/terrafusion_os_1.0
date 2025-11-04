








CREATE VIEW dbo.bill_alert_vw
AS
SELECT DISTINCT 
    bill_adjust_code.adjust_cd, bill_adjust_code.adjust_desc, 
    bill.bill_id
FROM bill INNER JOIN
    bill_adjust_code ON 
    bill.adjustment_code = bill_adjust_code.adjust_cd
WHERE (bill.coll_status_cd = 'N' OR
    bill.coll_status_cd = 'PP') AND 
    (bill_adjust_code.alert_user = 'T')

GO

