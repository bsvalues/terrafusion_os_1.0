







CREATE     procedure RecapSelfBalance 

@input_pacs_user_id int,
@input_entity_list  varchar(1000),
@input_month	    int,
@input_year	    numeric(4),
@input_type	    varchar(50)

as


declare @prev_month		int
declare @prev_year		numeric(4)
declare @entity_id		int


declare @ytd_balance  		numeric(14,2)
declare @ytd_prev_balance	numeric(14,2)
declare @mtd_balance		numeric(14,2)
declare @dtr_balance		numeric(14,2)


delete from recap_self_balance

set @prev_month = @input_month - 1

if (@prev_month < 1)
begin
	set @prev_month = 1
	set @prev_year  = @input_year - 1
end
else
begin
	set @prev_year = @input_year
end

declare @Cursor 		varchar(1000)

set @Cursor = 'declare ENTITY cursor fast_forward for ' 
set @Cursor = @Cursor + ' select entity_id '
set @Cursor = @Cursor + ' from  entity '
set @Cursor = @Cursor + ' where entity_id in (' +  @input_entity_list + ')'

exec (@cursor)

open ENTITY
fetch next from ENTITY into @entity_id

while (@@FETCH_STATUS = 0)
begin

	

	if (@input_type like '%YTD%')
	begin
		select @ytd_balance = balance
		from recap_balance
		where tax_month = @input_month
		and   tax_yr    = @input_year
		and   type      = 'YTD'
		and   entity_id = @entity_id
	
		select @ytd_prev_balance = balance
		from recap_balance
		where tax_month = @prev_month
		and   tax_yr    = @prev_year
		and   type      = 'YTD'
		and   entity_id = @entity_id
	
		select @mtd_balance = balance
		from recap_balance
		where tax_month = @input_month
		and   tax_yr    = @input_year
		and   type      = 'MTD'
		and   entity_id = @entity_id

		insert into recap_self_balance
		(
		pacs_user_id,
		type,
		entity_id,
		balance_diff,
		tax_month,
		tax_yr
		)
		values
		(
		@input_pacs_user_id,
		'Year to Date Recap',
		@entity_id,
		@ytd_balance - (@ytd_prev_balance - @mtd_balance),
		@input_month,
		@input_year
		)
	
	end
	
	if (@input_type like '%FYTD%')
	begin
		select @ytd_balance = balance
		from recap_balance
		where tax_month = @input_month
		and   tax_yr    = @input_year
		and   type      = 'FYTD'
		and   entity_id = @entity_id
	
		select @ytd_prev_balance = balance
		from recap_balance
		where tax_month = @prev_month
		and   tax_yr    = @prev_year
		and   type      = 'FYTD'
		and   entity_id = @entity_id
	
		select @mtd_balance = balance
		from recap_balance
		where tax_month = @input_month
		and   tax_yr    = @input_year
		and   type      = 'FMTD'
		and   entity_id = @entity_id

		insert into recap_self_balance
		(
		pacs_user_id,
		type,
		entity_id,
		balance_diff,
		tax_month,
		tax_yr
		)
		values
		(
		@input_pacs_user_id,
		'Fiscal Year to Date Recap',
		@entity_id,
		@ytd_balance - @ytd_prev_balance - @mtd_balance,
		@input_month,
		@input_year
		)
	
	end
	
	if (@input_type like '%DTRY%')
	begin
		select @dtr_balance = balance
		from recap_balance
		where tax_month = @input_month
		and   tax_yr    = @input_year
		and   type      = 'DTR'
		and   entity_id = @entity_id
	
		select @ytd_balance = balance
		from recap_balance
		where tax_month = @input_month
		and   tax_yr    = @input_year
		and   type      = 'YTD'
		and   entity_id = @entity_id

		insert into recap_self_balance
		(
		pacs_user_id,
		type,
		entity_id,
		balance_diff,
		tax_month,
		tax_yr
		)
		values
		(
		@input_pacs_user_id,
		'DTR - Year to Date Recap',
		@entity_id,
		@dtr_balance - @ytd_balance,
		@input_month,
		@input_year
		)
	end
	
	if (@input_type like '%DTRF%')
	begin
		select @dtr_balance = balance
		from recap_balance
		where tax_month = @input_month
		and   tax_yr    = @input_year
		and   type      = 'DTR'
		and   entity_id = @entity_id
	
		select @ytd_balance = balance
		from recap_balance
		where tax_month = @input_month
		and   tax_yr    = @input_year
		and   type      = 'FYTD'
		and   entity_id = @entity_id

		insert into recap_self_balance
		(
		pacs_user_id,
		type,
		entity_id,
		balance_diff,
		tax_month,
		tax_yr
		)
		values
		(
		@input_pacs_user_id,
		'DTR - Fiscal Year to Date Recap',
		@entity_id,
		@dtr_balance - @ytd_balance,
		@input_month,
		@input_year
		)
	end

	fetch next from ENTITY into @entity_id
end

close ENTITY
deallocate ENTITY

GO

