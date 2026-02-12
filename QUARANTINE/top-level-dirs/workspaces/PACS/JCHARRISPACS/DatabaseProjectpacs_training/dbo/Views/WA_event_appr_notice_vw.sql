
CREATE VIEW WA_event_appr_notice_vw  
as
SELECT event.event_id, event.system_type, event.event_type,   
    event.event_date, event.pacs_user, event.event_desc,   
    event.ref_evt_type, wash_appraisal_notice_prop_info.notice_year,   
    wash_appraisal_notice_prop_info.notice_run_id,   
    wash_appraisal_notice_prop_info.prop_id, wash_appraisal_notice_prop_info.owner_id,   
    wash_appraisal_notice_prop_info.sup_num, wash_appraisal_notice_prop_info.sup_yr,   
    wash_appraisal_notice_prop_info.notice_acct_name,   
    wash_appraisal_notice_prop_info.addr_line1,   
    wash_appraisal_notice_prop_info.addr_line2,   
    wash_appraisal_notice_prop_info.addr_line3,   
    wash_appraisal_notice_prop_info.addr_city,   
    wash_appraisal_notice_prop_info.addr_state,   
    wash_appraisal_notice_prop_info.addr_zip,   
    wash_appraisal_notice_prop_info.addr_country,   
    wash_appraisal_notice_prop_info.curr_total_base,  
    wash_appraisal_notice_prop_info.total_assessed_value
FROM prop_event_assoc INNER JOIN  
    event ON   
    prop_event_assoc.event_id = event.event_id INNER JOIN  
    wash_appraisal_notice_prop_info ON   
--  prop_event_assoc.prop_id = appr_notice_prop_list.prop_id AND  
    event.ref_id1 = wash_appraisal_notice_prop_info.prop_id AND  
     event.ref_year = wash_appraisal_notice_prop_info.notice_year AND   
    event.ref_num = wash_appraisal_notice_prop_info.notice_run_id  
WHERE (event.ref_evt_type = 'AN')

GO

