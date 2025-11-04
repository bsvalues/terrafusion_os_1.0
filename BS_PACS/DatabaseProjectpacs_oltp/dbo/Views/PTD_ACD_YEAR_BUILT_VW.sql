






/****** Object:  View dbo.PTD_ACD_YEAR_BUILT_VW    Script Date: 6/23/2000 2:53:23 PM ******/
CREATE VIEW dbo.PTD_ACD_YEAR_BUILT_VW
AS
SELECT prop_id, prop_val_yr, sup_num, MIN(pp_yr_aquired) 
    AS year_built
FROM pers_prop_seg
GROUP BY prop_id, prop_val_yr, sup_num

GO

