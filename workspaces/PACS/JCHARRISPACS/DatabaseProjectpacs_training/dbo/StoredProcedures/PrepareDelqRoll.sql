






CREATE  procedure PrepareDelqRoll

@input_user_id	int,
@input_effective_date     varchar(100),
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
declare @bill_m_n_o_pd      	numeric(14,2)
declare @bill_i_n_s_pd       	numeric(14,2)
declare @penalty_m_n_o_pd    	numeric(14,2)
declare @penalty_i_n_s_pd    	numeric(14,2)
declare @interest_m_n_o_pd   	numeric(14,2)
declare @interest_i_n_s_pd   	numeric(14,2)
declare @attorney_fees_pd    	numeric(14,2)
declare @discount_mno_pd     	numeric(14,2)
declare @discount_ins_pd     	numeric(14,2)
declare @overage_amt_pd      	numeric(14,2)
declare @underage_amt_pd     	numeric(14,2)
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

select @delq_year = delq_year
from delq_roll_params
where pacs_user_id = @input_user_id

drop table [dbo].delq_roll_bill
delete from delq_roll where pacs_user_id = @input_user_id

select @tax_year = tax_yr
from pacs_system

/* if all bills included on roll */
if (@delq_year = 'A')
begin
	if (@input_use_geo_id = 'F')
	begin

	select bill.* into [dbo].delq_roll_bill
   	from   bill, property
    	where  bill.coll_status_cd <> 'RS'
    	and    bill.coll_status_cd <> 'P'
	and    bill.prop_id = property.prop_id
	and    bill.entity_id        in (select entity_id from delq_roll_params_entity where pacs_user_id = @input_user_id)
	and    bill.entity_id 	     in (select entity_id from entity_collect_for_vw)
	and    property.prop_type_cd in (select prop_type_cd from delq_roll_params_prop_type where pacs_user_id = @input_user_id)
	and    bill.adjustment_code  in (select bill_adjust_cd from delq_roll_params_adjust_cd where pacs_user_id = @input_user_id)

	end
	else
	begin
	
	select bill.* into [dbo].delq_roll_bill
   	from   bill, property
    	where  bill.coll_status_cd <> 'RS'
    	and    bill.coll_status_cd <> 'P'
	and    bill.prop_id = property.prop_id
	and    bill.entity_id        in (select entity_id from delq_roll_params_entity where pacs_user_id = @input_user_id)
	and    bill.entity_id 	     in (select entity_id from entity_collect_for_vw)
	and    property.prop_type_cd in (select prop_type_cd from delq_roll_params_prop_type where pacs_user_id = @input_user_id)
	and    bill.adjustment_code  in (select bill_adjust_cd from delq_roll_params_adjust_cd where pacs_user_id = @input_user_id)
	and    property.geo_id 	     in (select geo_id from delq_roll_params_geo_id where pacs_user_id = @input_user_id)

	end
end
else if (@delq_year = 'C')
begin

	if (@input_use_geo_id = 'F')
	begin

	select bill.* into [dbo].delq_roll_bill
   	from   bill, property
    	where  bill.coll_status_cd <> 'RS'
    	and    bill.coll_status_cd <> 'P'
	and    bill.sup_tax_yr = @tax_year
	and    bill.prop_id = property.prop_id
	and    bill.entity_id in (select entity_id from delq_roll_params_entity where pacs_user_id = @input_user_id)
	and    bill.entity_id 	     in (select entity_id from entity_collect_for_vw)
	and    property.prop_type_cd in (select prop_type_cd from delq_roll_params_prop_type where pacs_user_id = @input_user_id)
	and    bill.adjustment_code  in (select bill_adjust_cd from delq_roll_params_adjust_cd where pacs_user_id = @input_user_id)

	end
	else
	begin
	
	select bill.* into [dbo].delq_roll_bill
   	from   bill, property
    	where  bill.coll_status_cd <> 'RS'
    	and    bill.coll_status_cd <> 'P'
	and    bill.coll_status_cd <> 'RD'
	and    bill.sup_tax_yr = @tax_year
	and    bill.prop_id = property.prop_id
	and    bill.entity_id in (select entity_id from delq_roll_params_entity where pacs_user_id = @input_user_id)
	and    bill.entity_id 	     in (select entity_id from entity_collect_for_vw)
	and    property.prop_type_cd in (select prop_type_cd from delq_roll_params_prop_type where pacs_user_id = @input_user_id)
	and    bill.adjustment_code  in (select bill_adjust_cd from delq_roll_params_adjust_cd where pacs_user_id = @input_user_id)
	and    property.geo_id 	     in (select geo_id from delq_roll_params_geo_id where pacs_user_id = @input_user_id)

	end
end
else if (@delq_year = 'D')
begin

	if (@input_use_geo_id = 'F')
	begin

	select bill.* into [dbo].delq_roll_bill
   	from   bill, property
    	where  bill.coll_status_cd <> 'RS'
    	and    bill.coll_status_cd <> 'P'
	and    bill.coll_status_cd <> 'RD'
	and    bill.sup_tax_yr < @tax_year
	and    bill.prop_id = property.prop_id
	and    bill.entity_id in (select entity_id from delq_roll_params_entity where pacs_user_id = @input_user_id)
	and    bill.entity_id 	     in (select entity_id from entity_collect_for_vw)
	and    property.prop_type_cd in (select prop_type_cd from delq_roll_params_prop_type where pacs_user_id = @input_user_id)
	and    bill.adjustment_code  in (select bill_adjust_cd from delq_roll_params_adjust_cd where pacs_user_id = @input_user_id)

	end
	else
	begin
	
	select bill.* into [dbo].delq_roll_bill
   	from   bill, property
    	where  bill.coll_status_cd <> 'RS'
    	and    bill.coll_status_cd <> 'P'
	and    bill.coll_status_cd <> 'RD'
	and    bill.sup_tax_yr < @tax_year
	and    bill.prop_id = property.prop_id
	and    bill.entity_id in (select entity_id from delq_roll_params_entity where pacs_user_id = @input_user_id)
	and    bill.entity_id 	     in (select entity_id from entity_collect_for_vw)
	and    property.prop_type_cd in (select prop_type_cd from delq_roll_params_prop_type where pacs_user_id = @input_user_id)
	and    bill.adjustment_code  in (select bill_adjust_cd from delq_roll_params_adjust_cd where pacs_user_id = @input_user_id)
	and    property.geo_id 	     in (select geo_id from delq_roll_params_geo_id where pacs_user_id = @input_user_id)

	end
end


/* back out any adjustments that might have happened after the effective due date */
update delq_roll_bill set bill_adj_m_n_o = IsNull(bill_adj_trans.prev_mno_tax, 0),
		bill_adj_i_n_s = IsNull(bill_adj_trans.prev_ins_tax, 0),
		bill_taxable_val = IsNull(prev_taxable, 0),
		bill_assessed_value = IsNull(prev_assessed, 0),
		effective_due_dt = prev_eff_due_dt,
		adjustment_code = prev_adj_code
from bill_adj_trans
where delq_roll_bill.bill_id 		= bill_adj_trans.bill_id
and     bill_adj_trans.modify_dt >= @month1


/* back out any payments that might have happened after the effective due date */

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

DECLARE payment_cursor CURSOR FORWARD_ONLY STATIC
FOR select bill_id
    from  delq_roll_bill
    
	
OPEN payment_cursor
FETCH NEXT FROM payment_cursor into @payment_bill_id

while (@@FETCH_STATUS = 0)
begin

	if exists (select * 
	   from payment_trans 
	   where bill_id = @payment_bill_id)
	begin
		select 	@sum_mno_amt          = sum(mno_amt), 
			@sum_ins_amt          = sum(ins_amt),  
			@sum_penalty_mno_amt  = sum(penalty_mno_amt),  
			@sum_penalty_ins_amt  = sum(penalty_ins_amt),
       			@sum_interest_mno_amt = sum(interest_mno_amt), 
			@sum_interest_ins_amt = sum(interest_ins_amt), 
			@sum_attorney_fee_amt = sum(attorney_fee_amt), 
			@sum_overage_mno_amt  = sum(overage_mno_amt),
			@sum_overage_ins_amt  = sum(overage_ins_amt),
       			@sum_underage_mno_amt = sum(underage_mno_amt),
			@sum_underage_ins_amt = sum(underage_ins_amt),  
			@sum_discount_ins_amt = sum(discount_ins_amt), 
			@sum_discount_mno_amt = sum(discount_mno_amt)
		from payment, payment_trans, batch
		where payment.payment_id = payment_trans.payment_id
		and   payment.batch_id = batch.batch_id
		and   batch.balance_dt > @month1
		group by bill_id
		

		update delq_roll_bill set  	bill_m_n_o_pd     = bill_m_n_o_pd - @sum_mno_amt,   
						bill_i_n_s_pd     = bill_i_n_s_pd - @sum_ins_amt,     
						discount_mno_pd   = discount_mno_pd -   @sum_discount_mno_amt, 
						discount_ins_pd   = discount_ins_pd -   @sum_discount_ins_amt,       
						penalty_m_n_o_pd  = penalty_m_n_o_pd  - (@sum_penalty_mno_amt),     
						penalty_i_n_s_pd  = penalty_i_n_s_pd  - (@sum_penalty_ins_amt),   
						interest_m_n_o_pd = interest_m_n_o_pd  - (@sum_interest_mno_amt),     
						interest_i_n_s_pd = interest_i_n_s_pd  - (@sum_interest_ins_amt),  
  						attorney_fees_pd  = attorney_fees_pd  - (@sum_attorney_fee_amt),     
						overage_mno_pd    = overage_mno_pd  - (@sum_overage_mno_amt),     
						overage_ins_pd    = overage_ins_pd  - (@sum_overage_ins_amt),    
						underage_mno_pd   = underage_mno_pd  - (@sum_underage_mno_amt),     
						underage_ins_pd   = underage_ins_pd  - (@sum_underage_ins_amt)   
						
		where bill_id = @bill_id
	end

	
	FETCH NEXT FROM payment_cursor into @payment_bill_id

end

close payment_cursor
deallocate payment_cursor	



/* back out any refunds that might have happened after the effective due date */

DECLARE refund_cursor CURSOR FORWARD_ONLY
FOR select bill_id
    from  delq_roll_bill
    
	
OPEN refund_cursor
FETCH NEXT FROM refund_cursor into @refund_bill_id

while (@@FETCH_STATUS = 0)
begin

	if exists (select * 
	   from refund_trans 
	   where bill_id = @refund_bill_id)
	begin
		select 	@sum_mno_amt          = sum(refund_m_n_o_pd), 
			@sum_ins_amt          = sum(refund_i_n_s_pd),  
			@sum_penalty_mno_amt  = sum(refund_pen_m_n_o_pd),  
			@sum_penalty_ins_amt  = sum(refund_pen_i_n_s_pd),
       			@sum_interest_mno_amt = sum(refund_int_m_n_o_pd), 
			@sum_interest_ins_amt = sum(refund_int_i_n_s_pd), 
			@sum_attorney_fee_amt = sum(refund_atty_fee_pd)
		from refund, refund_trans, batch
		where refund.refund_id = refund_trans.refund_id
		and   refund.batch_id  = batch.batch_id
		and   batch.balance_dt > @month1
		group by bill_id
		

		update delq_roll_bill set  	refund_m_n_o_pd     = refund_m_n_o_pd     - @sum_mno_amt,   
						refund_i_n_s_pd     = refund_i_n_s_pd     - @sum_ins_amt,     
						refund_pen_m_n_o_pd = refund_pen_m_n_o_pd - (@sum_penalty_mno_amt),     
						refund_pen_i_n_s_pd = refund_pen_i_n_s_pd - (@sum_penalty_ins_amt),   
						refund_int_m_n_o_pd = refund_int_m_n_o_pd - (@sum_interest_mno_amt),     
						refund_int_i_n_s_pd = refund_int_i_n_s_pd - (@sum_interest_ins_amt),  
  						refund_atty_fee_pd  = refund_atty_fee_pd  - (@sum_attorney_fee_amt)
						
		where bill_id = @bill_id
	end

	
	FETCH NEXT FROM refund_cursor into @refund_bill_id

end

close refund_cursor
deallocate refund_cursor	

/* process delinquent roll */
DECLARE PROPERTY_BILL CURSOR FORWARD_ONLY
	FOR select delq_roll_bill.owner_id,
	   delq_roll_bill.entity_id,
	   delq_roll_bill.bill_id,
	   delq_roll_bill.stmnt_id,
           delq_roll_bill.prop_id,
    	   delq_roll_bill.sup_tax_yr,
           delq_roll_bill.bill_m_n_o,
           delq_roll_bill.bill_i_n_s,
           delq_roll_bill.bill_m_n_o_pd,
           delq_roll_bill.bill_i_n_s_pd,
           delq_roll_bill.penalty_m_n_o_pd,
           delq_roll_bill.penalty_i_n_s_pd,
           delq_roll_bill.interest_m_n_o_pd,
           delq_roll_bill.interest_i_n_s_pd,
           delq_roll_bill.attorney_fees_pd,
           delq_roll_bill.discount_mno_pd,
           delq_roll_bill.discount_ins_pd,
	property.prop_type_cd
   	from   delq_roll_bill, property
	where delq_roll_bill.prop_id = property.prop_id
 
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

	if exists (select * from payment_trans where bill_id = @bill_id)
	begin
		select top 1 @last_payment_date = payment.date_paid,
		          @last_payment_amt  = (payment_trans.mno_amt + payment_trans.ins_amt
     					+ payment_trans.penalty_mno_amt + payment_trans.penalty_ins_amt
     					+ payment_trans.interest_mno_amt + payment_trans.interest_ins_amt
     					+ payment_trans.attorney_fee_amt + payment_trans.overage_mno_amt  + payment_trans.overage_ins_amt)
		from payment, payment_trans, batch
		where payment.payment_id = payment_trans.payment_id
		and     payment_trans.bill_id = @bill_id
		and   payment.batch_id = batch.balance_dt
		and   batch.balance_dt <= @month1
		order by payment.payment_id desc
	end
	else
	begin
		select @last_payment_date = NULL, @last_payment_amt = 0
	end 

	if (@tax_due > 0 or @tax_due1 > 0 or @tax_due2 > 0)
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
	@prop_type_cd
   end

CLOSE PROPERTY_BILL
DEALLOCATE PROPERTY_BILL


delete from delq_roll_totals where pacs_user_id = @input_user_id

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
       count(bill_id),
       sum(tax_due),
       sum(case when prop_type_cd = 'R'  then IsNull(tax_due, 0) else 0 end),
       sum(case when prop_type_cd = 'MH' then IsNull(tax_due, 0) else 0 end),
       sum(case when prop_type_cd = 'MN' then IsNull(tax_due, 0) else 0 end),
       sum(case when prop_type_cd = 'P'  then IsNull(tax_due, 0) else 0 end),
       sum(case when prop_type_cd = 'A'  then IsNull(tax_due, 0) else 0 end)
from delq_roll
group by entity_id, sup_tax_yr

GO

