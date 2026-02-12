








CREATE VIEW dbo.prop_imprv_count_vw
AS
SELECT prop_id, prop_val_yr, sup_num, COUNT(imprv_id) 
    AS imprv_count, sale_id
FROM imprv
GROUP BY prop_id, prop_val_yr, sup_num, sale_id

GO

