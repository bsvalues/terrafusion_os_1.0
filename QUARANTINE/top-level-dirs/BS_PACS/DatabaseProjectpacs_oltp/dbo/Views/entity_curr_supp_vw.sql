




CREATE VIEW dbo.entity_curr_supp_vw
AS
SELECT entity_id, tax_yr, MAX(sup_num) AS sup_num
FROM entity_prop_assoc
GROUP BY entity_id, tax_yr

GO

