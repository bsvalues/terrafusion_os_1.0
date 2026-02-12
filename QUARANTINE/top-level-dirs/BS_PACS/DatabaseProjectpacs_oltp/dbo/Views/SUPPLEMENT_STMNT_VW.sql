
CREATE VIEW dbo.SUPPLEMENT_STMNT_VW
AS
SELECT supplement.sup_tax_yr, supplement.sup_num, 
    supplement.sup_group_id, sup_group.sup_create_dt, 
    sup_group.sup_arb_ready_dt, sup_group.sup_accept_dt, 
    sup_group.sup_group_desc, sup_group.status_cd, 
    supp_status.status_desc, 
    pacs_user.pacs_user_name AS accept_user_name, 
    pacs_user.full_name AS accept_full_name, 
    sup_group.sup_accept_by_id, sup_group.sup_bill_create_dt, 
    sup_group.sup_bills_created_by_id, 
    pacs_user1.pacs_user_name AS create_bill_user_name, 
    pacs_user1.full_name AS create_bill_full_name,
		sup_group.sup_bill_status
FROM pacs_user pacs_user1 RIGHT OUTER JOIN
    supplement INNER JOIN
    sup_group ON 
    supplement.sup_group_id = sup_group.sup_group_id INNER JOIN
    supp_status ON 
    sup_group.status_cd = supp_status.status_cd ON 
    pacs_user1.pacs_user_id = sup_group.sup_bills_created_by_id
     LEFT OUTER JOIN
    pacs_user ON 
    sup_group.sup_accept_by_id = pacs_user.pacs_user_id
where not exists (select * from levy_supp_assoc where sup_yr  = supplement.sup_tax_yr
					        and   sup_num = supplement.sup_num)

GO

