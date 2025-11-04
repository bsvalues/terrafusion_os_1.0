








CREATE VIEW dbo.prop_land_count_vw
AS
SELECT prop_id, prop_val_yr, sup_num, COUNT(land_seg_id) 
    AS land_count, sale_id
FROM land_detail
GROUP BY prop_id, prop_val_yr, sup_num, sale_id

GO

