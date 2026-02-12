







CREATE   procedure PrepMonthtoDateRecap

@input_user_id   int,
@input_entity_id int,
@input_begin_string varchar(100),
@input_end_string   varchar(100)

as

declare @input_begin_date	datetime
declare @input_end_date 	datetime
declare @recap_yr		numeric(4)
declare @sum_refund_amt		numeric(14,2)

declare @adj_tax		numeric(14,2)
declare @tax_pd			numeric(14,2)
declare @disc_pd		numeric(14,2)
declare @penalty_pd		numeric(14,2)
declare @interest_pd		numeric(14,2)
declare @att_fee_pd		numeric(14,2)
declare @overage_pd		numeric(14,2)
declare @underage_pd		numeric(14,2)
declare @adj_end_date		datetime

declare @ref_pd			numeric(14,2)
declare @ref_tax_pd		numeric(14,2)
declare @ref_disc_pd		numeric(14,2)
declare @ref_penalty_pd		numeric(14,2)
declare @ref_interest_pd	numeric(14,2)
declare @ref_att_fee_pd		numeric(14,2)

declare @ref_total_pd		numeric(14,2)
declare @ref_total_tax_pd	numeric(14,2)
declare @ref_total_disc_pd	numeric(14,2)
declare @ref_total_penalty_pd	numeric(14,2)
declare @ref_total_interest_pd	numeric(14,2)
declare @ref_total_att_fee_pd	numeric(14,2)


select @input_begin_date = convert(datetime, @input_begin_string)
select @input_end_date    = convert(datetime, @input_end_string)

select @adj_end_date = dateadd(dd, 1, @input_end_date)

delete from month_to_date_recap
where pacs_user_id = @input_user_id
and   entity_id    = @input_entity_id

delete from month_to_date_recap_date_range
where pacs_user_id = @input_user_id
and   entity_id    = @input_entity_id

delete from month_to_date_recap_refund
where pacs_user_id = @input_user_id
and   entity_id    = @input_entity_id

insert into month_to_date_recap_date_range
values
(@input_user_id,
 @input_entity_id,
 @input_begin_date,
 @input_end_date
)

/*
insert into month_to_date_recap
(recap_yr,
 pacs_user_id,
 entity_id)
select distinct sup_tax_yr, @input_user_id, @input_entity_id
       from bill
       where entity_id = @input_entity_id

DECLARE month_to_date_recap_cursor SCROLL CURSOR
FOR select recap_yr
    from  month_to_date_recap
    where pacs_user_id = @input_user_id
    and   entity_id    = @input_entity_id  */

set @ref_total_pd		= 0
set @ref_total_tax_pd		= 0
set @ref_total_disc_pd		= 0
set @ref_total_penalty_pd	= 0
set @ref_total_interest_pd	= 0
set @ref_total_att_fee_pd	= 0


DECLARE month_to_date_recap_cursor SCROLL CURSOR
FOR select distinct sup_tax_yr
    from bill
    where  entity_id    = @input_entity_id


OPEN month_to_date_recap_cursor
FETCH NEXT FROM month_to_date_recap_cursor into @recap_yr


while (@@FETCH_STATUS = 0)
begin

	set @adj_tax		= 0
	set @tax_pd		= 0	
	set @disc_pd		= 0
	set @penalty_pd		= 0
	set @interest_pd	= 0	
	set @att_fee_pd		= 0
	set @overage_pd		= 0
	set @underage_pd	= 0	
	set @ref_pd		= 0
	set @ref_tax_pd		= 0
	set @ref_disc_pd	= 0	
	set @ref_penalty_pd	= 0	
	set @ref_interest_pd	= 0
	set @ref_att_fee_pd	= 0	

	select @adj_tax = IsNull(sum((curr_mno_tax + curr_ins_tax) - (prev_mno_tax + prev_ins_tax)), 0)
	from bill_adj_trans with (nolock), bill  with (nolock)
	where bill_adj_trans.bill_id = bill.bill_id
	and   bill_adj_trans.modify_dt >= @input_begin_date
	and   bill_adj_trans.modify_dt < @adj_end_date
	and   bill.sup_tax_yr = @recap_yr
	and   bill.entity_id = @input_entity_id
	
	select 	@tax_pd      = IsNull(sum(payment_trans.mno_amt + payment_trans.ins_amt), 0),	
		@disc_pd     = IsNull(sum(payment_trans.discount_mno_amt + payment_trans.discount_ins_amt), 0),
		@penalty_pd  = IsNull(sum(payment_trans.penalty_mno_amt + payment_trans.penalty_ins_amt), 0),
		@interest_pd = IsNull(sum(payment_trans.interest_mno_amt + payment_trans.interest_ins_amt), 0),
		@att_fee_pd  = IsNull(sum(payment_trans.attorney_fee_amt), 0),
		@overage_pd  = IsNull(sum(payment_trans.overage_mno_amt + payment_trans.overage_ins_amt), 0),
		@underage_pd = IsNull(sum(payment_trans.underage_mno_amt + payment_trans.underage_ins_amt), 0)
	from payment_trans  with (nolock), bill  with (nolock), payment  with (nolock), batch  with (nolock)
 	where payment_trans.bill_id = bill.bill_id
	and   bill.entity_id        = @input_entity_id
	and   bill.sup_tax_yr       = @recap_yr
	and   payment_trans.payment_id = payment.payment_id
	and   payment.batch_id   = batch.batch_id
	and   batch.balance_dt >= @input_begin_date
	and   batch.balance_dt <   @adj_end_date
	--and   bill.coll_status_cd <> 'RS'


	select   @ref_pd          = IsNull(sum((refund_trans.refund_m_n_o_pd +
			 		refund_trans.refund_i_n_s_pd + 
				 	refund_trans.refund_pen_m_n_o_pd  +
			 		refund_trans.refund_pen_i_n_s_pd  + 
			 		refund_trans.refund_int_m_n_o_pd +
				 	refund_trans.refund_int_i_n_s_pd +
			 		refund_trans.refund_atty_fee_pd )), 0),
		@ref_tax_pd	 = IsNull(sum(IsNull(refund_trans.refund_m_n_o_pd, 0)     + IsNull(refund_trans.refund_i_n_s_pd, 0)), 0),	
		@ref_disc_pd	 = IsNull(sum(IsNull(refund_trans.refund_disc_mno_pd, 0)  + IsNull(refund_trans.refund_disc_ins_pd, 0)), 0),	
		@ref_penalty_pd	 = IsNull(sum(IsNull(refund_trans.refund_pen_m_n_o_pd, 0) + IsNull(refund_trans.refund_pen_i_n_s_pd, 0)), 0),	
		@ref_interest_pd = IsNull(sum(IsNull(refund_trans.refund_int_m_n_o_pd, 0) + IsNull(refund_trans.refund_int_i_n_s_pd, 0)), 0)	,
		@ref_att_fee_pd	 = IsNull(sum(IsNull(refund_trans.refund_atty_fee_pd, 0)), 0)	
			
	from refund  with (nolock), bill  with (nolock), batch  with (nolock), refund_trans  with (nolock)
	where refund.refund_id = refund_trans.refund_id
	and    refund.batch_id = batch.batch_id
	and    refund_trans.bill_id = bill.bill_id
	and    bill.entity_id = @input_entity_id
	and    bill.sup_tax_yr = @recap_yr
	and    batch.balance_dt >= @input_begin_date
	and    batch.balance_dt <  @adj_end_date

	set @ref_total_pd		= @ref_total_pd          + @ref_pd
	set @ref_total_tax_pd		= @ref_total_tax_pd      + @ref_tax_pd
	set @ref_total_disc_pd		= @ref_total_disc_pd     + @ref_disc_pd
	set @ref_total_penalty_pd	= @ref_total_penalty_pd  + @ref_penalty_pd
	set @ref_total_interest_pd	= @ref_total_interest_pd + @ref_interest_pd
	set @ref_total_att_fee_pd	= @ref_total_att_fee_pd  + @ref_att_fee_pd


	set @tax_pd      = IsNull(@tax_pd, 0) - IsNull(@ref_tax_pd, 0)
	set @disc_pd     = IsNull(@disc_pd, 0) - IsNull(@ref_disc_pd, 0)
	set @penalty_pd  = IsNull(@penalty_pd, 0) - IsNull(@ref_penalty_pd, 0)
	set @interest_pd = IsNull(@interest_pd, 0) - IsNull(@ref_interest_pd, 0)
	set @att_fee_pd  = IsNull(@att_fee_pd, 0)  - IsNull(@ref_att_fee_pd, 0)

	insert into month_to_date_recap
	(
	recap_yr,
 	pacs_user_id,
 	entity_id,
	adjustments,
	tax_pd,
	disc_pd,
	penalty_pd,
	interest_pd,
	att_fee_pd,
	overage_pd,
	underage_pd
	)
	values
	(
	@recap_yr,
	@input_user_id,
	@input_entity_id,
	@adj_tax,
	@tax_pd,
	@disc_pd,
	@penalty_pd,
	@interest_pd,
	@att_fee_pd,
	@overage_pd,
	@underage_pd
	)

	FETCH NEXT FROM month_to_date_recap_cursor into @recap_yr

end

close month_to_date_recap_cursor
deallocate month_to_date_recap_cursor

/* calculate refunds due and refunds paid */

insert into month_to_date_recap_refund
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
@input_entity_id,
@ref_total_pd,
0,
@ref_total_tax_pd,
@ref_total_disc_pd,
@ref_total_penalty_pd,
@ref_total_interest_pd,
@ref_total_att_fee_pd
)

GO

