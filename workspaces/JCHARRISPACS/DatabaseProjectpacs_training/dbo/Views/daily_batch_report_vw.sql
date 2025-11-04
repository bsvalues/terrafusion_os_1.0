



/************************************/
/********** additional stuff ********/
/************************************/


CREATE  VIEW dbo.daily_batch_report_vw
AS
SELECT     dbpa.prop_id, dbo.appraiser.appraiser_nm, dbo.property.geo_id, dbpa.prev_yr_assessed, pv.assessed_val, 
                      pv.assessed_val - dbpa.prev_yr_assessed  AS difference, pv.prop_val_yr, dbpa.batch_id, pv.abs_subdv_cd, pv.recalc_flag, 
                      dbo.daily_batch.batch_desc, dbo.daily_batch.batch_comment, dbo.daily_batch.batch_create_dt
FROM         dbo.daily_batch_prop_assoc dbpa INNER JOIN
                      dbo.property ON dbpa.prop_id = dbo.property.prop_id INNER JOIN
                      dbo.property_val pv ON dbpa.prop_id = pv.prop_id AND pv.sup_num = 0 INNER JOIN
                      dbo.daily_batch ON dbpa.batch_id = dbo.daily_batch.batch_id LEFT OUTER JOIN
                      dbo.appraiser ON pv.last_appraiser_id = dbo.appraiser.appraiser_id

GO

