

CREATE PROCEDURE MonthlyReport

@pacs_user_id	int,
@entity_id	int,
@str_begin_date	varchar(25),
@str_end_date	varchar(25)

as

declare @begin_date		datetime
declare @end_date		datetime
declare @begin_fiscal_date  	datetime
declare @fiscal_year		varchar(10)
declare @tax_yr			numeric(4)
declare @report_end_date	datetime

set @begin_date = convert(datetime, @str_begin_date)
set @end_date	= convert(datetime, @str_end_date)

set @report_end_date = @end_date
set @end_date = dateadd(dd, 1, @end_date)

select @fiscal_year       = fiscal_year,
       @begin_fiscal_date = fiscal_begin_date
from entity
where entity_id = @entity_id

select @tax_yr = tax_yr
from pacs_system


/* clear out existing rows */
delete from monthly_report_detail where pacs_user_id = @pacs_user_id and entity_id = @entity_id
delete from monthly_report	  where pacs_user_id = @pacs_user_id and entity_id = @entity_id

/* create temp tables to work with */
create table #monthly_report_detail (
	entity_id	int,
	tax_yr		numeric(4),
	orig_tax	numeric(14,2),
	adj_amt		numeric(14,2),
	prev_coll	numeric(14,2),
	curr_coll	numeric(14,2),
	prev_pi		numeric(14,2),
	curr_pi		numeric(14,2),
	prev_und	numeric(14,2),
	curr_und	numeric(14,2),
	prev_over	numeric(14,2),
	curr_over	numeric(14,2),
	prev_disc	numeric(14,2),
	curr_disc	numeric(14,2),
	prev_atty_fee   numeric(14,2),
	curr_atty_fee   numeric(14,2)	
)

insert into #monthly_report_detail 
(
entity_id,
tax_yr,
orig_tax,
adj_amt,
prev_coll,
curr_coll,
prev_pi,
curr_pi,
prev_und,
curr_und,
prev_over,
curr_over,
prev_disc,
curr_disc,
prev_atty_fee,
curr_atty_fee
)
select 	@entity_id,
	tax_year,
	beg_mno + beg_ins as orig_tax,
	IsNull((select sum((curr_mno_tax + curr_ins_tax) - (prev_mno_tax + prev_ins_tax))
		from bill_adj_trans
		where bill_adj_trans.entity_id = fiscal_year_totals.entity_id
		and   bill_adj_trans.sup_tax_yr = fiscal_year_totals.tax_year
		and   bill_adj_trans.modify_dt >= @begin_fiscal_date 
		and   bill_adj_trans.modify_dt <  @end_date), 0) as adj_amt,
	
	IsNull( (SELECT  SUM(payment_trans.mno_amt + payment_trans.ins_amt + payment_trans.underage_mno_amt + payment_trans.underage_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_fiscal_date  
		and   batch.balance_dt <  @begin_date) , 0) as prev_coll,

	IsNull( (SELECT  SUM(payment_trans.mno_amt + payment_trans.ins_amt + payment_trans.underage_mno_amt + payment_trans.underage_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0) as curr_coll,
	
	IsNull( (SELECT  SUM(payment_trans.penalty_mno_amt + payment_trans.penalty_ins_amt +
			     payment_trans.interest_mno_amt + payment_trans.interest_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_fiscal_date  
		and   batch.balance_dt <  @begin_date) , 0) as prev_pi,

	IsNull( (SELECT  SUM(payment_trans.penalty_mno_amt + payment_trans.penalty_ins_amt +
			     payment_trans.interest_mno_amt + payment_trans.interest_ins_amt) 
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0) as curr_pi,

	IsNull( (SELECT  SUM(payment_trans.underage_mno_amt + payment_trans.underage_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_fiscal_date  
		and   batch.balance_dt <  @begin_date) , 0) as prev_und,

	IsNull( (SELECT  SUM(payment_trans.underage_mno_amt + payment_trans.underage_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0) as curr_und,

	IsNull( (SELECT  SUM(payment_trans.overage_mno_amt + payment_trans.overage_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_fiscal_date  
		and   batch.balance_dt <  @begin_date) , 0) as prev_over,

	IsNull( (SELECT  SUM(payment_trans.overage_mno_amt + payment_trans.overage_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0) as curr_over,

	IsNull( (SELECT  SUM(payment_trans.discount_mno_amt + payment_trans.discount_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_fiscal_date  
		and   batch.balance_dt <  @begin_date) , 0) as prev_disc,

	IsNull( (SELECT  SUM(payment_trans.discount_mno_amt + payment_trans.discount_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0) as curr_disc,

	IsNull( (SELECT  SUM(payment_trans.attorney_fee_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_fiscal_date  
		and   batch.balance_dt <  @begin_date) , 0) as prev_atty_fee,

	IsNull( (SELECT  SUM(payment_trans.attorney_fee_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0) as curr_atty_fee

from fiscal_year_totals, entity
where fiscal_year_totals.entity_id = entity.entity_id
and entity.fiscal_year = fiscal_year_totals.fiscal_year
and entity.entity_id = @entity_id


declare @curr_yr_curr_pi	numeric(14,2)
declare @curr_yr_prev_pi	numeric(14,2)
declare @delq_yr_curr_pi		numeric(14,2)
declare @delq_yr_prev_pi		numeric(14,2)

declare @curr_disc		numeric(14,2)
declare @prev_disc		numeric(14,2)
declare @curr_over		numeric(14,2)
declare @prev_over		numeric(14,2)
declare @curr_under		numeric(14,2)
declare @prev_under		numeric(14,2)
declare @prev_tax_cert		numeric(14,2)
declare @curr_tax_cert		numeric(14,2)
declare @prev_atty_fee		numeric(14,2)
declare @curr_atty_fee		numeric(14,2)

declare @curr_refund		numeric(14,2)
declare @prev_refund		numeric(14,2)

declare @delq_tax 		numeric(14,2)
declare @delq_adj 		numeric(14,2)
declare @delq_prev_coll 	numeric(14,2)
declare @delq_curr_coll 	numeric(14,2)
declare @delq_curr_und		numeric(14,2)

declare @total_tax 		numeric(14,2)
declare @total_adj 		numeric(14,2)
declare @total_prev_coll 	numeric(14,2)
declare @total_curr_coll 	numeric(14,2)
declare @total_curr_und		numeric(14,2)

declare @curr_yr_prev_coll	numeric(14,2)
declare @curr_yr_curr_coll	numeric(14,2)
declare @curr_yr_orig_tax	numeric(14,2)


select @curr_yr_curr_pi = sum(curr_pi),
       @curr_yr_prev_pi = sum(prev_pi),
       @curr_yr_prev_coll = sum(prev_coll),
       @curr_yr_curr_coll = sum(curr_coll),
       @curr_yr_orig_tax  = sum(orig_tax)
from #monthly_report_detail 
where tax_yr = @tax_yr

select @delq_yr_curr_pi = sum(curr_pi),
       @delq_yr_prev_pi = sum(prev_pi)
from #monthly_report_detail
where tax_yr < @tax_yr

select @curr_disc  = sum(curr_disc),
       @prev_disc  = sum(prev_disc),
       @curr_over  = sum(curr_over),
       @prev_over  = sum(prev_over),
       @curr_under = sum(curr_und),
       @prev_under = sum(prev_und),
       @prev_atty_fee = sum(prev_atty_fee),
       @curr_atty_fee = sum(curr_atty_fee)
from #monthly_report_detail


select 
@delq_tax 	= sum(orig_tax),
@delq_adj 	= sum(adj_amt),
@delq_prev_coll = sum(prev_coll),
@delq_curr_coll = sum(curr_coll),
@delq_curr_und  = sum(curr_und)
from #monthly_report_detail
where tax_yr < @tax_yr


select 
@total_tax       = sum(orig_tax),
@total_adj       = sum(adj_amt),
@total_prev_coll = sum(prev_coll),
@total_curr_coll = sum(curr_coll),
@total_curr_und  = sum(curr_und)
from #monthly_report_detail


select @prev_tax_cert = sum(fee_amt)
from payment,
     payment_trans,
     batch,
     fee,
     fee_prop_entity_assoc
where payment.payment_id = payment_trans.payment_id
and   payment.batch_id   = batch.batch_id
and   payment_trans.fee_id = fee.fee_id
and   fee.type_cd = 'TC'
and   batch.balance_dt >= @begin_fiscal_date  
and   batch.balance_dt <  @begin_date
and   fee.fee_id = fee_prop_entity_assoc.fee_id
and   fee_prop_entity_assoc.entity_id = @entity_id
--and   fee_prop_entity_assoc.bill_entity_flag = 'T'

select @curr_tax_cert = sum(fee_amt)
from payment,
     payment_trans,
     batch,
     fee,
     fee_prop_entity_assoc
where payment.payment_id = payment_trans.payment_id
and   payment.batch_id   = batch.batch_id
and   payment_trans.fee_id = fee.fee_id
and   fee.type_cd = 'TC'
and   batch.balance_dt >= @begin_date  
and   batch.balance_dt <  @end_date
and   fee.fee_id = fee_prop_entity_assoc.fee_id
and  fee_prop_entity_assoc.entity_id = @entity_id
--and   fee_prop_entity_assoc.bill_entity_flag = 'T'



SELECT  @prev_refund = SUM((refund_trans.refund_m_n_o_pd  +
refund_trans.refund_i_n_s_pd  +
refund_trans.refund_pen_m_n_o_pd + 
refund_trans.refund_pen_i_n_s_pd +
refund_trans.refund_int_m_n_o_pd +
refund_trans.refund_int_i_n_s_pd +
refund_trans.refund_atty_fee_pd ))                   
	from refund_trans, refund, batch, bill, fiscal_year_totals
where refund.refund_id = refund_trans.refund_id
and   refund.batch_id   = batch.batch_id
and   refund_trans.bill_id = bill.bill_id
and   bill.entity_id = fiscal_year_totals.entity_id
and   bill.sup_tax_yr = fiscal_year_totals.tax_year
and   batch.balance_dt >= @begin_fiscal_date  
and   batch.balance_dt <  @begin_date
and   bill.entity_id = @entity_id


SELECT  @curr_refund = SUM((refund_trans.refund_m_n_o_pd  +
refund_trans.refund_i_n_s_pd  +
refund_trans.refund_pen_m_n_o_pd + 
refund_trans.refund_pen_i_n_s_pd +
refund_trans.refund_int_m_n_o_pd +
refund_trans.refund_int_i_n_s_pd +
refund_trans.refund_atty_fee_pd ))                   
	from refund_trans, refund, batch, bill, fiscal_year_totals
where refund.refund_id = refund_trans.refund_id
and   refund.batch_id   = batch.batch_id
and   refund_trans.bill_id = bill.bill_id
and   bill.entity_id = fiscal_year_totals.entity_id
and   bill.sup_tax_yr = fiscal_year_totals.tax_year
and   batch.balance_dt >= @begin_date  
and   batch.balance_dt <  @end_date
and   bill.entity_id = @entity_id


insert into monthly_report
(
pacs_user_id,
entity_id,
fiscal_year,
begin_date,
end_date,
curr_yr_prev_pi,
curr_yr_curr_pi,
delq_yr_prev_pi,
delq_yr_curr_pi,
prev_und,
curr_und,
prev_over,
curr_over,
prev_disc,
curr_disc,
delq_tax,
delq_adj,
delq_prev_coll, 
delq_curr_coll ,
total_tax,
total_adj,
total_prev_coll, 
total_curr_coll,
curr_tax_cert,
prev_tax_cert,
curr_yr_prev_coll,
curr_yr_curr_coll,
curr_yr_orig_tax,
curr_atty_fees,
prev_atty_fees,
curr_refund,
prev_refund,
delq_curr_und,
total_curr_und
)
values
(
@pacs_user_id,
@entity_id,
@fiscal_year,
@begin_date,
@report_end_date,
IsNull(@curr_yr_prev_pi, 0),	
IsNull(@curr_yr_curr_pi, 0),
IsNull(@delq_yr_prev_pi, 0),	
IsNull(@delq_yr_curr_pi, 0),	
IsNull(@prev_under, 0),
IsNull(@curr_under, 0),
IsNull(@prev_over, 0),
IsNull(@curr_over, 0),
IsNull(@prev_disc, 0),
IsNull(@curr_disc, 0),
IsNull(@delq_tax, 0),
IsNull(@delq_adj, 0),
IsNull(@delq_prev_coll, 0), 
IsNull(@delq_curr_coll, 0), 	
IsNull(@total_tax, 0),
IsNull(@total_adj, 0),
IsNull(@total_prev_coll, 0), 
IsNull(@total_curr_coll, 0),
IsNull(@curr_tax_cert, 0),
IsNull(@prev_tax_cert, 0),
IsNull(@curr_yr_prev_coll,0),
IsNull(@curr_yr_curr_coll,0),
IsNull(@curr_yr_orig_tax,0),
IsNull(@curr_atty_fee,0),
IsNull(@prev_atty_fee,0),
IsNull(@curr_refund,0),
IsNull(@prev_refund,0),
IsNull(@delq_curr_und,0),
IsNull(@total_curr_und,0)
)



insert into monthly_report_detail
(
pacs_user_id,
entity_id,
year_desc,
tax_yr,
orig_tax,
adj_amt	,
prev_coll,
curr_coll,
prev_pi	,
curr_pi	,
prev_und,
curr_und,
prev_over,
curr_over,
prev_disc,
curr_disc
)
select 
@pacs_user_id,
entity_id,
'CURRENT TAXES - ' + convert(varchar(4), tax_yr) ,
tax_yr,
orig_tax,
adj_amt,
prev_coll,
curr_coll,
prev_pi,
curr_pi,
prev_und,
curr_und,
prev_over,
curr_over,
prev_disc,
curr_disc
from #monthly_report_detail
where tax_yr = @tax_yr




insert into monthly_report_detail
(
pacs_user_id,
entity_id,
year_desc,
tax_yr,
orig_tax,
adj_amt	,
prev_coll,
curr_coll,
prev_pi	,
curr_pi	,
prev_und,
curr_und,
prev_over,
curr_over,
prev_disc,
curr_disc
)
select 
@pacs_user_id,
entity_id,
convert(varchar(4), tax_yr),
tax_yr,
orig_tax,
adj_amt,
prev_coll,
curr_coll,
prev_pi,
curr_pi,
prev_und,
curr_und,
prev_over,
curr_over,
prev_disc,
curr_disc
from #monthly_report_detail
where tax_yr >= 1990
and tax_yr < @tax_yr


insert into monthly_report_detail
(
pacs_user_id,
entity_id,
year_desc,
tax_yr,
orig_tax,
adj_amt	,
prev_coll,
curr_coll,
prev_pi	,
curr_pi	,
prev_und,
curr_und,
prev_over,curr_over,
prev_disc,
curr_disc)
select 
@pacs_user_id,
entity_id,
'1989 AND PRIOR YEARS',
3,
sum(orig_tax),
sum(adj_amt),
sum(prev_coll),
sum(curr_coll),
sum(prev_pi),
sum(curr_pi),
sum(prev_und),
sum(curr_und),
sum(prev_over),
sum(curr_over),
sum(prev_disc),
sum(curr_disc)
from #monthly_report_detail
where tax_yr < 1990
group by entity_id

GO

