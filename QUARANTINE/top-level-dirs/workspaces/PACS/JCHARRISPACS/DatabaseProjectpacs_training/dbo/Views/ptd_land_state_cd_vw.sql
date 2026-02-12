







CREATE VIEW dbo.ptd_land_state_cd_vw
AS
SELECT DISTINCT prop_id, prop_val_yr, sup_num, state_cd
FROM land_detail
WHERE (sale_id = 0) AND land_seg_id IN
        (SELECT MIN(land_seg_id)
      FROM land_detail AS ls1
      WHERE ls1.prop_id = land_detail.prop_id AND 
           ls1.sup_num = land_detail.sup_num AND 
           ls1.prop_val_yr = land_detail.prop_val_yr AND 
           ls1.sale_id = 0)
GROUP BY state_cd, prop_id, prop_val_yr, sup_num

GO

