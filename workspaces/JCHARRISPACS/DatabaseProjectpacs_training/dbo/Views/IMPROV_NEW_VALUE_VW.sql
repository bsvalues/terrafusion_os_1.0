

CREATE VIEW dbo.IMPROV_NEW_VALUE_VW
AS
SELECT prop_id, prop_val_yr, sup_num, sale_id, 
    SUM(imp_new_val) AS imp_new_val_total, imprv_homesite, 
    imp_new_yr, imp_new_val_override
FROM imprv
GROUP BY prop_id, prop_val_yr, sup_num, sale_id, 
    imprv_homesite, imp_new_yr, imp_new_val_override
HAVING imp_new_val_override in ('C', 'D', 'O')

GO

