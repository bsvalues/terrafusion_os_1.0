







CREATE VIEW dbo.shared_prop_land_imprv_total_vw
AS
SELECT pacs_prop_id, shared_year, shared_prop_id, 
    shared_cad_code, sup_num, SUM(shared_value)
    AS shared_imp_land_value_total
FROM shared_prop_value
WHERE (ag_use_code IS NULL)
GROUP BY pacs_prop_id, shared_year, shared_prop_id, 
    shared_cad_code, sup_num

GO

