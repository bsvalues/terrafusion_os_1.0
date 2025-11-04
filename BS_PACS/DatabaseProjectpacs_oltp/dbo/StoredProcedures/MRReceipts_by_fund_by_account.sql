

 

---here is how you set up the monitor call: {Call MRReceipts_by_fund_by_account ('12/16/2016', '12/31/2016')} 

 

/* 

 



---created table to hold the MR Totals


create table monitor_MR_totals_by_fund

(


fund_number	varchar(8),

fund_name	varchar(50),

revenue_code	varchar(259),

revenue_description	varchar(100),

mr_pd	numeric(14,2)

)



 

*/

 

 

CREATE procedure [dbo].[MRReceipts_by_fund_by_account] 

 

 

@begin_date datetime,

@end_date datetime

 

 

as 

 

set nocount on 

 

--set Ansi_warnings off

 

delete from monitor_MR_totals_by_fund

 

 

insert into monitor_MR_totals_by_fund

select 

		t.fund_number, 

		t.fund_name,

		replace(fa.account_number, left(fa.account_number, 8) , '') as revenue_code,

		fa.account_description,

		sum(case when ct.base_amount_pd < 0 then (-1*fm.amount) else fm.amount end) mr_pd

FROM [fee_misc_rcpt_detail] fm

join coll_transaction ct on

	fm.fee_id = ct.trans_group_id

join payment_transaction_assoc pta on

	ct.transaction_id = pta.transaction_id

join payment p on 

	pta.payment_id = p.payment_id

join fin_account fa on

	fm.fin_account_id = fa.fin_account_id

left join monitor_fund_list t on 

	replace(t.fund_number, '-', '') = dbo.fn_ParseDelimitedColumn(account_number, '.', 1) 

join batch ba on

	ba.batch_id = ct.batch_id

where ba.balance_dt >= @begin_date

and ba.balance_dt <= @end_date

group by 

		t.fund_number, 

		t.fund_name,

		fa.account_number,

		fa.account_description





insert into monitor_MR_totals_by_fund

select 	

		t.fund_number, 

		t.fund_name,

		'All Revenue Codes',

		'',

		sum(case when ct.base_amount_pd < 0 then (-1*fm.amount) else fm.amount end)  mr_pd

FROM [fee_misc_rcpt_detail] fm

join coll_transaction ct on

	fm.fee_id = ct.trans_group_id

join payment_transaction_assoc pta on

	ct.transaction_id = pta.transaction_id

join payment p on 

	pta.payment_id = p.payment_id

join fin_account fa on

	fm.fin_account_id = fa.fin_account_id

left join monitor_fund_list t on 

	replace(t.fund_number, '-', '') = dbo.fn_ParseDelimitedColumn(account_number, '.', 1) 

join batch ba on

	ba.batch_id = ct.batch_id

where ba.balance_dt >= @begin_date

and ba.balance_dt <= @end_date

group by 

		t.fund_number, 

		t.fund_name



insert into monitor_MR_totals_by_fund

select 	

		'9999999', 

		'', 

		'Total Receipts',

		'',

		sum(case when ct.base_amount_pd < 0 then (-1*fm.amount) else fm.amount end)  mr_pd

FROM [fee_misc_rcpt_detail] fm

join coll_transaction ct on

	fm.fee_id = ct.trans_group_id

join payment_transaction_assoc pta on

	ct.transaction_id = pta.transaction_id

join payment p on 

	pta.payment_id = p.payment_id

join fin_account fa on

	fm.fin_account_id = fa.fin_account_id

left join monitor_fund_list t on 

	replace(t.fund_number, '-', '') = dbo.fn_ParseDelimitedColumn(account_number, '.', 1) 

join batch ba on

	ba.batch_id = ct.batch_id

where ba.balance_dt >= @begin_date

and ba.balance_dt <= @end_date

and isnull(fa.account_description, '')  <> ''




select * from monitor_MR_totals_by_fund

order by fund_number, revenue_code



set nocount off

GO

