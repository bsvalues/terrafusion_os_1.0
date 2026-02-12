






/****** Object:  View dbo.PTD_ACD_AREA_VW    Script Date: 6/23/2000 2:53:23 PM ******/
CREATE VIEW dbo.PTD_ACD_AREA_VW
AS
SELECT prop_id, prop_val_yr, sup_num, MAX(pp_area) 
    AS area
FROM pers_prop_seg
GROUP BY prop_id, prop_val_yr, sup_num

GO

