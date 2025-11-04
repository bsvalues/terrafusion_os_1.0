




CREATE VIEW dbo.entity_group_has_bill_vw
AS
SELECT DISTINCT levy_group_id, sup_tax_yr
FROM bill

GO

