
CREATE VIEW dbo.property_commercial_appraisal_rcn_vw
AS
SELECT DISTINCT 
	prop_id, 
	prop_val_yr, 
	sup_num, 
	sale_id, 
	SUM( CASE 
	   	WHEN imprv_det_val_source = 'A' THEN imprv_det_calc_val
	   	WHEN imprv_det_val_source = 'F' THEN imprv_det_flat_val
	     END ) AS total_rcn
FROM         
	dbo.imprv_detail
GROUP BY prop_id, prop_val_yr, sup_num, sale_id

GO

