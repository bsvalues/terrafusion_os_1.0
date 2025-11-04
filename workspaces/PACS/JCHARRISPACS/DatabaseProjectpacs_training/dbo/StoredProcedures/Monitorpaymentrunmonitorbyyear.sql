



--monitor command to run this monitor -- {call Monitorpaymentrunmonitorbyyear('2020')}


create procedure [dbo].[Monitorpaymentrunmonitorbyyear]

@year	numeric

as

select p.payment_run_id, count(distinct ip.payment_run_detail_id) as record_count,  p.status, p.updated_date as date_prepared, p.payment_post_date as Post_date, p.paid_date, sum(ip.amount_paid) as amt_pd, sum(amount_due) amt_due, 
p.payment_run_type,
case 
	When p.single_payment = 0 THEN 'No'
	When p.single_payment = 0 THEN 'Yes' 
	Else 'No' END as Single_Payment, pu.pacs_user_name, p.description,
	sum(case when ang.status = 'A' then 1 else 0 end) as accepted,
	sum(case when ang.status = 'R' then 1 else 0 end) as rejected
from import_Payment_run p
inner join import_payment ip
on p.payment_run_id = ip.payment_run_id
inner join pacs_user pu
on p.pacs_User_id = pu.pacs_user_Id
inner join import_payment_property_vw ang
on ang.payment_run_id = ip.payment_run_id
and ang.payment_run_id = p.payment_run_id 
and ang.year = ip.year
and ang.prop_id = ip.prop_id
where ang.year = @year

group by p.payment_run_id, p.status, p.updated_date, p.payment_post_date, p.paid_date, p.payment_run_type, p.single_Payment, pu.pacs_user_name, p.description
order by p.payment_run_id desc

GO

