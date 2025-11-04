




CREATE  PROCEDURE PopulateDBReport
@input_user_id	int,
@input_sql	varchar(512)

AS

declare @exec_sql varchar(8000)

delete from _dbd_payments
where pacs_user_id = @input_user_id

delete from _dbd_escrow_payments
where pacs_user_id = @input_user_id

delete from _dbd_refunds_paid
where pacs_user_id = @input_user_id

delete from _dbd_payments_totals
where pacs_user_id = @input_user_id

--Payments
set @exec_sql = 'insert into _dbd_payments select ' + cast(@input_user_id as varchar(20)) + ' as pacs_user_id,
	b.sup_tax_yr,
	b.prop_id,
	b.stmnt_id,
	e.entity_cd,
	pr.geo_id,
	oa.file_as_name as owner_file_as_name,
	p.payment_id,
	p.batch_id,
	ba.balance_dt,
	ba.description,
	p.post_date,
	p.date_paid,
	p.check_num,
	p.mo_num,
	p.check_amt,
	p.cash_amt,
	p.mo_amt,
	p.cc_amt,
	case when p.cc_type is not null and p.cc_amt > 0 then p.cc_type + '':XXXX-'' + p.cc_last_four_digits end as cc_info,
	p.cc_fee,
	case when p.payee_id > 0 then pa.file_as_name else p.paid_by end as payment_file_as_name,
	pt.transaction_id,
	pt.fee_amt,
	pt.mno_amt,
	pt.ins_amt,
	pt.penalty_mno_amt,
	pt.penalty_ins_amt,
	pt.interest_mno_amt,
	pt.interest_ins_amt,
	pt.attorney_fee_amt,
	pt.discount_mno_amt,
	pt.discount_ins_amt,
	pt.underage_mno_amt,
	pt.underage_ins_amt,
	pt.overage_mno_amt,
	pt.overage_ins_amt,
	pu.pacs_user_name
	FROM dbo.payment p with (nolock) INNER JOIN
	dbo.payment_trans pt with (nolock) ON p.payment_id = pt.payment_id INNER JOIN
	dbo.batch ba with (nolock) ON p.batch_id = ba.batch_id INNER JOIN
	dbo.pacs_user pu with (nolock) ON p.operator_id = pu.pacs_user_id INNER JOIN
	dbo.bill b with (nolock) ON pt.bill_id = b.bill_id INNER JOIN
	dbo.property pr with (nolock) ON b.prop_id = pr.prop_id INNER JOIN
	dbo.entity e with (nolock) ON b.entity_id = e.entity_id INNER JOIN
	dbo.account oa with (nolock) ON b.owner_id = oa.acct_id LEFT OUTER JOIN
	dbo.account pa with (nolock) ON p.payee_id = pa.acct_id '

if (len(@input_sql) > 0)
begin
	set @exec_sql = @exec_sql + 'WHERE ' + @input_sql
end

exec (@exec_sql)

--Payment Totals
insert into _dbd_payments_totals
select @input_user_id,
'P',
sum(isnull(check_amt, 0)),
sum(isnull(cash_amt, 0)),
sum(isnull(mo_amt, 0)),
sum(isnull(cc_amt, 0)),
sum(isnull(cc_fee, 0))
from _dbd_payments
where pacs_user_id = @input_user_id

--Escrow Payments
set @exec_sql = 'insert into _dbd_escrow_payments select ' + cast(@input_user_id as varchar(20)) + ' as pacs_user_id,
	b.batch_id,
	b.description,
	e.escrow_payment_id,
	e.receipt_id,
	e.amount_paid,
	e.date_paid,
	e.payment_method,
	e.check_num,
	a.file_as_name as payment_file_as_name,
	pu.pacs_user_name,
	et.prop_id,
	et.year, 
	p.geo_id,
	oa.file_as_name as owner_file_as_name
	from dbo.batch b with (nolock) INNER JOIN
	dbo.escrow e with (nolock) ON b.batch_id = e.batch_id INNER JOIN
	dbo.pacs_user pu with (nolock) ON e.user_id = pu.pacs_user_id INNER JOIN
	dbo.account a with (nolock) ON e.payee_id = a.acct_id LEFT OUTER JOIN
	dbo.escrow_trans et with (nolock) ON e.escrow_payment_id = et.escrow_id INNER JOIN
	dbo.property p with (nolock) ON et.prop_id = p.prop_id LEFT OUTER JOIN
	dbo.account oa with (nolock) ON et.owner_id = oa.acct_id '

if (len(@input_sql) > 0)
begin
	set @exec_sql = @exec_sql + 'WHERE ' + @input_sql
end

exec (@exec_sql)

--Escrow Payment Totals
insert into _dbd_payments_totals
select @input_user_id,
'EP',
sum(case when payment_method = 'CHK' then isnull(amount_paid, 0) else 0 end),
sum(case when payment_method = 'CA' then isnull(amount_paid, 0) else 0 end),
sum(case when payment_method = 'MO' then isnull(amount_paid, 0) else 0 end),
0,
0
from _dbd_escrow_payments
where pacs_user_id = @input_user_id

--Refunds Paid
set @exec_sql = 'insert into _dbd_refunds_paid select ' + cast(@input_user_id as varchar(20)) + ' as pacs_user_id,
	b.batch_id,
	b.balance_dt,
	b.description,
	r.refund_id,
	r.date_refunded,
	r.refund_amt,
	rt.transaction_id,
	rt.refund_m_n_o_pd,
	rt.refund_i_n_s_pd,
	rt.refund_pen_m_n_o_pd,
	rt.refund_pen_i_n_s_pd,
	rt.refund_int_m_n_o_pd,
	rt.refund_int_i_n_s_pd,
	rt.refund_atty_fee_pd,
	pu.pacs_user_name,
	bl.sup_tax_yr,
	bl.entity_id,
	bl.prop_id,
	bl.stmnt_id,
	e.entity_cd,
	a.file_as_name as owner_file_as_name,
	p.geo_id
	from dbo.batch b with (nolock) LEFT OUTER JOIN
	dbo.refund r with (nolock) ON b.batch_id = r.batch_id INNER JOIN
	dbo.pacs_user pu with (nolock) ON r.operator_id = pu.pacs_user_id INNER JOIN
	dbo.refund_trans rt with (nolock) ON r.refund_id = rt.refund_id INNER JOIN
	dbo.bill bl with (nolock) ON rt.bill_id = bl.bill_id INNER JOIN
	dbo.account a with (nolock) ON bl.owner_id = a.acct_id INNER JOIN
	dbo.property p with (nolock) ON bl.prop_id = p.prop_id INNER JOIN
	dbo.entity e with (nolock) ON bl.entity_id = e.entity_id '

if (len(@input_sql) > 0)
begin
	set @exec_sql = @exec_sql + 'WHERE ' + @input_sql
end

exec (@exec_sql)

--Refunds Paid Totals
insert into _dbd_payments_totals
select @input_user_id,
'RP',
sum(isnull(refund_amt, 0)),
0,
0,
0,
0
from _dbd_refunds_paid
where pacs_user_id = @input_user_id

--Grand Totals
insert into _dbd_payments_totals
select @input_user_id,
'GT',
sum(sum_check_amt),
sum(sum_cash_amt),
sum(sum_mo_amt),
sum(sum_cc_amt),
sum(sum_cc_fee)
from _dbd_payments_totals
where pacs_user_id = @input_user_id

GO

