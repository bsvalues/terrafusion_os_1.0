


CREATE VIEW dbo.property_bill_alert_vw
AS
SELECT DISTINCT 
    bill_adjust_code.adjust_cd, bill_adjust_code.adjust_desc, 
    property.prop_id
FROM property INNER JOIN
    bill ON property.prop_id = bill.prop_id INNER JOIN
    bill_adjust_code ON 
    bill.adjustment_code = bill_adjust_code.adjust_cd
WHERE coll_status_cd <> 'RS'
and (active_bill = 'T' or active_bill is null) and
    (bill_adjust_code.alert_user = 'T')

GO

