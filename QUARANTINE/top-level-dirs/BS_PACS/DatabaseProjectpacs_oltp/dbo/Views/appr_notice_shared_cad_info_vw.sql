



CREATE VIEW dbo.appr_notice_shared_cad_info_vw
AS
SELECT appr_notice_prop_list_shared_cad.notice_yr, 
    appr_notice_prop_list_shared_cad.notice_num, 
    appr_notice_prop_list_shared_cad.prop_id, 
    appr_notice_prop_list_shared_cad.owner_id, 
    appr_notice_prop_list_shared_cad.sup_num, 
    appr_notice_prop_list_shared_cad.sup_yr, 
    appr_notice_prop_list_shared_cad.CAD_desc, 
    appr_notice_prop_list_shared_cad.CAD_addr_line1, 
    appr_notice_prop_list_shared_cad.CAD_addr_line2, 
    appr_notice_prop_list_shared_cad.CAD_addr_line3, 
    appr_notice_prop_list_shared_cad.CAD_addr_city, 
    appr_notice_prop_list_shared_cad.CAD_addr_state, 
    appr_notice_prop_list_shared_cad.CAD_addr_zip, 
    appr_notice_prop_list_shared_cad.CAD_phone_num
FROM appr_notice_prop_list INNER JOIN
    appr_notice_prop_list_shared_cad ON 
    appr_notice_prop_list.notice_yr = appr_notice_prop_list_shared_cad.notice_yr
     AND 
    appr_notice_prop_list.notice_num = appr_notice_prop_list_shared_cad.notice_num
     AND 
    appr_notice_prop_list.prop_id = appr_notice_prop_list_shared_cad.prop_id
     AND 
    appr_notice_prop_list.owner_id = appr_notice_prop_list_shared_cad.owner_id
     AND 
    appr_notice_prop_list.sup_num = appr_notice_prop_list_shared_cad.sup_num
     AND 
    appr_notice_prop_list.sup_yr = appr_notice_prop_list_shared_cad.sup_yr

GO

