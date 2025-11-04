

CREATE VIEW dbo.transfer_appraisal_entity_total_vw
AS
SELECT transfer_appraisal_entity_info.entity_id, 
    transfer_appraisal_entity_info.entity_cd, 
    transfer_appraisal_entity_info.prop_val_yr, 
    SUM(convert(numeric(14,0), transfer_appraisal_info.land_hstd_val * transfer_appraisal_entity_info.entity_pct/100)) 
    AS land_hstd_val, 
    SUM(convert(numeric(14,0),transfer_appraisal_info.land_non_hstd_val * transfer_appraisal_entity_info.entity_pct/100)) 
    AS land_non_hstd_val, 
    SUM(convert(numeric(14,0),transfer_appraisal_info.imprv_hstd_val * transfer_appraisal_entity_info.entity_pct/100))
    AS imprv_hstd_val, 
    SUM(convert(numeric(14,0),transfer_appraisal_info.imprv_non_hstd_val * transfer_appraisal_entity_info.entity_pct/100))
    AS imprv_non_hstd_val, 
    SUM(convert(numeric(14,0),transfer_appraisal_info.ag_use_val * transfer_appraisal_entity_info.entity_pct/100)) AS ag_use_val, 
    SUM(convert(numeric(14,0),transfer_appraisal_info.ag_market * transfer_appraisal_entity_info.entity_pct/100)) AS ag_market, 
    SUM(convert(numeric(14,0),transfer_appraisal_info.timber_use * transfer_appraisal_entity_info.entity_pct/100)) AS timber_use, 
    SUM(convert(numeric(14,0),transfer_appraisal_info.timber_market * transfer_appraisal_entity_info.entity_pct/100)) 
    AS timber_market, SUM(convert(numeric(14,0),transfer_appraisal_info.appraised_val * transfer_appraisal_entity_info.entity_pct/100)) 
    AS appraised_val, SUM(convert(numeric(14,0),transfer_appraisal_info.assessed_val * transfer_appraisal_entity_info.entity_pct/100)) 
    AS assessed_val, transfer_appraisal_info.prop_type_cd 
FROM transfer_appraisal_info INNER JOIN
    transfer_appraisal_entity_info ON 
    transfer_appraisal_info.prop_id = transfer_appraisal_entity_info.prop_id
     AND 
    transfer_appraisal_info.prop_val_yr = transfer_appraisal_entity_info.prop_val_yr
     AND 
    transfer_appraisal_info.sup_num = transfer_appraisal_entity_info.sup_num
     AND 
    transfer_appraisal_info.owner_id = transfer_appraisal_entity_info.owner_id
GROUP BY transfer_appraisal_entity_info.entity_id, 
    transfer_appraisal_entity_info.entity_cd, 
    transfer_appraisal_entity_info.prop_val_yr, 
    transfer_appraisal_info.prop_type_cd

GO

