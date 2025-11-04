




CREATE VIEW dbo.mineral_value_cv_vw
AS
SELECT account.file_as_name, mineral_entity_cv.entity_id, 
    mineral_entity_cv.tax_yr, 
    SUM(mineral_property_cv.value * mineral_entity_cv.entity_prop_pct
     / 100 ) AS value, 
    mineral_property_cv.prop_type_cd
FROM mineral_entity_cv INNER JOIN
    mineral_property_cv ON 
    mineral_entity_cv.prop_id = mineral_property_cv.prop_id
     AND 
    mineral_entity_cv.owner_id = mineral_property_cv.owner_id
     AND 
    mineral_entity_cv.tax_yr = mineral_property_cv.prop_val_yr
     AND 
    mineral_entity_cv.pp_seg_id = mineral_property_cv.pp_seg_id
     INNER JOIN
    account ON 
    mineral_entity_cv.entity_id = account.acct_id
GROUP BY mineral_entity_cv.entity_id, 
    mineral_entity_cv.tax_yr, account.file_as_name, 
    mineral_property_cv.prop_type_cd

GO

