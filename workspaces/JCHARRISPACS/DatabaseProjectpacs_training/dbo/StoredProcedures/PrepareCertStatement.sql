






CREATE procedure PrepareCertStatement
@input_prop_id	int,
@input_owner_id int,
@input_user_id	int,
@input_effective_date     varchar(100)

as

declare @bill_id    		int
declare @prop_id       		int
declare @sup_tax_yr      	numeric(4)
declare @show_output      	int
declare @str_penalty_mno     	varchar(100)
declare @str_penalty_ins     	varchar(100)
declare @str_interest_ins    	varchar(100)
declare @str_interest_mno    	varchar(100)
declare @str_attorney_fee    	varchar(100)
declare @str_total		varchar(100)
declare @str_base_tax		varchar(100)
declare @penalty_mno      	numeric(14,2)
declare @penalty_ins      	numeric(14,2)
declare @interest_mno      	numeric(14,2)
declare @interest_ins      	numeric(14,2)
declare @attorney_fee        	numeric(14,2)
declare @base_tax		numeric(14,2)
declare @total			numeric(14,2)
declare @effective_date		       datetime
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

declare @info_found		int

select @info_found = 0


/* delete any entry for the user/property/owner combo */
delete from prop_tax_due
where pacs_user_id = @input_user_id
and   prop_id      = @input_prop_id
--and   owner_id     = @input_owner_id


DECLARE PROPERTY_BILL SCROLL CURSOR
FOR select entity.entity_cd, 
	entity.entity_id,
	bill.bill_id,
	   bill.stmnt_id,
	bill.owner_id,
           bill.prop_id,
    	   bill.sup_tax_yr
      from   bill, entity
    where  bill.prop_id   = @input_prop_id
    --and    bill.owner_id  = @input_owner_id
    and    bill.entity_id = entity.entity_id
    and    bill.coll_status_cd <> 'RS'

OPEN PROPERTY_BILL
FETCH NEXT FROM  PROPERTY_BILL into @entity_cd, 
	@entity_id,
	@bill_id,
	@stmnt_id,
	@owner_id, 
	@prop_id,
	@sup_tax_yr
      

select @show_output = 0



while (@@FETCH_STATUS = 0)
   begin
	select @count = 0
	select @effective_date = @input_effective_date
	
	while (@count < 3)	
        begin

		execute GetBillTaxDue @bill_id, @show_output, 'F', @effective_date,
			@str_base_tax OUTPUT, @str_penalty_mno OUTPUT, @str_penalty_ins OUTPUT, @str_interest_mno OUTPUT, 
			@str_interest_ins OUTPUT, @str_attorney_fee OUTPUT, @str_total OUTPUT


 		select @base_tax       = convert(numeric(14,2), @str_base_tax)
		select @penalty_mno  = convert(numeric(14,2), @str_penalty_mno)
 		select @penalty_ins  = convert(numeric(14,2), @str_penalty_ins)
 		select @interest_ins = convert(numeric(14,2), @str_interest_mno)
 		select @interest_mno = convert(numeric(14,2), @str_interest_ins)
        		select @attorney_fee = convert(numeric(14,2), @str_attorney_fee)
		select @total = convert(numeric(14,2), @str_total)

	
		if (@count = 0)
		begin
 			select @tax_due = @base_tax
			select @disc_pi = ((@total - @base_tax) - @attorney_fee)
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
      			select @effective_date = convert(datetime, @date_string)
		end
		else if (@count = 1)
		begin
 			select @tax_due1 = @base_tax
			select @disc_pi1 = ((@total - @base_tax) - @attorney_fee)
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
       			select @effective_date = convert(datetime, @date_string)
		end
		else if (@count = 2)
		begin
 			select @tax_due2 = @base_tax
			select @disc_pi2 = ((@total - @base_tax) - @attorney_fee)
			select @att_fee2 = @attorney_fee
		end

		select @count = @count + 1
	end
 	
	if (@tax_due <> 0) or (@disc_pi <> 0) 
	begin
                            select @info_found = 1
             
		 insert into prop_tax_due
		(
	 	pacs_user_id,
	 	prop_id,
	 	owner_id,
	 	tax_yr,
		entity_id,
	 	entity_cd,
		bill_id,
	 	stmnt_id,
		effective_dt,
		tax_due,
		disc_pi,
	 	att_fee,
	 	tax_due1,
	 	disc_pi1,
	 	att_fee1,
	 	tax_due2,
	 	disc_pi2,
	 	att_fee2
		)
		values
		(
	 	@input_user_id,
	 	@prop_id,
	 	@owner_id,
	 	@sup_tax_yr,
		@entity_id,
	 	@entity_cd,
	 	@bill_id,
	 	@stmnt_id,
		convert(datetime, @input_effective_date),
	 	@tax_due,
	 	@disc_pi,
	 	@att_fee,
	 	@tax_due1,
	 	@disc_pi1,
	 	@att_fee1,
	 	@tax_due2,
	 	@disc_pi2,
	 	@att_fee2
		)
	end
 
 FETCH NEXT FROM  PROPERTY_BILL into @entity_cd, 
	@entity_id,
	@bill_id,
	@stmnt_id,
	@owner_id, 
	@prop_id,
	@sup_tax_yr
   end

   if (@info_found = 0)
  begin
	 insert into prop_tax_due
		(
	 	pacs_user_id,
	 	prop_id,
	 	owner_id,
	 	tax_yr,
		entity_id,
	 	entity_cd,
		bill_id,
	 	stmnt_id,
		effective_dt,
		tax_due,
		disc_pi,
	 	att_fee,
	 	tax_due1,
	 	disc_pi1,
	 	att_fee1,
	 	tax_due2,
	 	disc_pi2,
	 	att_fee2
		)
		values
		(
	 	@input_user_id,
	 	@input_prop_id,
	 	@input_owner_id,
	 	NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL,
		NULL
		)
  	end


CLOSE PROPERTY_BILL
DEALLOCATE PROPERTY_BILL

GO

