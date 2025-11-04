









CREATE   procedure PrepYeartoDateRecap

@input_user_id   int,
@input_entity_id int,
@input_str_date varchar(100)

as

declare @input_date			datetime
declare @recap_yr			numeric(4)
declare @sum_refund_paid 		numeric(14,2)
declare @refund_paid			numeric(14,2)
declare @entity_id			int
declare @adj_end_date			datetime

select @input_date = convert(datetime, @input_str_date)


select @adj_end_date = dateadd(dd, 1, @input_date)

delete from year_to_date_recap
where pacs_user_id = @input_user_id

delete from year_to_date_recap_range
where pacs_user_id = @input_user_id

delete from year_to_date_recap_refund
where pacs_user_id = @input_user_id



/* indicates we are running this for  1 entity */
if (@input_entity_id > -1)
begin
	insert into year_to_date_recap_range
	(
	pacs_user_id,
	entity_id,
	date_range
	)
	values
	(
	@input_user_id,
	@input_entity_id,
	@input_date
	)
end
else
begin
/* run for all entities */
	insert into year_to_date_recap_range
	(
	pacs_user_id,
	entity_id,
	date_range
	)
	select @input_user_id,
	       entity_id,
	       @input_date
	from entity_collect_for_vw
end
	
/* build temporary table containing bills to be included in ytd recap */

select
entity_id,
sup_tax_yr,
bill_id,
bill_m_n_o + bill_i_n_s as orig_tax,
(bill_m_n_o + bill_i_n_s) + IsNull((select sum((curr_mno_tax + curr_ins_tax) - (prev_mno_tax + prev_ins_tax))
	from bill_adj_trans
	where bill_adj_trans.bill_id = bill.bill_id
	and   (bill_adj_trans.modify_dt < @adj_end_date
	or      bill_adj_trans.modify_dt is null)), 0) as adj_tax,
(bill_m_n_o_pd + bill_i_n_s_pd) - IsNull( (SELECT  SUM(payment_trans.mno_amt + payment_trans.ins_amt)                   
       				          from payment_trans with (nolock), payment with (nolock), batch with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id = bill.bill_id
					  and   batch.balance_dt > @input_date) , 0) as tax_pd,
discount_mno_pd + discount_ins_pd - IsNull( (SELECT  SUM(payment_trans.discount_mno_amt + payment_trans.discount_ins_amt)                   
       				          from payment_trans with (nolock), payment with (nolock), batch with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id = bill.bill_id
					  and   batch.balance_dt > @input_date) , 0) as disc_pd,
penalty_m_n_o_pd + penalty_i_n_s_pd - IsNull( (SELECT  SUM(payment_trans.penalty_mno_amt + payment_trans.penalty_ins_amt)                   
       				          from payment_trans with (nolock), payment with (nolock), batch with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id = bill.bill_id
					  and   batch.balance_dt > @input_date) , 0) as penalty_pd,
interest_m_n_o_pd + interest_i_n_s_pd - IsNull( (SELECT  SUM(payment_trans.interest_mno_amt + payment_trans.interest_ins_amt)                   
       				          from payment_trans with (nolock), payment with (nolock), batch with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id = bill.bill_id
					  and   batch.balance_dt > @input_date) , 0) as interest_pd,
attorney_fees_pd - IsNull( (SELECT  SUM(payment_trans.attorney_fee_amt)                   
       				          from payment_trans with (nolock), payment with (nolock), batch with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id = bill.bill_id
					  and   batch.balance_dt > @input_date) , 0) as att_fee_pd,
overage_mno_pd + overage_ins_pd - IsNull( (SELECT  SUM(payment_trans.overage_mno_amt + payment_trans.overage_ins_amt)                   
       				          from payment_trans with (nolock), payment with (nolock), batch with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id = bill.bill_id
					  and   batch.balance_dt > @input_date) , 0) as overage_pd,
underage_mno_pd + underage_ins_pd - IsNull( (SELECT  SUM(payment_trans.underage_mno_amt + payment_trans.underage_ins_amt)                   
       				          from payment_trans with (nolock), payment with (nolock), batch with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id = bill.bill_id
					  and   batch.balance_dt > @input_date) , 0) as underage_pd,

IsNull( (SELECT  SUM(refund_trans.refund_m_n_o_pd + refund_trans.refund_i_n_s_pd)                   
       				          from refund_trans with (nolock), refund with (nolock), batch with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id = bill.bill_id
					  and   batch.balance_dt < @adj_end_date) , 0) as refund_tax_pd,
 IsNull( (SELECT  SUM(refund_trans.refund_disc_ins_pd + refund_trans.refund_disc_mno_pd)                   
       				          from refund_trans with (nolock), refund with (nolock), batch with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id = bill.bill_id
					  and   batch.balance_dt < @adj_end_date) , 0) as refund_disc_pd,
 IsNull( (SELECT  SUM(refund_trans.refund_pen_m_n_o_pd + refund_trans.refund_pen_i_n_s_pd)                   
       				          from refund_trans with (nolock), refund with (nolock), batch with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id = bill.bill_id
					  and   batch.balance_dt < @adj_end_date) , 0) as refund_penalty_pd,
 IsNull( (SELECT  SUM(refund_trans.refund_int_m_n_o_pd + refund_trans.refund_int_i_n_s_pd)                   
       				          from refund_trans with (nolock), refund with (nolock), batch with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id = bill.bill_id
					  and   batch.balance_dt < @adj_end_date) , 0) as refund_interest_pd,
IsNull( (SELECT  SUM(refund_trans.refund_atty_fee_pd)                   
       				          from refund_trans with (nolock), refund with (nolock), batch with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id = bill.bill_id
					  and   batch.balance_dt < @adj_end_date) , 0) as refund_att_fee_pd

into #year_to_date_recap_bill_list

from bill with (nolock)
where entity_id in (select entity_id from year_to_date_recap_range where pacs_user_id = @input_user_id)
and   coll_status_cd <> 'RS'



/* build recap report files */
insert into year_to_date_recap
(recap_yr,
	pacs_user_id,
	entity_id,
orig_tax,
adj_tax,
tax_pd,
disc_pd,
penalty_pd,
interest_pd,
att_fee_pd,
overage_pd,
underage_pd,
num_owe,
pct_collected
)
select  sup_tax_yr,
	@input_user_id,
	entity_id,
       	IsNull(sum(orig_tax), 0),
       	IsNull(sum(adj_tax),  0),
       	IsNull(sum(IsNull(tax_pd, 0) - IsNull(refund_tax_pd, 0)),         0),
       	IsNull(sum(IsNull(disc_pd,0) - IsNull(refund_disc_pd,0)),         0),
       	IsNull(sum(IsNull(penalty_pd, 0) - IsNull(refund_penalty_pd,0)),  0),
       	IsNull(sum(IsNull(interest_pd,0) - IsNull(refund_interest_pd,0)), 0),
       	IsNull(sum(IsNull(att_fee_pd,0)  - IsNull(refund_att_fee_pd,0)),  0),
       	IsNull(sum(overage_pd),  0),
       	IsNull(sum(underage_pd), 0),
       	sum(case when (tax_pd + disc_pd + underage_pd) - (refund_tax_pd + refund_disc_pd)  < adj_tax then 1 else 0 end) ,
       	0
from #year_to_date_recap_bill_list
group by entity_id, sup_tax_yr

update year_to_date_recap set pct_collected =  ((tax_pd/adj_tax) * 100)
where adj_tax > 0 


drop table #year_to_date_recap_bill_list
	


/* build recap refund files */

DECLARE year_to_date_recap_cursor SCROLL CURSOR
FOR select distinct entity_id
       from year_to_date_recap_range
       where pacs_user_id = @input_user_id
	
OPEN year_to_date_recap_cursor
FETCH NEXT FROM year_to_date_recap_cursor into @entity_id

while (@@FETCH_STATUS = 0)
begin

	/* calculate refunds due and refunds paid */
	declare @entity_refund_due 	numeric(14,2)
	declare @entity_refund_paid	numeric(14,2)
	declare @base_tax_pd		numeric(14,2)
	declare @disc_pd		numeric(14,2)
	declare @penalty_pd		numeric(14,2)
	declare @interest_pd		numeric(14,2)
	declare @att_fee_pd		numeric(14,2)

	--Revised input parameters -EricZ 02/03/2003
	exec PrepRefundDue '', @input_str_date,  @input_user_id, @entity_id, 0

	select @entity_refund_due = 0

	if exists (select * from report_refund_due
		where entity_id = @entity_id
		and     pacs_user_id = @input_user_id)
	begin
		select @entity_refund_due = sum(mno_amt + ins_amt + penalty_amt + interest_amt + atty_fee_amt)
		from report_refund_due
		where entity_id = @entity_id
		and    pacs_user_id = @input_user_id
	end

	select @entity_refund_paid = sum(refund_trans.refund_m_n_o_pd +
				 refund_trans.refund_i_n_s_pd + 
  				 refund_trans.refund_pen_m_n_o_pd  +
				 refund_trans.refund_pen_i_n_s_pd  + 
				 refund_trans.refund_int_m_n_o_pd +
 				 refund_trans.refund_int_i_n_s_pd +
				 refund_trans.refund_atty_fee_pd ),
	      @base_tax_pd = sum(refund_trans.refund_m_n_o_pd + refund_trans.refund_i_n_s_pd),
	      @disc_pd     = sum(refund_trans.refund_disc_mno_pd + refund_trans.refund_disc_ins_pd),
	      @penalty_pd  = sum(refund_trans.refund_pen_m_n_o_pd + refund_trans.refund_pen_i_n_s_pd),
	      @interest_pd = sum(refund_trans.refund_int_m_n_o_pd + refund_trans.refund_int_i_n_s_pd),
	      @att_fee_pd  = sum(refund_trans.refund_atty_fee_pd)
	from refund, bill, batch, refund_trans
	where refund.refund_id = refund_trans.refund_id
	and    refund.batch_id = batch.batch_id
	and    refund_trans.bill_id = bill.bill_id
	and    bill.entity_id = @entity_id
	and    batch.balance_dt < @adj_end_date

	if (@entity_refund_due is null)
	begin
		select @entity_refund_due = 0
	end

	if (@entity_refund_paid is null)
	begin
		select @entity_refund_paid = 0
	end

	insert into year_to_date_recap_refund
	(
	pacs_user_id,
	entity_id,
	refund_paid,
	refund_due,
	base_tax_pd,
	disc_pd,
	penalty_pd,
	interest_pd,
	att_fee_pd
	)
	values
	(
	@input_user_id,
 	@entity_id,
  	@entity_refund_paid,
  	@entity_refund_due,
	@base_tax_pd,
	@disc_pd,
	@penalty_pd,
	@interest_pd,
	@att_fee_pd
	)

	FETCH NEXT FROM year_to_date_recap_cursor into @entity_id
end

close year_to_date_recap_cursor
deallocate year_to_date_recap_cursor

GO

