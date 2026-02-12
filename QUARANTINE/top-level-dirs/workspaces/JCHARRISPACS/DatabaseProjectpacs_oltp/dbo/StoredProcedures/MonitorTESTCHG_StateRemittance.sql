

---here is how you set up the monitor call: {Call MonitorTESTCHG_StateRemittance ('2/1/2017', '2/28/2017')} 


CREATE procedure [dbo].[MonitorTESTCHG_StateRemittance] 


@begin_date datetime,
@end_date datetime


as 

set nocount on 

--- commented out line for case for payee_name

select 
		t.fund_number, 
		t.fund_name,
		replace(fa.account_number, left(fa.account_number, 8) , '') as revenue_code,
		fa.account_description, payee_name,
		--case when p.payee_name in ('SUPERIOR COURT', 'CORRECT-SUP COURT', 'CORRECTION-SUP COURT') 
		--	then 'SUPERIOR COURT'
		--	when p.payee_name in ('DISTRICT COURT', 'CORRECT-DIST COURT', 'CORRECTION-DIST COURT')
		--		then 'DISTRICT COURT'
		--		else ''
		--	end as payee_name,

		sum(case when ct.transaction_type = 'VOID' then (-1*fm.amount) else fm.amount end) mr_pd
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
--and fa.account_number = '6405101.386.88.0000'
and dbo.fn_ParseDelimitedColumn(account_number, '.', 1) like '64%'
group by 
		t.fund_number, 
		t.fund_name,
		fa.account_number,
		fa.account_description,payee_name
		--case when p.payee_name in ('SUPERIOR COURT', 'CORRECT-SUP COURT', 'CORRECTION-SUP COURT') 
		--		then 'SUPERIOR COURT'
		--	when p.payee_name in ('DISTRICT COURT', 'CORRECT-DIST COURT', 'CORRECTION-DIST COURT')
		--		then 'DISTRICT COURT'
		--		else ''
		--	end
order by t.fund_number, payee_name
--, case when p.payee_name in ('SUPERIOR COURT', 'CORRECT-SUP COURT', 'CORRECTION-SUP COURT') 
--				then 'SUPERIOR COURT'
--			when p.payee_name in ('DISTRICT COURT', 'CORRECT-DIST COURT', 'CORRECTION-DIST COURT')
--				then 'DISTRICT COURT'
--				else ''
			--end

GO

