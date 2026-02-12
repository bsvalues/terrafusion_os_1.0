





CREATE VIEW dbo.ptd_imprv_area_vw
AS
SELECT SUM(ISNULL(imprv_det_area, 0)) AS imprv_sqft, prop_id, 
    prop_val_yr, sup_num
FROM imprv_detail
WHERE (sale_id = 0)
GROUP BY prop_id, prop_val_yr, sup_num

GO

