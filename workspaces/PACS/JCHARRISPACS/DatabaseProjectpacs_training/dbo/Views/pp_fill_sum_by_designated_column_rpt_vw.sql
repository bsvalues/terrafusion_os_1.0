
CREATE VIEW dbo.pp_fill_sum_by_designated_column_rpt_vw
AS 
SELECT 	
	ppdc.prop_id AS prop_id, 
	ppdc.pp_yr_aquired AS pp_yr_aquired, 
	ppdc.prop_val_yr AS prop_val_yr,
	ISNULL(SUM(CASE WHEN ppdc.pp_rend_column='FFE' THEN ppdc.pp_orig_cost END), 0) AS orig_cost_FFE,
	ISNULL(SUM(CASE WHEN ppdc.pp_rend_column='OFFE' THEN ppdc.pp_orig_cost END), 0) AS orig_cost_OFFE,
	ISNULL(SUM(CASE WHEN ppdc.pp_rend_column='COMP' THEN ppdc.pp_orig_cost END), 0) AS orig_cost_COMP,
    	ISNULL(SUM(CASE WHEN ppdc.pp_rend_column='MEQT' THEN ppdc.pp_orig_cost END), 0) As orig_cost_MEQT,		
	ISNULL(SUM(CASE WHEN ppdc.pp_rend_column='VEH' THEN ppdc.pp_orig_cost END), 0) AS orig_cost_VEH

FROM 	pp_by_designated_column_vw AS ppdc
WHERE   ppdc.pp_yr_aquired IS NOT NULL
GROUP BY ppdc.prop_id, ppdc.pp_yr_aquired, ppdc.prop_val_yr

UNION
-- Insert Rows for all the years in which there were no segments/sub-segments acquired for the property
-- However exclude all the years which are 15 or more years farther than the prop_val_yr
SELECT 
	pv.prop_id AS prop_id,
	pf.pp_year AS pp_yr_aquired, 
	pv.prop_val_yr AS prop_val_yr,
	0 AS orig_cost_FFE,
	0 AS orig_cost_OFFE,
	0 AS orig_cost_COMP,
    	0 As orig_cost_MEQT,		
	0 AS orig_cost_VEH
	
FROM 	property_val AS pv
	INNER JOIN prop_supp_assoc AS  psa
		ON pv.prop_id = psa.prop_id
		   AND pv.sup_num = psa.sup_num
		   AND pv.prop_val_yr = psa.owner_tax_yr
	INNER JOIN 
		dbo.fn_GetPPFillYears() AS pf
		ON 1=1		
WHERE   NOT EXISTS 
		( SELECT *
		  FROM pp_by_designated_column_vw AS ppdc
		  WHERE ppdc.prop_id = pv.prop_id
			AND  ppdc.prop_val_yr = pv.prop_val_yr
			AND  ppdc.pp_yr_aquired = pf.pp_year
		)

GO

