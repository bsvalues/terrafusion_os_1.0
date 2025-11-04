
CREATE VIEW dbo.land_detail_summary_vw
AS
SELECT DISTINCT 
	prop_id, 
	prop_val_yr, 
	sup_num, 
	sale_id, 
	SUM (ISNULL(land_seg_mkt_val, 0) )as land_seg_mkt_val
FROM         
	dbo.land_detail
GROUP BY prop_id, prop_val_yr, sup_num, sale_id

GO

