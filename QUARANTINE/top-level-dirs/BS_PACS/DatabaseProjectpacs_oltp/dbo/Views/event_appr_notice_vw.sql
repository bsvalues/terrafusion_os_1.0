








CREATE VIEW dbo.event_appr_notice_vw
AS
SELECT event.event_id, event.system_type, event.event_type, 
    event.event_date, event.pacs_user, event.event_desc, 
    event.ref_evt_type, appr_notice_prop_list.notice_yr, 
    appr_notice_prop_list.notice_num, 
    appr_notice_prop_list.prop_id, appr_notice_prop_list.owner_id, 
    appr_notice_prop_list.sup_num, appr_notice_prop_list.sup_yr, 
    appr_notice_prop_list.file_as_name, 
    appr_notice_prop_list.addr_line1, 
    appr_notice_prop_list.addr_line2, 
    appr_notice_prop_list.addr_line3, 
    appr_notice_prop_list.addr_city, 
    appr_notice_prop_list.addr_state, 
    appr_notice_prop_list.addr_zip, 
    appr_notice_prop_list.addr_country, 
    appr_notice_prop_list.an_assessed_val
FROM prop_event_assoc INNER JOIN
    event ON 
    prop_event_assoc.event_id = event.event_id INNER JOIN
    appr_notice_prop_list ON 
--  prop_event_assoc.prop_id = appr_notice_prop_list.prop_id AND
    event.ref_id1 = appr_notice_prop_list.prop_id AND
     event.ref_year = appr_notice_prop_list.notice_yr AND 
    event.ref_num = appr_notice_prop_list.notice_num
WHERE (event.ref_evt_type = 'AN')

GO

