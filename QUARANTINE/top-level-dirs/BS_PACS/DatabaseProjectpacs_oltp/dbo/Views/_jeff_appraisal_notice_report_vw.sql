
/*  drop view dbo._jeff_appraisal_notice_report_vw  */
CREATE VIEW [dbo].[_jeff_appraisal_notice_report_vw]
AS
SELECT        dbo.property_val.prop_val_yr, dbo.property_val.sup_num, dbo.property_val.prop_inactive_dt, dbo.property_val.prop_id, dbo.property_val.property_use_cd, 
                         dbo.property_val.new_val_imprv_hs, dbo.property_val.new_val_imprv_nhs, dbo.property_val.new_val_land_hs, dbo.property_val.new_val_land_nhs, 
                         dbo.wash_property_val.snr_new_val, dbo.wash_property_val.snr_frz_imprv_hs, dbo.wash_property_val.snr_frz_land_hs
FROM            dbo.property_val INNER JOIN
                         dbo.wash_property_val ON dbo.property_val.prop_id = dbo.wash_property_val.prop_id AND dbo.property_val.prop_val_yr = dbo.wash_property_val.prop_val_yr AND
                          dbo.property_val.sup_num = dbo.wash_property_val.sup_num

GO

