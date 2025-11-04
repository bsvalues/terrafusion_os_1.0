









CREATE VIEW dbo.appr_notice_select_criteria_omit_entity_vw
AS
SELECT appr_notice_selection_criteria_omit_entity.notice_yr, 
    appr_notice_selection_criteria_omit_entity.notice_num, 
    appr_notice_selection_criteria_omit_entity.entity_id, 
    entity.entity_cd, account.file_as_name
FROM account INNER JOIN
    entity ON account.acct_id = entity.entity_id INNER JOIN
    appr_notice_selection_criteria_omit_entity ON 
    entity.entity_id = appr_notice_selection_criteria_omit_entity.entity_id

GO

