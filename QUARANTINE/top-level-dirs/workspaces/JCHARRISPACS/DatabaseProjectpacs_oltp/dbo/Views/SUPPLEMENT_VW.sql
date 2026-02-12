
CREATE VIEW dbo.SUPPLEMENT_VW
AS
SELECT s.sup_tax_yr, s.sup_num, 
    s.sup_group_id, sg.sup_create_dt, 
    sg.sup_arb_ready_dt, sg.sup_accept_dt, 
    sg.sup_group_desc, sg.status_cd, 
    ss.status_desc, 
    pu_accept.pacs_user_name AS accept_user_name, 
    pu_accept.full_name AS accept_full_name, 
    sg.sup_accept_by_id, sg.sup_bill_create_dt, 
    sg.sup_bills_created_by_id, 
    pu_bc.pacs_user_name AS create_bill_user_name, 
    pu_bc.full_name AS create_bill_full_name,
		sg.sup_bill_status
FROM supplement as s
with (nolock)
join sup_group as sg
with (nolock)
on s.sup_group_id = sg.sup_group_id
join supp_status as ss
with (nolock)
on sg.status_cd = ss.status_cd
left outer join pacs_user as pu_accept
with (nolock)
on sg.sup_accept_by_id = pu_accept.pacs_user_id
left outer join pacs_user as pu_bc
with (nolock)
on sg.sup_bills_created_by_id = pu_bc.pacs_user_id

GO

