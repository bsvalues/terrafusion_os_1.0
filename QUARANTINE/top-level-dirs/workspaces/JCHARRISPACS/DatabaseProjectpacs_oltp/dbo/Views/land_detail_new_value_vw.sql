

CREATE VIEW dbo.land_detail_new_value_vw
AS
SELECT prop_id, prop_val_yr, sup_num, sale_id, 
    effective_tax_year, land_seg_homesite, 
    SUM(land_seg_mkt_val) AS sum_land_new_hs_val
FROM land_detail
GROUP BY prop_id, prop_val_yr, sup_num, sale_id, 
    effective_tax_year, land_seg_homesite
HAVING (land_seg_homesite = 'T')

GO

