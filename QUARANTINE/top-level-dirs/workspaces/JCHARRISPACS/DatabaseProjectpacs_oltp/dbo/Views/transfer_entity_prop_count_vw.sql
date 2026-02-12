





CREATE VIEW dbo.transfer_entity_prop_count_vw
AS
SELECT COUNT(transfer_appraisal_info.prop_id) AS prop_count, 
    transfer_appraisal_entity_info.entity_id, 
    transfer_appraisal_entity_info.prop_val_yr, 
    transfer_appraisal_info.prop_type_cd
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
    transfer_appraisal_entity_info.prop_val_yr, 
    transfer_appraisal_info.prop_type_cd

GO

