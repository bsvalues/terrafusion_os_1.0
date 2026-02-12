



CREATE procedure GenerateOwnerTaxDueListing
@input_owner_id		int,
@input_year		numeric(4,0),
@input_effective_date   varchar(100)

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
declare @str_base_tax		varchar(100)
declare @str_total		varchar(100)
declare @penalty_mno      	numeric(14,2)
declare @penalty_ins      	numeric(14,2)
declare @interest_mno      	numeric(14,2)
declare @interest_ins      	numeric(14,2)
declare @attorney_fee        	numeric(14,2)
declare @base_tax		numeric(14,2)
declare @total			numeric(14,2)
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

DECLARE PROPERTY_BILL SCROLL CURSOR
FOR select entity.entity_cd,
	   property.col_owner_id as owner_id,
	   bill.entity_id,
	   bill.bill_id,
	   bill.stmnt_id,
           bill.prop_id,
    	   bill.sup_tax_yr
    from   bill, entity, property
    where  property.col_owner_id = @input_owner_id
		and 	 bill.prop_id=property.prop_id
    and    bill.sup_tax_yr = @input_year
    and    bill.entity_id = entity.entity_id
    and    (bill.active_bill = 'T' or bill.active_bill is null)
    and    bill.coll_status_cd <> 'RS'
    and bill.entity_id in (select entity_id from entity_collect_for_vw)
    and (bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
    	((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
	(bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd)) > 0

OPEN PROPERTY_BILL
FETCH NEXT FROM  PROPERTY_BILL into @entity_cd, 
	@owner_id, 
	@entity_id,
	@bill_id,  
	@stmnt_id,  
        @prop_id,
       	@sup_tax_yr

/* initialize property tax due */
set @show_output = 0

DROP TABLE owner_prop_tax_due

CREATE TABLE [owner_prop_tax_due] (
	[prop_id] [int] NULL ,
	[owner_id] [int] NULL ,
	[tax_yr] [numeric](4, 0) NULL ,
	[entity_id] [int] NULL ,
	[entity_cd] [char] (5) NULL ,
	[bill_id] [int] NULL ,
	[stmnt_id] [int] NULL ,
	[effective_dt] [datetime] NULL ,
	[tax_due] [numeric](14, 2) NULL ,
	[disc_pi] [numeric](14, 2) NULL ,
	[att_fee] [numeric](14, 2) NULL ,
	[tax_due1] [numeric](14, 2) NULL ,
	[disc_pi1] [numeric](14, 2) NULL ,
	[att_fee1] [numeric](14, 2) NULL ,
	[tax_due2] [numeric](14, 2) NULL ,
	[disc_pi2] [numeric](14, 2) NULL ,
	[att_fee2] [numeric](14, 2) NULL 
) ON [PRIMARY]

while (@@FETCH_STATUS = 0)
begin
	select @count = 0
	
        select @str_penalty_mno    = 0
        select @str_penalty_ins    = 0
        select @str_interest_mno   = 0
        select @str_interest_ins   = 0
        select @str_attorney_fee   = 0
	select @str_effective_date = @input_effective_date
	
	while (@count < 3)	
        begin

		select @effective_date = convert(datetime, @str_effective_date)

		execute GetBillTaxDue @bill_id, @show_output, 'F', @effective_date,
			@str_base_tax OUTPUT, @str_penalty_mno OUTPUT, @str_penalty_ins OUTPUT, @str_interest_mno OUTPUT, 
			@str_interest_ins OUTPUT, @str_attorney_fee OUTPUT, @str_total OUTPUT

 		select @base_tax     = convert(numeric(14,2), @str_base_tax)
		select @penalty_mno  = convert(numeric(14,2), @str_penalty_mno)
 		select @penalty_ins  = convert(numeric(14,2), @str_penalty_ins)
 		select @interest_ins = convert(numeric(14,2), @str_interest_mno)
 		select @interest_mno = convert(numeric(14,2), @str_interest_ins)
        	select @attorney_fee = convert(numeric(14,2), @str_attorney_fee)
		select @total 	  = convert(numeric(14,2), @str_total)
	
		if (@count = 0)
		begin
 			select @tax_due = @base_tax
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
 			select @tax_due1 = @base_tax
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
 			select @tax_due2 = @base_tax
			select @disc_pi2 = @penalty_mno + @penalty_ins + @interest_mno + @interest_ins
			select @att_fee2 = @attorney_fee
		end

		select @count = @count + 1
	end
 	
	if (@tax_due <> 0) or (@disc_pi <> 0) 
	begin
		insert into owner_prop_tax_due
		(
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
 
	FETCH NEXT FROM PROPERTY_BILL into @entity_cd, 
		@owner_id, 
		@entity_id,
		@bill_id,   
		@stmnt_id,
        	@prop_id,
	       	@sup_tax_yr
end

CLOSE PROPERTY_BILL
DEALLOCATE PROPERTY_BILL

GO

