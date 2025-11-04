



CREATE VIEW dbo.appr_notice_config_maint_omit_entity_vw
AS
SELECT account.file_as_name, entity.entity_cd, 
    appr_notice_config_maint_omit_entity.notice_yr, 
    appr_notice_config_maint_omit_entity.entity_id
FROM entity INNER JOIN
    account ON entity.entity_id = account.acct_id INNER JOIN
    appr_notice_config_maint_omit_entity ON 
    entity.entity_id = appr_notice_config_maint_omit_entity.entity_id

GO

