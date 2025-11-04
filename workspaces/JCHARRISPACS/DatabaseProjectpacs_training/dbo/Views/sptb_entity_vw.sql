





CREATE VIEW dbo.sptb_entity_vw
AS
SELECT sptb_imprv_vw.imprv_val, sptb_ag_land_vw.ag_land, 
    sptb_ag_land_vw.ag_mkt_land, sptb_pers_vw.pers_val, 
    sptb_mkt_land_vw.mkt_land, sptb_land_acres_vw.acreage, 
    sptb_entity_state_code_vw.state_cd, 
    sptb_entity_state_code_vw.entity_cd, 
    sptb_entity_state_code_vw.entity_id, 
    sptb_entity_state_code_vw.tax_rate_yr, 
    sptb_prop_count_vw.prop_count, 
    sptb_mineral_vw.mineral_val
FROM sptb_ag_land_vw RIGHT OUTER JOIN
    sptb_land_acres_vw RIGHT OUTER JOIN
    sptb_pers_vw RIGHT OUTER JOIN
    sptb_entity_state_code_vw LEFT OUTER JOIN
    sptb_mineral_vw ON 
    sptb_entity_state_code_vw.entity_id = sptb_mineral_vw.entity_id
     AND 
    sptb_entity_state_code_vw.tax_rate_yr = sptb_mineral_vw.prop_val_yr
     AND 
    sptb_entity_state_code_vw.state_cd = sptb_mineral_vw.state_cd
     LEFT OUTER JOIN
    sptb_prop_count_vw ON 
    sptb_entity_state_code_vw.state_cd = sptb_prop_count_vw.state_cd
     AND 
    sptb_entity_state_code_vw.tax_rate_yr = sptb_prop_count_vw.owner_tax_yr
     AND 
    sptb_entity_state_code_vw.entity_id = sptb_prop_count_vw.entity_id
     ON 
    sptb_pers_vw.prop_val_yr = sptb_entity_state_code_vw.tax_rate_yr
     AND 
    sptb_pers_vw.entity_id = sptb_entity_state_code_vw.entity_id AND
     sptb_pers_vw.pp_state_cd = sptb_entity_state_code_vw.state_cd
     ON 
    sptb_land_acres_vw.prop_val_yr = sptb_entity_state_code_vw.tax_rate_yr
     AND 
    sptb_land_acres_vw.state_cd = sptb_entity_state_code_vw.state_cd
     AND 
    sptb_land_acres_vw.entity_id = sptb_entity_state_code_vw.entity_id
     ON 
    sptb_ag_land_vw.prop_val_yr = sptb_entity_state_code_vw.tax_rate_yr
     AND 
    sptb_ag_land_vw.state_cd = sptb_entity_state_code_vw.state_cd
     AND 
    sptb_ag_land_vw.entity_id = sptb_entity_state_code_vw.entity_id
     LEFT OUTER JOIN
    sptb_imprv_vw ON 
    sptb_entity_state_code_vw.tax_rate_yr = sptb_imprv_vw.prop_val_yr
     AND 
    sptb_entity_state_code_vw.state_cd = sptb_imprv_vw.imprv_state_cd
     AND 
    sptb_entity_state_code_vw.entity_id = sptb_imprv_vw.entity_id LEFT
     OUTER JOIN
    sptb_mkt_land_vw ON 
    sptb_entity_state_code_vw.tax_rate_yr = sptb_mkt_land_vw.prop_val_yr
     AND 
    sptb_entity_state_code_vw.state_cd = sptb_mkt_land_vw.state_cd
     AND 
    sptb_entity_state_code_vw.entity_id = sptb_mkt_land_vw.entity_id

GO

