








CREATE VIEW dbo.shared_prop_prod_value_total_vw
AS
SELECT pacs_prop_id, shared_year, shared_prop_id, 
    shared_cad_code,  sup_num , SUM(ag_use_value)
    AS shared_prod_value_total
FROM shared_prop_value
WHERE (ag_use_code IS NOT NULL)
GROUP BY pacs_prop_id, shared_year, shared_prop_id,
    shared_cad_code, sup_num

GO

