create view __prop_val_comb_appr_yr as


select distinct prop_id,[cycle],
land_non_hstd_val +land_hstd_val as LandVal,

imprv_hstd_val + imprv_non_hstd_val as ImprvVal,[ag_loss],

market as MarketVal
,[ag_use_val],[ag_market],[assessed_val],[appraised_val],[property_use_cd]
,[cost_ag_hs_use_val]+[cost_ag_hs_mkt_val] as Cost_AgVal
,[ag_hs_use_val],[ag_hs_mkt_val]
--,[new_val_hs]+[new_val_nhs] as total_new_val
,[new_val_imprv_hs]+[new_val_imprv_nhs] as New_ImprvVal

from property_val pv
where prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)
and prop_inactive_dt is null

GO

