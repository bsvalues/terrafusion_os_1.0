

CREATE    procedure PrepareDelqRollTest

@input_user_id		  int,
@input_effective_date     varchar(100),
@input_totals_only	  char(1),
@input_use_geo_id	  char(1) = 'F'
as

declare @bill_id    		int
declare @prop_id       		int
declare @sup_tax_yr      	numeric(4)
declare @bill_m_n_o          	numeric(14,2)
declare @bill_i_n_s      	numeric(14,2)
declare @penalty_m_n_o       	numeric(14,2)
declare @penalty_i_n_s       	numeric(14,2)
declare @interest_m_n_o      	numeric(14,2)
declare @interest_i_n_s      	numeric(14,2)
declare @attorney_fees       	numeric(14,2)

declare @bill_adj_m_n_o		numeric(14,2)
declare @bill_adj_i_n_s		numeric(14,2)
declare @assessed_val		numeric(14,2)
declare @taxable_val		numeric(14,2)
declare @bill_effective_due_dt	datetime
declare @adjustment_code	varchar(10)

declare @bill_m_n_o_pd      	numeric(14,2)
declare @bill_i_n_s_pd       	numeric(14,2)
declare @penalty_m_n_o_pd    	numeric(14,2)
declare @penalty_i_n_s_pd    	numeric(14,2)
declare @interest_m_n_o_pd   	numeric(14,2)
declare @interest_i_n_s_pd   	numeric(14,2)
declare @attorney_fees_pd    	numeric(14,2)
declare @discount_mno_pd     	numeric(14,2)
declare @discount_ins_pd     	numeric(14,2)
declare @overage_mno_pd      	numeric(14,2)
declare @overage_ins_pd      	numeric(14,2)
declare @underage_mno_pd     	numeric(14,2)
declare @underage_ins_pd     	numeric(14,2)
declare @refund_m_n_o_pd	numeric(14,2)
declare @refund_i_n_s_pd	numeric(14,2)
declare @refund_disc_mno_pd	numeric(14,2)
declare @refund_disc_ins_pd	numeric(14,2)
declare @bill_tax_due        	numeric(14,2)
declare @refund_due      	numeric(14,2)
declare @property_tax_due      	numeric(14,2)
declare @property_attorney_fee 	numeric(14,2)
declare @delinquent_tax_due    	numeric(14,2)
declare @show_output      	int
declare @str_base_tax		varchar(100)
declare @str_penalty_mno     	varchar(100)
declare @str_penalty_ins     	varchar(100)
declare @str_interest_ins    	varchar(100)
declare @str_interest_mno    	varchar(100)
declare @str_attorney_fee    	varchar(100)
declare @str_total		varchar(100)
declare @penalty_mno      	numeric(14,2)
declare @penalty_ins      	numeric(14,2)
declare @interest_mno      	numeric(14,2)
declare @interest_ins      	numeric(14,2)
declare @attorney_fee        	numeric(14,2)
declare @output_str_current_tax_due    varchar(100)
declare @output_str_delinquent_tax_due varchar(100)
declare @output_str_attorney_fee_due   varchar(100)
declare @effective_date		       datetime
declare @str_effective_date	datetime
declare @entity_cd		char(5)
declare @stmnt_id		int
declare @count			int
declare @owner_id		int
declare @entity_id		int
declare @tax_due		numeric(14,2)
declare @disc_pi		numeric(14,2)
declare @att_fee		numeric(14,2)
declare @tax_due1		numeric(14,2)
declare @disc_pi1		numeric(14,2)
declare @att_fee1		numeric(14,2)
declare @tax_due2		numeric(14,2)
declare @disc_pi2		numeric(14,2)
declare @att_fee2		numeric(14,2)
declare @month 			int
declare @day  			int
declare @year 			int
declare @date_string    	varchar(100)
declare @month1			varchar(50)
declare @month2			varchar(50)
declare @month3			varchar(50)
declare @temp_month		int
declare @temp_year		int
declare @temp_day		int
declare @temp_date		varchar(100)
declare @prev_prop_id		int
declare @event_id		int
declare @event_str		varchar(100)
declare @delq_year		char(1)
declare @tax_year		numeric(4)
declare @last_payment_date	datetime
declare @last_payment_amt	numeric(14,2)
declare @prop_type_cd		char(5)
declare @adj_end_date		datetime



select @adj_end_date = dateadd(dd, 1, convert(datetime, @input_effective_date))

select @temp_day  = datepart(day,   convert(datetime, @input_effective_date))
select @temp_month = datepart(month, convert(datetime, @input_effective_date))
select @temp_year  = datepart(year,  convert(datetime, @input_effective_date))

select @temp_date = convert(varchar(2), @temp_month)+ '/' + convert(varchar(2),@temp_day) + '/' + convert(varchar(4), @temp_year)
select @month1    = datename(month, @temp_date) + ' ' + convert(varchar(4), @temp_year)

if (@temp_month = 12)
begin
	select @temp_year  = @temp_year + 1
	select @temp_month = 1
end
else
begin
	select @temp_month = @temp_month + 1
end

exec GetLastDayOfMonth @temp_month, @temp_year, @temp_day output

select @temp_date = convert(varchar(2), @temp_month)+ '/' + convert(varchar(2),@temp_day) + '/' + convert(varchar(4), @temp_year)
select @month2    = datename(month, @temp_date) + ' ' + convert(varchar(4), @temp_year)

if (@temp_month = 12)
begin
	select @temp_year  = @temp_year + 1
	select @temp_month = 1
end
else
begin
	select @temp_month = @temp_month + 1
end

 
exec GetLastDayOfMonth @temp_month, @temp_year, @temp_day output

select @temp_date = convert(varchar(2), @temp_month)+ '/' + convert(varchar(2),@temp_day) + '/' + convert(varchar(4), @temp_year)
select @month3    = datename(month, @temp_date) + ' ' + convert(varchar(4), @temp_year)

/* log these fields into the delq_notice_param tables.. These parameters will be
   used for crystal reports */
update delq_roll_params set month1 = @month1, 
			    month2 = @month2,
			    month3 = @month3,
			    effective_dt = convert(datetime, @input_effective_date)
where pacs_user_id = @input_user_id


/* initialize property tax due */
select @show_output = 0
select @prev_prop_id  = 0

select @delq_year = delq_year from delq_roll_params where pacs_user_id = @input_user_id

select @tax_year = tax_yr from pacs_system

--Build temp table delq_roll_bill and clear tables
if exists (select * from dbo.sysobjects where id = object_id(N'delq_roll_bill') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
drop table delq_roll_bill

select top 1 bill.* into delq_roll_bill from bill with (nolock)

delete from delq_roll_bill
delete from delq_roll where pacs_user_id = @input_user_id
delete from delq_roll_totals where pacs_user_id = @input_user_id

/* if all bills included on roll */
declare @strSQL varchar(4000)

set @strSQL = ''

set @strSQL = @strSQL + 'insert into delq_roll_bill select bill.*'
set @strSQL = @strSQL + ' from   bill with (nolock), property with (nolock)'
set @strSQL = @strSQL + ' where  bill.coll_status_cd <> ''RS'''
set @strSQL = @strSQL + ' and    bill.prop_id = property.prop_id'
set @strSQL = @strSQL + ' and    bill.entity_id        in (select entity_id from delq_roll_params_entity where pacs_user_id = ' +convert(varchar(15), @input_user_id) + ')'
set @strSQL = @strSQL + ' and    bill.entity_id 	     in (select entity_id from entity_collect_for_vw)'
set @strSQL = @strSQL + ' and    property.prop_type_cd in (select prop_type_cd from delq_roll_params_prop_type where pacs_user_id = ' + convert(varchar(15), @input_user_id) + ')'
set @strSQL = @strSQL + ' and    bill.adjustment_code  in (select bill_adjust_cd from delq_roll_params_adjust_cd where pacs_user_id = ' + convert(varchar(15), @input_user_id) + ')'

if (@input_use_geo_id = 'T')
begin
 	set @strSQL = @strSQL + ' and    property.geo_id in (select geo_id from delq_roll_params_geo_id where pacs_user_id = ' + convert(varchar(15), @input_user_id) + ')'
end

if (@delq_year = 'C')
begin
	set @strSQL = @strSQL + ' and    bill.sup_tax_yr = ' + convert(varchar(4), @tax_year)
end
else if (@delq_year = 'D')
begin
	set @strSQL = @strSQL + ' and    bill.sup_tax_yr < ' + convert(varchar(4), @tax_year)
end

exec (@strSQL)

--Create indexes on delq_roll_bill table for optimization
CREATE CLUSTERED INDEX IX_delq_roll_bill ON delq_roll_bill
(
	bill_id
) WITH FILLFACTOR = 90 ON [PRIMARY]

CREATE NONCLUSTERED INDEX IX_delq_roll_bill_1 ON delq_roll_bill
(
	prop_id
) WITH FILLFACTOR = 70 ON [PRIMARY]


/* back out any payments that might have happened after the effective due date */

if (@input_totals_only = 'T')
begin
	insert into delq_roll
	(
	pacs_user_id,
	bill_id,
	entity_id,
	sup_tax_yr,
	tax_due,
	disc_pi,
	att_fee,
	tax_due1,
	disc_pi1,
	att_fee1,
	tax_due2,
	disc_pi2,
	att_fee2,
	last_payment_date,
	last_payment_amt,
	prop_type_cd
	)
	select
	@input_user_id,
	bill_id,
	entity_id,
	sup_tax_yr,
	--Tax Due Calculation
	((bill_m_n_o + bill_i_n_s) +

		--Add modifications made before @adj_end_date (@input_effective_date + 1 day)
		IsNull((select sum((curr_mno_tax + curr_ins_tax)
		- (prev_mno_tax + prev_ins_tax))	
		from bill_adj_trans with (nolock)
		where bill_adj_trans.bill_id =delq_roll_bill.bill_id
		and   (bill_adj_trans.modify_dt < @adj_end_date
		or     bill_adj_trans.modify_dt is null) ), 0)) - 
		
		( (bill_m_n_o_pd + bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd + underage_ins_pd) -

/*
                ( --Subtract refunds paid after @input_effective_date
		IsNull((SELECT SUM(refund_trans.refund_m_n_o_pd + refund_trans.refund_i_n_s_pd
		+ refund_trans.refund_disc_mno_pd + refund_trans.refund_disc_ins_pd)
		from refund_trans, refund, batch
		where refund.refund_id = refund_trans.refund_id
		and refund.batch_id = batch.batch_id
		and refund_trans.bill_id =delq_roll_bill.bill_id
		and batch.balance_dt < @adj_end_date), 0)  )
*/

		--Subtract payments paid after @input_effective_date
		IsNull((SELECT SUM(payment_trans.mno_amt + payment_trans.ins_amt 
		+ payment_trans.discount_mno_amt + payment_trans.discount_ins_amt
		+ payment_trans.underage_mno_amt + payment_trans.underage_ins_amt)
		from payment_trans with (nolock), payment  with (nolock), batch  with (nolock)
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id   = batch.batch_id
		and   payment_trans.bill_id =delq_roll_bill.bill_id
		and   batch.balance_dt > @input_effective_date) , 0) ),
		
		

	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 
	property.prop_type_cd
	from delq_roll_bill, property  with (nolock)
    	where delq_roll_bill.prop_id = property.prop_id
end
else
begin


/* indicates that we are printing a roll, so we need to adjust the amount paids, curr tax for the appropriate date range */
update delq_roll_bill
set    bill_adj_m_n_o = bill_m_n_o + IsNull((select sum((curr_mno_tax) - (prev_mno_tax))
					         from bill_adj_trans  with (nolock)
					         where bill_adj_trans.bill_id =delq_roll_bill.bill_id
					         and   (bill_adj_trans.modify_dt < @adj_end_date
					         or     bill_adj_trans.modify_dt is null) ), 0),
       bill_adj_i_n_s = bill_i_n_s + IsNull((select sum((curr_ins_tax) - (prev_ins_tax))
					         from bill_adj_trans  with (nolock)
					         where bill_adj_trans.bill_id =delq_roll_bill.bill_id
					         and   (bill_adj_trans.modify_dt < @adj_end_date
					         or     bill_adj_trans.modify_dt is null) ), 0),
       bill_m_n_o_pd  = bill_m_n_o_pd - IsNull((SELECT  SUM(payment_trans.mno_amt)                   
       				          from payment_trans  with (nolock), payment  with (nolock), batch  with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id =delq_roll_bill.bill_id
					  and   batch.balance_dt > @input_effective_date) , 0),
       bill_i_n_s_pd  = bill_i_n_s_pd - IsNull((SELECT  SUM(payment_trans.ins_amt)                   
       				          from payment_trans  with (nolock), payment  with (nolock), batch  with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id =delq_roll_bill.bill_id
					  and   batch.balance_dt > @input_effective_date) , 0),
       discount_mno_pd = discount_mno_pd - IsNull((SELECT  SUM(payment_trans.discount_mno_amt)                   
       				         from payment_trans  with (nolock), payment  with (nolock), batch  with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id =delq_roll_bill.bill_id
					  and   batch.balance_dt > @input_effective_date) , 0),
       discount_ins_pd = discount_ins_pd - IsNull((SELECT  SUM(payment_trans.discount_ins_amt)                   
       				          from payment_trans  with (nolock), payment  with (nolock), batch  with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id =delq_roll_bill.bill_id
					  and   batch.balance_dt > @input_effective_date) , 0),
       underage_mno_pd = underage_mno_pd - IsNull((SELECT  SUM(payment_trans.underage_mno_amt)                   
       				          from payment_trans  with (nolock), payment  with (nolock), batch  with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id =delq_roll_bill.bill_id
					  and   batch.balance_dt > @input_effective_date) , 0),
       underage_ins_pd = underage_ins_pd - IsNull((SELECT  SUM(payment_trans.underage_ins_amt)                   
       				          from payment_trans  with (nolock), payment  with (nolock), batch  with (nolock)
					   where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id =delq_roll_bill.bill_id
					  and   batch.balance_dt > @input_effective_date) , 0),
       overage_mno_pd  = overage_mno_pd - IsNull((SELECT  SUM(payment_trans.overage_mno_amt)                   
       				          from payment_trans  with (nolock), payment  with (nolock), batch  with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id =delq_roll_bill.bill_id
					  and   batch.balance_dt > @input_effective_date) , 0),
       overage_ins_pd  = overage_ins_pd - IsNull((SELECT  SUM(payment_trans.overage_ins_amt)                   
       				         from payment_trans  with (nolock), payment  with (nolock), batch  with (nolock)
					  where payment.payment_id = payment_trans.payment_id
					  and   payment.batch_id   = batch.batch_id
					  and   payment_trans.bill_id =delq_roll_bill.bill_id
					  and   batch.balance_dt > @input_effective_date) , 0),
        refund_m_n_o_pd = IsNull((SELECT  SUM(refund_trans.refund_m_n_o_pd)                   
       				          from refund_trans with (nolock), refund  with (nolock), batch  with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id =delq_roll_bill.bill_id
					 and   batch.balance_dt < @adj_end_date) , 0),
        refund_i_n_s_pd = IsNull((SELECT  SUM(refund_trans.refund_i_n_s_pd)                   
       				          from refund_trans  with (nolock), refund  with (nolock), batch  with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id =delq_roll_bill.bill_id
					 and   batch.balance_dt< @adj_end_date) , 0),
        refund_disc_mno_pd = IsNull((SELECT  SUM(refund_trans.refund_disc_mno_pd)                   
       				          from refund_trans  with (nolock), refund  with (nolock), batch  with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id =delq_roll_bill.bill_id
					 and   batch.balance_dt< @adj_end_date) , 0),
        refund_disc_ins_pd =IsNull((SELECT  SUM(refund_trans.refund_disc_ins_pd)                   
       				          from refund_trans  with (nolock), refund  with (nolock), batch  with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id =delq_roll_bill.bill_id
					  and   batch.balance_dt< @adj_end_date) , 0),
        refund_pen_m_n_o_pd = IsNull((SELECT  SUM(refund_trans.refund_pen_m_n_o_pd)                   
       				          from refund_trans  with (nolock), refund with (nolock), batch  with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id =delq_roll_bill.bill_id
					  and   batch.balance_dt< @adj_end_date) , 0),
        refund_pen_i_n_s_pd = IsNull((SELECT SUM(refund_trans.refund_pen_i_n_s_pd)                   
       				          from refund_trans  with (nolock), refund  with (nolock), batch  with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id =delq_roll_bill.bill_id
					 and   batch.balance_dt< @adj_end_date) , 0),
        refund_int_m_n_o_pd = IsNull((SELECT  SUM(refund_trans.refund_int_m_n_o_pd)                   
       				          from refund_trans  with (nolock), refund  with (nolock), batch  with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id =delq_roll_bill.bill_id
					 and   batch.balance_dt< @adj_end_date) , 0),
        refund_int_i_n_s_pd = IsNull((SELECT  SUM(refund_trans.refund_int_i_n_s_pd)                   
       				          from refund_trans  with (nolock), refund  with (nolock), batch  with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id =delq_roll_bill.bill_id
					 and   batch.balance_dt< @adj_end_date) , 0),
        refund_atty_fee_pd = IsNull((SELECT  SUM(refund_trans.refund_atty_fee_pd)                   
       				          from refund_trans  with (nolock), refund  with (nolock), batch  with (nolock)
					  where refund.refund_id = refund_trans.refund_id
					  and   refund.batch_id   = batch.batch_id
					  and   refund_trans.bill_id =delq_roll_bill.bill_id
					  and   batch.balance_dt< @adj_end_date) , 0)


	
declare @payment_bill_id	int
declare @refund_bill_id		int
declare @sum_mno_amt           	numeric(14,2)
declare @sum_ins_amt           	numeric(14,2)
declare @sum_penalty_mno_amt  	numeric(14,2)
declare @sum_penalty_ins_amt  	numeric(14,2)
declare @sum_interest_mno_amt 	numeric(14,2)
declare @sum_interest_ins_amt 	numeric(14,2)
declare @sum_attorney_fee_amt 	numeric(14,2)
declare @sum_overage_mno_amt  	numeric(14,2)
declare @sum_overage_ins_amt  	numeric(14,2)
declare @sum_underage_mno_amt 	numeric(14,2)
declare @sum_underage_ins_amt 	numeric(14,2)
declare @sum_refund_amt       	numeric(14,2)
declare @sum_discount_ins_amt 	numeric(14,2)
declare @sum_discount_mno_amt 	numeric(14,2)
declare @sum_refund_discount_mno_amt 	numeric(14,2)
declare @sum_refund_mno_amt           	numeric(14,2)
declare @sum_refund_ins_amt           	numeric(14,2)
declare @sum_refund_penalty_mno_amt  	numeric(14,2)
declare @sum_refund_penalty_ins_amt  	numeric(14,2)
declare @sum_refund_interest_mno_amt 	numeric(14,2)
declare @sum_refund_interest_ins_amt 	numeric(14,2)
declare @sum_refund_attorney_fee_amt 	numeric(14,2)
declare @sum_adj_mno			numeric(14,2)
declare @sum_adj_ins			numeric(14,2)



	/* process delinquent roll */
	DECLARE PROPERTY_BILL CURSOR FORWARD_ONLY
	FOR select delq_roll_bill.owner_id,
	  delq_roll_bill.entity_id,
	  delq_roll_bill.bill_id,
	  delq_roll_bill.stmnt_id,
          delq_roll_bill.prop_id,
    	  delq_roll_bill.sup_tax_yr,
	  delq_roll_bill.bill_adj_m_n_o,
          delq_roll_bill.bill_adj_i_n_s,
          delq_roll_bill.bill_m_n_o_pd,
          delq_roll_bill.bill_i_n_s_pd,
          delq_roll_bill.penalty_m_n_o_pd,
          delq_roll_bill.penalty_i_n_s_pd,
          delq_roll_bill.interest_m_n_o_pd,
          delq_roll_bill.interest_i_n_s_pd,
          delq_roll_bill.attorney_fees_pd,
          delq_roll_bill.discount_mno_pd,
          delq_roll_bill.discount_ins_pd,
	  delq_roll_bill.underage_mno_pd,
	  delq_roll_bill.underage_ins_pd,
	  delq_roll_bill.refund_m_n_o_pd,
	  delq_roll_bill.refund_i_n_s_pd,
	   delq_roll_bill.refund_disc_mno_pd,
	   delq_roll_bill.refund_disc_ins_pd,
           property.prop_type_cd
   	from  delq_roll_bill, property  with (nolock)
	where delq_roll_bill.prop_id = property.prop_id
	and    ( (bill_adj_m_n_o + bill_adj_i_n_s) - 
                 		  ((bill_m_n_o_pd + bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
		 		  (refund_m_n_o_pd + refund_i_n_s_pd + refund_disc_mno_pd + refund_disc_ins_pd)) > 0 )

	OPEN PROPERTY_BILL
	FETCH NEXT FROM  PROPERTY_BILL into 
	@owner_id, 
	@entity_id,
	@bill_id,  
	@stmnt_id,  
        @prop_id,
       	@sup_tax_yr,
	@bill_m_n_o,         
       	@bill_i_n_s,     
       	@bill_m_n_o_pd,      
        @bill_i_n_s_pd,       
        @penalty_m_n_o_pd,   
        @penalty_i_n_s_pd,   
        @interest_m_n_o_pd,  
        @interest_i_n_s_pd,  
        @attorney_fees_pd,
       	@discount_mno_pd,
       	@discount_ins_pd,
	@underage_mno_pd,
	@underage_ins_pd,
	@refund_m_n_o_pd,
	@refund_i_n_s_pd,
	@refund_disc_mno_pd,
	@refund_disc_ins_pd,
       	 @prop_type_cd


	while (@@FETCH_STATUS = 0)
   	begin

        select @count = 0
        select @str_penalty_mno    = 0
        select @str_penalty_ins    = 0
        select @str_interest_mno   = 0
        select @str_interest_ins   = 0
        select @str_attorney_fee   = 0
	select @str_effective_date = @input_effective_date
	select @event_str	   = ''
	while (@count < 3)	
        	begin

		select @effective_date = convert(datetime, @str_effective_date)

		exec GetBillTaxDue @bill_id, @show_output,  'T', @str_effective_date,
				   @str_base_tax output, @str_penalty_mno output, @str_penalty_ins output,
              			   @str_interest_mno output, @str_interest_ins output, @str_attorney_fee output, @str_total output
 
		select @penalty_mno  = convert(numeric(14,2), @str_penalty_mno)
 		select @penalty_ins  = convert(numeric(14,2), @str_penalty_ins)
 		select @interest_ins = convert(numeric(14,2), @str_interest_mno)
 		select @interest_mno = convert(numeric(14,2), @str_interest_ins)
        		select @attorney_fee = convert(numeric(14,2), @str_attorney_fee)
	
		if (@count = 0)
		begin
 			select @tax_due = convert(numeric(14,2), @str_base_tax)
			select @disc_pi = @penalty_mno + @penalty_ins + @interest_mno + @interest_ins
			select @att_fee = @attorney_fee

			select @month = DATEPART(month, @effective_date)
			select @day   = DATEPART(day,   @effective_date)
			select @year  = DATEPART(year,  @effective_date)

			if (@month = 12)
			begin
				select @month = 1 				select @year  = @year + 1
			end
			else 			begin
				if (@day > 28)
				begin
				      	select @day = 28
				end

				select @month = @month + 1
			end

			select @date_string = convert(varchar(2), @month)+ '/' + convert(varchar(2),@day) + '/' + convert(varchar(4), @year)
			select @str_effective_date  =  @date_string
		end
		else if (@count = 1)
		begin
 			select @tax_due1 = convert(numeric(14,2), @str_base_tax)
			select @disc_pi1 = @penalty_mno + @penalty_ins + @interest_mno + @interest_ins
			select @att_fee1 = @attorney_fee

			select @month = DATEPART(month, @effective_date)
			select @day   = DATEPART(day,   @effective_date)
			select @year  = DATEPART(year,  @effective_date)

			if (@month = 12)
			begin
				select @month = 1
				select @year  = @year + 1
			end
			else
			begin
				if (@day > 28)
				begin
				      	select @day = 28
				end

				select @month = @month + 1
			end

			select @date_string = convert(varchar(2), @month)+ '/' + convert(varchar(2),@day) + '/' + convert(varchar(4), @year)
			select @str_effective_date  =  @date_string
		end
		else if (@count = 2)
		begin
 			select @tax_due2 = convert(numeric(14,2), @str_base_tax)
			select @disc_pi2 = @penalty_mno + @penalty_ins + @interest_mno + @interest_ins
			select @att_fee2 = @attorney_fee
		end

		select @count = @count + 1
	end

	select @last_payment_date = NULL, @last_payment_amt = 0

	if exists (select * from payment_trans  with (nolock) where bill_id = @bill_id)
	begin
		select @last_payment_date = NULL, @last_payment_amt = 0
		
		select top 1 @last_payment_date = payment.date_paid,
		          @last_payment_amt  = (payment_trans.mno_amt + payment_trans.ins_amt
     					+ payment_trans.penalty_mno_amt + payment_trans.penalty_ins_amt
     					+ payment_trans.interest_mno_amt + payment_trans.interest_ins_amt
     					+ payment_trans.attorney_fee_amt + payment_trans.overage_mno_amt + payment_trans.overage_ins_amt)
		from payment  with (nolock), payment_trans  with (nolock), batch  with (nolock)
		where payment.payment_id = payment_trans.payment_id
		and     payment_trans.bill_id = @bill_id
		and   payment.batch_id = batch.batch_id
		and   batch.balance_dt <= @input_effective_date
		order by payment.payment_id     desc
	end
	else
	begin
		select @last_payment_date = NULL, @last_payment_amt = 0
	end 


	if (@tax_due <> 0 or @tax_due1 <> 0 or @tax_due2  <> 0)
	begin
 	
		insert into delq_roll
		(
		pacs_user_id,
		bill_id,
		entity_id,
		sup_tax_yr,
		tax_due,
		disc_pi,
		att_fee,
		tax_due1,
		disc_pi1,
		att_fee1,
		tax_due2,
		disc_pi2,
		att_fee2,
		last_payment_date,
		last_payment_amt,
		prop_type_cd
		)
		values
		(
		@input_user_id,
		@bill_id,
		@entity_id,
		@sup_tax_yr,
		@tax_due,
		@disc_pi,
		@att_fee,
		@tax_due1,
		@disc_pi1,
		@att_fee1,
		@tax_due2,
		@disc_pi2,
		@att_fee2,
		@last_payment_date,
		@last_payment_amt,
		@prop_type_cd
		)
	end
	
 FETCH NEXT FROM  PROPERTY_BILL into 
	@owner_id, 
	@entity_id,
	@bill_id,   
	@stmnt_id,
        @prop_id,
       	@sup_tax_yr,
	@bill_m_n_o,         
       	@bill_i_n_s,     
       	@bill_m_n_o_pd,      
        @bill_i_n_s_pd,       
        @penalty_m_n_o_pd,   
        @penalty_i_n_s_pd,   
        @interest_m_n_o_pd,  
        @interest_i_n_s_pd,  
        @attorney_fees_pd,
       	@discount_mno_pd,
       	@discount_ins_pd,
	@underage_mno_pd,
	@underage_ins_pd,
	@refund_m_n_o_pd,
	@refund_i_n_s_pd,
	@refund_disc_mno_pd,
	@refund_disc_ins_pd,
        @prop_type_cd    
end

CLOSE PROPERTY_BILL
DEALLOCATE PROPERTY_BILL

end

insert into delq_roll_totals
(
pacs_user_id, 
entity_id,
sup_tax_yr,
num_bills,   
base_tax_due,     
real_tax_due,     
mobile_tax_due,   
mineral_tax_due,  
personal_tax_due, 
auto_tax_due     
)
select @input_user_id,
       entity_id,
       sup_tax_yr,
       sum(case when tax_due > 0 then 1 else 0 end) ,
       sum(tax_due),
       sum(case when prop_type_cd = 'R'  then IsNull(tax_due, 0) else 0 end),
       sum(case when prop_type_cd = 'MH' then IsNull(tax_due, 0) else 0 end),
       sum(case when prop_type_cd = 'MN' then IsNull(tax_due, 0) else 0 end),
       sum(case when prop_type_cd = 'P'  then IsNull(tax_due, 0) else 0 end),
       sum(case when prop_type_cd = 'A'  then IsNull(tax_due, 0) else 0 end)
from delq_roll  with (nolock)
where pacs_user_id = @input_user_id
group by entity_id, sup_tax_yr

GO

