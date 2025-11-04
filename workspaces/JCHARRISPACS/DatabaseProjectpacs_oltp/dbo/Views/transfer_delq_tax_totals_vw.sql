




CREATE VIEW dbo.transfer_delq_tax_totals_vw
AS
SELECT entity_tax_yr, SUM(base_mno) AS base_mno, 
    SUM(base_ins) AS base_ins, SUM(base_mno_due) 
    AS mno_due, SUM(base_ins_due) AS ins_due, COUNT(prop_id) 
    AS bill_count, entity_id, entity_cd
FROM transfer_delq_tax
GROUP BY entity_tax_yr, entity_id, entity_cd

GO

