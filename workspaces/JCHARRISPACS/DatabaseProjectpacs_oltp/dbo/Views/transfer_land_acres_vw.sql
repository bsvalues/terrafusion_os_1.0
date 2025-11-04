




CREATE VIEW dbo.transfer_land_acres_vw
AS
SELECT SUM(size_acres) AS size_acres, prop_id, prop_val_yr, 
    sup_num
FROM land_detail
WHERE sale_id = 0
GROUP BY prop_id, prop_val_yr, sup_num

GO

