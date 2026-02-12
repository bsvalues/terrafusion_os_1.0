
CREATE VIEW dbo.nbhd_cost_calc_capture_vw
AS
SELECT     cc_analysis.*, prof.prop_val_yr AS appraisal_year, nbhd.hood_name AS nbhd_name
FROM         dbo.nbhd_cost_calc_capture cc_analysis LEFT OUTER JOIN
                      dbo.profile_run_list prof ON cc_analysis.profile_run_list_detail_id = prof.detail_id AND cc_analysis.run_id = prof.run_id LEFT OUTER JOIN
                      dbo.neighborhood nbhd ON nbhd.hood_yr = prof.prop_val_yr AND nbhd.hood_cd = prof.hood_cd

GO

