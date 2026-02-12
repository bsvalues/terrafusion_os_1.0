
CREATE procedure MonthlyAsOfRecapReport

@input_user_id		int

as

declare @begin_date		datetime
declare @end_date 		datetime
declare @begin_fiscal_date	datetime
declare @fiscal_year		varchar(10)
declare @entity_id		int

/*
	Welch - 2004 07 15
	Nothing anywhere is actually using the monthly_as_of_recap table
	except to delete from it, so I've dropped it

	(The below inserts into it have been commented out since forever)
*/

--delete from monthly_as_of_recap where pacs_user_id = @input_user_id

DECLARE  monthly_as_of_recap_params_cursor CURSOR FAST_FORWARD
FOR select 	entity_id  , 
		begin_date,                  
		end_date,                    
		fiscal_end_date,             
		fiscal_year 
       from monthly_as_of_recap_params
       where pacs_user_id = @input_user_id

open monthly_as_of_recap_params_cursor
fetch next from monthly_as_of_recap_params_cursor into @entity_id, @begin_date, @end_date, @begin_fiscal_date, @fiscal_year

while (@@FETCH_STATUS = 0)
begin

/* add and extra day and adjust the query to make sure we pick up all transaction that
   occurred on the last date of the range */
select @end_date = dateadd(dd, 1, @end_date)

-- Welch - Commented out because many of the below columns are invalid
/*
insert into monthly_as_of_recap
(
pacs_user_id, 
entity_id,   
sup_yr, 
begin_date,                  
end_date,                    
mno_collectable,  
ins_collectable, 
mno_adjustment,   
ins_adjustment,  
total_adjustment, 
mno_collected,    
ins_collected,    
total_collected,
mno_pi,           
ins_pi ,        
total_pi,  
mno_discount,     
ins_discount,
total_discount,
mno_collected_ytd,
ins_collected_ytd,
total_collected_ytd,
mno_underage,
ins_underage,
total_underage       
)
select 	@input_user_id,
       	@entity_id,
	tax_year,
       	@begin_date,
	@end_date,
	
	beg_mno

	 + (IsNull((select sum((curr_mno_tax) - (prev_mno_tax))
		from bill_adj_trans
		where bill_adj_trans.entity_id = fiscal_year_totals.entity_id
		and   bill_adj_trans.sup_tax_yr = fiscal_year_totals.tax_year
		and   bill_adj_trans.modify_dt >= @begin_fiscal_date 
		and   bill_adj_trans.modify_dt <  @begin_date), 0) +
		-  IsNull( (SELECT  SUM(payment_trans.mno_amt + payment_trans.discount_mno_amt + payment_trans.underage_mno_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_fiscal_date  
		and   batch.balance_dt <  @begin_date) , 0)),
	
	beg_ins
        + IsNull((select sum((curr_ins_tax) - (prev_ins_tax))
		from bill_adj_trans
		where bill_adj_trans.entity_id = fiscal_year_totals.entity_id
		and   bill_adj_trans.sup_tax_yr = fiscal_year_totals.tax_year
		and   bill_adj_trans.modify_dt >= @begin_fiscal_date 
		and   bill_adj_trans.modify_dt <  @begin_date), 0) +
		-  IsNull( (SELECT  SUM(payment_trans.ins_amt + payment_trans.discount_ins_amt + payment_trans.underage_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_fiscal_date  
		and   batch.balance_dt <  @begin_date) , 0),

	IsNull((select sum((curr_mno_tax) - (prev_mno_tax))
		from bill_adj_trans
		where bill_adj_trans.entity_id = fiscal_year_totals.entity_id
		and   bill_adj_trans.sup_tax_yr = fiscal_year_totals.tax_year
		and   bill_adj_trans.modify_dt >= @begin_date 
		and   bill_adj_trans.modify_dt <  @end_date), 0),
	IsNull((select sum((curr_ins_tax) - (prev_ins_tax))
		from bill_adj_trans
		where bill_adj_trans.entity_id = fiscal_year_totals.entity_id
		and   bill_adj_trans.sup_tax_yr = fiscal_year_totals.tax_year
		and   bill_adj_trans.modify_dt >= @begin_date  
		and   bill_adj_trans.modify_dt <  @end_date), 0),
	IsNull((select sum((curr_mno_tax + curr_ins_tax) - (prev_mno_tax + prev_ins_tax))
		from bill_adj_trans
		where bill_adj_trans.entity_id = fiscal_year_totals.entity_id
		and   bill_adj_trans.sup_tax_yr = fiscal_year_totals.tax_year
		and   bill_adj_trans.modify_dt >= @begin_date  
		and   bill_adj_trans.modify_dt <  @end_date), 0),
	IsNull( (SELECT  SUM(payment_trans.mno_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.mno_amt + payment_trans.ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.penalty_mno_amt + payment_trans.interest_mno_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.penalty_ins_amt + payment_trans.interest_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.penalty_mno_amt + payment_trans.interest_mno_amt + 
			     payment_trans.penalty_ins_amt + payment_trans.interest_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.discount_mno_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.discount_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.discount_mno_amt + payment_trans.discount_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.mno_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_fiscal_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_fiscal_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.mno_amt + payment_trans.ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_fiscal_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.underage_mno_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.underage_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0),
	IsNull( (SELECT  SUM(payment_trans.underage_mno_amt + payment_trans.underage_ins_amt)                   
       		from payment_trans, payment, batch, bill
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id = bill.bill_id
		and   bill.entity_id = fiscal_year_totals.entity_id
		and   bill.sup_tax_yr = fiscal_year_totals.tax_year
		and   batch.balance_dt >= @begin_date  
		and   batch.balance_dt <  @end_date) , 0)
from fiscal_year_totals, entity
where fiscal_year_totals.entity_id = entity.entity_id
and fiscal_year_totals.fiscal_year = entity.fiscal_year
and fiscal_year_totals.entity_id = @entity_id
*/

--Add the overage amounts to the discount buckets -EricZ 01/31/2003

-- Welch - Commented out because many of the below columns are invalid
/*
update monthly_as_of_recap
set mno_discount   = mno_discount + mno_underage,
    ins_discount   = ins_discount + ins_underage,
    total_discount = total_discount + total_underage
where pacs_user_id = @input_user_id
and   entity_id    = @entity_id
*/

-- Welch - Commented out because many of the below columns are invalid
/*
update monthly_as_of_recap 
set total_collectable = mno_collectable + ins_collectable,
    mno_adj_roll      = mno_collectable + mno_adjustment,
    ins_adj_roll      = ins_collectable + ins_adjustment,
    total_adj_roll    = (mno_collectable + mno_adjustment) + (ins_collectable + ins_adjustment),
    mno_balance       = (mno_collectable + mno_adjustment) - (mno_collected + mno_discount + mno_underage),
    ins_balance       = (ins_collectable + ins_adjustment) - (ins_collected  + ins_discount + ins_underage),
    total_balance     = ((mno_collectable + mno_adjustment) - (mno_collected + mno_discount + mno_underage)) + ((ins_collectable + ins_adjustment) - (ins_collected  + ins_discount + ins_underage))
where pacs_user_id = @input_user_id
and   entity_id    = @entity_id
*/

--Have to modify this section since the discount buckets also include the underage buckets -EricZ 01/31/2003

-- Welch - Commented out because many of the below columns are invalid
/*
update monthly_as_of_recap 
set total_collectable = mno_collectable + ins_collectable,
    mno_adj_roll      = mno_collectable + mno_adjustment,
    ins_adj_roll      = ins_collectable + ins_adjustment,
    total_adj_roll    = (mno_collectable + mno_adjustment) + (ins_collectable + ins_adjustment),
    mno_balance       = (mno_collectable + mno_adjustment) - (mno_collected + mno_discount),
    ins_balance       = (ins_collectable + ins_adjustment) - (ins_collected  + ins_discount),
    total_balance     = ((mno_collectable + mno_adjustment) - (mno_collected + mno_discount)) + ((ins_collectable + ins_adjustment) - (ins_collected  + ins_discount))
where pacs_user_id = @input_user_id
and   entity_id    = @entity_id
*/

fetch next from monthly_as_of_recap_params_cursor into @entity_id, @begin_date, @end_date, @begin_fiscal_date, @fiscal_year
end

close monthly_as_of_recap_params_cursor
deallocate monthly_as_of_recap_params_cursor

GO

