




CREATE procedure PrepFiscalReport

@fiscal_year		varchar(10),
@fiscal_month		int,
@fiscal_entity_id	int,
@actual_month 		int,
@actual_year		numeric(4),
@input_begin_string 	varchar(100),
@input_end_string   	varchar(100),
@input_user_id		int

as

declare @input_begin_date	datetime
declare @input_end_date 	datetime
declare @begin_fiscal_date	datetime

declare @m_adjustments		numeric(14,2)
declare @m_new_tax		numeric(14,2)
declare @m_prev_tax		numeric(14,2)
declare @m_tax_pd		numeric(14,2)
declare @m_disc_pd		numeric(14,2)
declare @m_penalty_pd		numeric(14,2)
declare @m_interest_pd		numeric(14,2)
declare @m_att_fee_pd		numeric(14,2)
declare @m_overage_pd		numeric(14,2)
declare @m_refund_due		numeric(14,2)
declare @m_refund_pd		numeric(14,2)
declare @m_underage_pd		numeric(14,2)

declare @y_orig_tax		numeric(14,2)
declare @y_adj_tax		numeric(14,2)
declare @y_new_tax		numeric(14,2)
declare @y_prev_tax		numeric(14,2)
declare @y_tax_pd		numeric(14,2)
declare @y_disc_pd		numeric(14,2)
declare @y_penalty_pd		numeric(14,2)
declare @y_interest_pd		numeric(14,2)
declare @y_att_fee_pd		numeric(14,2)
declare @y_overage_pd		numeric(14,2)
declare @y_underage_pd		numeric(14,2)
declare @y_refund_due		numeric(14,2)
declare @y_refund_pd		numeric(14,2)
declare @y_pct_collected	numeric(7,4)

declare @recap_yr		numeric(14,2)


select @input_end_string = @input_end_string + ' 23:59:59 '


select @input_begin_date = convert(datetime, @input_begin_string)
select @input_end_date    = convert(datetime, @input_end_string)

select @begin_fiscal_date = fiscal_begin_date
from    entity
where entity_id = @fiscal_entity_id


update payment_trans
set fiscal_year      = null,
    fiscal_month     = null,
    fiscal_entity_id = null
where fiscal_year      = @fiscal_year
and    fiscal_month     >= @fiscal_month
and    fiscal_entity_id = @fiscal_entity_id

update refund_trans
set fiscal_year      = null,
    fiscal_month     = null,
    fiscal_entity_id = null
where fiscal_year      = @fiscal_year
and    fiscal_month    >= @fiscal_month
and    fiscal_entity_id = @fiscal_entity_id


update payment_trans
set fiscal_year      = @fiscal_year,
    fiscal_month     = @fiscal_month,
    fiscal_entity_id = @fiscal_entity_id
from payment, batch, bill
where payment.payment_id = payment_trans.payment_id
and   payment_trans.bill_id = bill.bill_id
and   payment.batch_id = batch.batch_id
and   batch.balance_dt >= @input_begin_date
and   batch.balance_dt <= @input_end_date
and   bill.entity_id = @fiscal_entity_id


update refund_trans
set fiscal_year      = @fiscal_year,
    fiscal_month     = @fiscal_month,
    fiscal_entity_id = @fiscal_entity_id
from refund, batch, bill
where refund.refund_id = refund_trans.refund_id
and   refund_trans.bill_id = bill.bill_id
and   refund.batch_id = batch.batch_id
and   batch.balance_dt >= @input_begin_date
and   batch.balance_dt <= @input_end_date
and   bill.entity_id = @fiscal_entity_id



if exists (select * from sysobjects where id = object_id(N'[dbo].[fiscal_payment_trans]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
drop table [dbo].[fiscal_payment_trans]


if exists (select * from sysobjects where id = object_id(N'[dbo].[fiscal_refund_trans]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
drop table [dbo].[fiscal_refund_trans]


select * into [dbo].[fiscal_payment_trans]
from  payment_trans
where fiscal_year      = @fiscal_year
and   fiscal_entity_id = @fiscal_entity_id


select * into [dbo].[fiscal_refund_trans]
from  refund_trans
where fiscal_year      = @fiscal_year
and   fiscal_entity_id = @fiscal_entity_id


/************************************/
/******* temporary ******************/
/************************************/
--delete from fiscal_year_to_date_recap where pacs_user_id = @input_user_id
--delete from fiscal_month_to_date_recap where  pacs_user_id = @input_user_id


/********************************************************************************/
/******************************* process fiscal mtd *****************************/
/********************************************************************************/
insert into fiscal_month_to_date_recap
(recap_yr,
 pacs_user_id,
 entity_id)
select distinct sup_tax_yr, @input_user_id, @fiscal_entity_id
       from bill
       where entity_id = @fiscal_entity_id

insert into fiscal_year_to_date_recap
(recap_yr,
 pacs_user_id,
 entity_id)
select distinct sup_tax_yr, @input_user_id, @fiscal_entity_id
       from bill
       where entity_id = @fiscal_entity_id



DECLARE fiscal_year_to_date_recap_cursor SCROLL CURSOR
FOR select recap_yr
    from  fiscal_year_to_date_recap
    where pacs_user_id = @input_user_id
    and   entity_id    = @fiscal_entity_id 
    order by recap_yr
	
OPEN fiscal_year_to_date_recap_cursor
FETCH NEXT FROM fiscal_year_to_date_recap_cursor into @recap_yr


while (@@FETCH_STATUS = 0)
begin

	/*******************************************************************/
	/************************* process monthly *************************/
	/*******************************************************************/
	
	/* select any new bills that  were created */

	select @m_adjustments = IsNull(sum((curr_mno_tax + curr_ins_tax) - (prev_mno_tax + prev_ins_tax)), 0)
	from bill_adj_trans, bill
	where bill_adj_trans.bill_id = bill.bill_id
	and   bill_adj_trans.modify_dt >= @input_begin_date
             and   bill_adj_trans.modify_dt <= @input_end_date
	and bill.entity_id = @fiscal_entity_id
	and   bill.sup_tax_yr = @recap_yr
	
		  	 	
	select @m_tax_pd      = IsNull(sum(fiscal_payment_trans.mno_amt + fiscal_payment_trans.ins_amt), 0),
	       @m_disc_pd     = IsNull(sum(fiscal_payment_trans.discount_mno_amt + fiscal_payment_trans.discount_ins_amt), 0),
	       @m_penalty_pd  = IsNull(sum(fiscal_payment_trans.penalty_mno_amt + fiscal_payment_trans.penalty_ins_amt), 0),
	       @m_interest_pd = IsNull(sum(fiscal_payment_trans.interest_mno_amt + fiscal_payment_trans.interest_ins_amt), 0),
	       @m_att_fee_pd  = IsNull(sum(fiscal_payment_trans.attorney_fee_amt), 0),
	       @m_overage_pd  = IsNull(sum(fiscal_payment_trans.overage_mno_amt + fiscal_payment_trans.overage_ins_amt), 0),
	       @m_underage_pd = IsNull(sum(fiscal_payment_trans.underage_mno_amt + fiscal_payment_trans.underage_ins_amt), 0)
	from  fiscal_payment_trans, bill
	where fiscal_payment_trans.bill_id = bill.bill_id
	and   bill.sup_tax_yr  = @recap_yr
	and   bill.entity_id   = @fiscal_entity_id
	and   fiscal_year      = @fiscal_year
    	and   fiscal_month     = @fiscal_month
    	and   fiscal_entity_id = @fiscal_entity_id

	select @m_refund_pd = 0

	select  @m_refund_pd = IsNull(sum( fiscal_refund_trans.refund_m_n_o_pd  + fiscal_refund_trans.refund_i_n_s_pd + fiscal_refund_trans.refund_pen_m_n_o_pd  + fiscal_refund_trans.refund_pen_i_n_s_pd + fiscal_refund_trans.refund_int_m_n_o_pd + fiscal_refund_trans.refund_int_i_n_s_pd + fiscal_refund_trans.refund_atty_fee_pd ), 0)
	from  fiscal_refund_trans, bill
	where fiscal_refund_trans.bill_id = bill.bill_id
	and   bill.sup_tax_yr  = @recap_yr
	and   bill.entity_id   = @fiscal_entity_id
	and   fiscal_year      = @fiscal_year
    	and   fiscal_month     = @fiscal_month
    	and   fiscal_entity_id = @fiscal_entity_id 

	update fiscal_month_to_date_recap
	set 	adjustments   = @m_adjustments,
		tax_pd      = @m_tax_pd,
	    	disc_pd     = @m_disc_pd,
		penalty_pd  = @m_penalty_pd,
		interest_pd = @m_interest_pd,
		att_fee_pd  = @m_att_fee_pd,
		overage_pd  = @m_overage_pd,
		underage_pd = @m_underage_pd,
		refund_due    = @m_refund_due
-- Welch - Commented out b/c this column does not exist
--		refund_pd      = @m_refund_pd
	where pacs_user_id = @input_user_id
	and   recap_yr     = @recap_yr
	and   entity_id    = @fiscal_entity_id

	/*******************************************************************/
	/************************* process yearly *************************/
	/*******************************************************************/
	select @y_orig_tax = IsNull(sum(beg_mno + beg_ins), 0)
	from fiscal_year_totals
	where   entity_id  = @fiscal_entity_id
	and   tax_year = @recap_yr
	and   fiscal_year = @fiscal_year

	select @y_adj_tax = IsNull(sum((curr_mno_tax + curr_ins_tax) - (prev_mno_tax + prev_ins_tax)), 0)
	from bill_adj_trans, bill
	where bill_adj_trans.bill_id = bill.bill_id
	and   bill_adj_trans.modify_dt >= @begin_fiscal_date
	and   bill_adj_trans.modify_dt <=  @input_end_date
	and   bill.entity_id = @fiscal_entity_id
	and   bill.sup_tax_yr = @recap_yr
	
	select @y_adj_tax = @y_orig_tax + @y_adj_tax



	select @y_tax_pd      = IsNull(sum(fiscal_payment_trans.mno_amt + fiscal_payment_trans.ins_amt), 0),
	       @y_disc_pd     = IsNull(sum(fiscal_payment_trans.discount_mno_amt + fiscal_payment_trans.discount_ins_amt), 0),
	       @y_penalty_pd  = IsNull(sum(fiscal_payment_trans.penalty_mno_amt + fiscal_payment_trans.penalty_ins_amt), 0),
	       @y_interest_pd = IsNull(sum(fiscal_payment_trans.interest_mno_amt + fiscal_payment_trans.interest_ins_amt), 0),
	       @y_att_fee_pd  = IsNull(sum(fiscal_payment_trans.attorney_fee_amt), 0),
	       @y_overage_pd  = IsNull(sum(fiscal_payment_trans.overage_mno_amt + fiscal_payment_trans.overage_ins_amt), 0),
  	       @y_refund_due   =  0,
	       @y_underage_pd = IsNull(sum(fiscal_payment_trans.underage_mno_amt  + fiscal_payment_trans.underage_ins_amt), 0)
	from  fiscal_payment_trans, bill
	where fiscal_payment_trans.bill_id = bill.bill_id
	and   bill.sup_tax_yr  = @recap_yr
	and   bill.entity_id   = @fiscal_entity_id
	and   fiscal_year      = @fiscal_year
    	and   fiscal_entity_id = @fiscal_entity_id

	select  @y_refund_pd = IsNull(sum(fiscal_refund_trans.refund_m_n_o_pd  + fiscal_refund_trans.refund_i_n_s_pd + fiscal_refund_trans.refund_pen_m_n_o_pd  + fiscal_refund_trans.refund_pen_i_n_s_pd + fiscal_refund_trans.refund_int_m_n_o_pd + fiscal_refund_trans.refund_int_i_n_s_pd + fiscal_refund_trans.refund_atty_fee_pd), 0)
	from  fiscal_refund_trans, bill
	where fiscal_refund_trans.bill_id = bill.bill_id
	and   bill.sup_tax_yr  = @recap_yr
	and   bill.entity_id      = @fiscal_entity_id
	and   fiscal_year       = @fiscal_year
    	and   fiscal_entity_id = @fiscal_entity_id 

	if (@y_adj_tax <> 0)
	begin
		select @y_pct_collected =   (@y_tax_pd/@y_adj_tax) 
	end
	else
	begin
		select @y_pct_collected = 0
	end

	update fiscal_year_to_date_recap
	set 	orig_tax    = @y_orig_tax,
		adj_tax	    = @y_adj_tax,
		tax_pd      = @y_tax_pd,
	    	disc_pd     = @y_disc_pd,
		penalty_pd  = @y_penalty_pd,
		interest_pd = @y_interest_pd,
		att_fee_pd  = @y_att_fee_pd,
		overage_pd  = @y_overage_pd,
		underage_pd = @y_underage_pd,
		refund_due    = @y_refund_due,
-- Welch - Commented out b/c this column does not exist
--		refund_pd   = @y_refund_pd,
		pct_collected = @y_pct_collected
	where pacs_user_id = @input_user_id
	and   recap_yr     = @recap_yr
	and   entity_id	   = @fiscal_entity_id

	/* OLD	
	update fiscal_year_to_date_recap
	set num_owe = (select count(bill_id)
	          	from bill
	          	where new_bill_id    = 0
		and   entity_id      = @fiscal_entity_id
	          	and   sup_tax_yr     = @recap_yr
		and   (coll_status_cd = 'N' 
		or       coll_status_cd = 'PP'))
	where pacs_user_id = @input_user_id
	and   entity_id    = @fiscal_entity_id
	and   recap_yr	   = @recap_yr 
	*/

	--NEW version, refer to HelpSTAR #7254
	update fiscal_year_to_date_recap
	set num_owe = (select count(bill_id)
	from bill with (nolock)
	where bill.active_bill = 'T'
	and bill.coll_status_cd <> 'RS'
	and bill.entity_id = @fiscal_entity_id
	and bill.sup_tax_yr = @recap_yr
	and ((bill.bill_adj_m_n_o + bill.bill_adj_i_n_s) - 
	((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + bill.discount_mno_pd + bill.discount_ins_pd + bill.underage_mno_pd +  bill.underage_ins_pd) - 
	(bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd)) > 0))
	where pacs_user_id = @input_user_id
	and   entity_id    = @fiscal_entity_id
	and   recap_yr	   = @recap_yr 	


	FETCH NEXT FROM fiscal_year_to_date_recap_cursor into @recap_yr

end

close fiscal_year_to_date_recap_cursor
deallocate fiscal_year_to_date_recap_cursor

drop table fiscal_payment_trans
drop table fiscal_refund_trans

GO

