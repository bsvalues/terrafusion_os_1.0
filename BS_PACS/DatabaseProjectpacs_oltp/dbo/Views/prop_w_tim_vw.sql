




CREATE VIEW dbo.prop_w_tim_vw
AS
SELECT DISTINCT 
    ag_use_cd, ag_eff_tax_year, prop_id, prop_val_yr, 
    sup_num
FROM land_detail
WHERE (ag_use_cd = 'TIM') AND (ag_use_cd IS NOT NULL) AND 
    (sale_id = 0)

GO

