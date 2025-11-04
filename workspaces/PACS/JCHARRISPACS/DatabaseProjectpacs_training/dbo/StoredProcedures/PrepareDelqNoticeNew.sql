
CREATE PROCEDURE PrepareDelqNoticeNew
@input_user_id		int,
@input_effective_date   varchar(100),
@input_heading		varchar(1),
@input_event		varchar(1)

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
declare @str_penalty_mno     	varchar(100)
declare @str_penalty_ins     	varchar(100)
declare @str_interest_ins    	varchar(100)
declare @str_interest_mno    	varchar(100)
declare @str_attorney_fee    	varchar(100)
declare @str_total		varchar(100)
declare @str_base_tax		varchar(100)
declare @base_tax		numeric(14,2)
declare @penalty_mno      	numeric(14,2)
declare @penalty_ins      	numeric(14,2)
declare @interest_mno      	numeric(14,2)
declare @interest_ins      	numeric(14,2)
declare @attorney_fee        	numeric(14,2)
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
declare @delq_notice_id		int
declare @next_event_id		int
declare @payee_id		int
declare @prev_notice_id		int
declare @notice_id		int
declare @adjustment_code	varchar(10)
declare @adjustment_codes	varchar(100)
/*
--HS37720
declare @str_pay1_due		varchar(100) 
declare @str_pay2_due		varchar(100) 
declare @str_pay3_due		varchar(100) 
declare @str_pay4_due		varchar(100)

declare @pay1_due 		numeric(14,2)
declare @pay2_due 		numeric(14,2)
declare @pay3_due 		numeric(14,2)
declare @pay4_due 		numeric(14,2)
declare @current_pay_due	numeric(14,2)
set @current_pay_due = 0.00
--

select @temp_day   = datepart(day,   convert(datetime, @input_effective_date))
select @temp_month = datepart(month, convert(datetime, @input_effective_date))
select @temp_year  = datepart(year,  convert(datetime, @input_effective_date))

select @temp_date  = convert(varchar(2), @temp_month)+ '/' + convert(varchar(2),@temp_day) + '/' + convert(varchar(4), @temp_year)
select @month1     = datename(month, @temp_date) + ' ' + convert(varchar(4), @temp_year)

if (@temp_month = 12)
begin
	set @temp_year  = @temp_year + 1
	set @temp_month = 1
end
else
begin
	set @temp_month = @temp_month + 1
end

exec GetLastDayOfMonth @temp_month, @temp_year, @temp_day output

set @temp_date = convert(varchar(2), @temp_month)+ '/' + convert(varchar(2),@temp_day) + '/' + convert(varchar(4), @temp_year)
set @month2   = datename(month, @temp_date) + ' ' + convert(varchar(4), @temp_year)

if (@temp_month = 12)
begin
	set @temp_year  = @temp_year + 1
	set @temp_month = 1
end
else
begin
	set @temp_month = @temp_month + 1
end

exec GetLastDayOfMonth @temp_month, @temp_year, @temp_day output

set @temp_date = convert(varchar(2), @temp_month)+ '/' + convert(varchar(2),@temp_day) + '/' + convert(varchar(4), @temp_year)
set @month3    = datename(month, @temp_date) + ' ' + convert(varchar(4), @temp_year)

--Set the delq_notice fields...
update delq_notice
set notice_dt = convert(datetime, @input_effective_date),
	notice_heading = @input_heading,
	month_1 = @month1,
	month_2 = @month2,
	month_3 = @month3
where pacs_user_id = @input_user_id
	and status = 'F'

-- initialize property tax due
set @property_tax_due = 0
set @property_attorney_fee = 0
set @delinquent_tax_due = 0
set @show_output = 0
set @prev_prop_id  = 0

DECLARE PROPERTY_BILL SCROLL CURSOR
FOR select delq_notice_bill.delq_notice_id, delq_notice_bill.bill_id
    from   delq_notice with (nolock), delq_notice_bill with (nolock)
    where  delq_notice.pacs_user_id = @input_user_id
	    and    delq_notice.status = 'F'
	    and    delq_notice.delq_notice_id = delq_notice_bill.delq_notice_id

OPEN PROPERTY_BILL
FETCH NEXT FROM PROPERTY_BILL into @delq_notice_id, @bill_id

while (@@FETCH_STATUS = 0)
   begin
        set @count = 0
	
        set @str_penalty_mno    = 0
        set @str_penalty_ins    = 0
        set @str_interest_mno   = 0
        set @str_interest_ins   = 0
        set @str_attorney_fee   = 0
	set @str_effective_date = @input_effective_date
	set @event_str	   = ''
	
	while (@count < 3)	
        begin

		set @effective_date = convert(datetime, @str_effective_date)

		execute GetBillTaxDue @bill_id, @show_output, 'F', @effective_date,
			@str_base_tax OUTPUT, @str_penalty_mno OUTPUT, @str_penalty_ins OUTPUT, @str_interest_mno OUTPUT, 
			@str_interest_ins OUTPUT, @str_attorney_fee OUTPUT, @str_total OUTPUT,
		--HS37220
		@str_pay1_due OUTPUT,'','','','','','',
		@str_pay2_due OUTPUT,'','','','','','',
		@str_pay3_due OUTPUT,'','','','','','',
		@str_pay4_due OUTPUT
		--

 		set @base_tax       = convert(numeric(14,2), @str_base_tax)
		set @penalty_mno  = convert(numeric(14,2), @str_penalty_mno)
 		set @penalty_ins  = convert(numeric(14,2), @str_penalty_ins)
 		set @interest_ins = convert(numeric(14,2), @str_interest_mno)
 		set @interest_mno = convert(numeric(14,2), @str_interest_ins)
        	set @attorney_fee = convert(numeric(14,2), @str_attorney_fee)
		set @total = convert(numeric(14,2), @str_total)
		--HS37220
		Set @pay1_due = convert(numeric(14,2), ISNULL(@str_pay1_due,0))
		Set @pay2_due = convert(numeric(14,2), ISNULL(@str_pay2_due,0))
		Set @pay3_due = convert(numeric(14,2), ISNULL(@str_pay3_due,0))
		Set @pay4_due = convert(numeric(14,2), ISNULL(@str_pay4_due,0))
		--
	
		if (@count = 0)
		begin
 			set @tax_due = @base_tax
			set @disc_pi = @penalty_mno + @penalty_ins + @interest_mno + @interest_ins
			set @att_fee = @attorney_fee

			set @month = DATEPART(month, @effective_date)
			set @day   = DATEPART(day,   @effective_date)
			set @year  = DATEPART(year,  @effective_date)

			if (@month = 12)
			begin
				set @month = 1
				set @year  = @year + 1
			end
			else
			begin
				if (@day > 28)
				begin
				      	set @day = 28
				end

				set @month = @month + 1
			end

			set @date_string = convert(varchar(2), @month)+ '/' + convert(varchar(2),@day) + '/' + convert(varchar(4), @year)
			set @str_effective_date  =  @date_string
		end
		else if (@count = 1)
		begin
 			set @tax_due1 = @base_tax
			set @disc_pi1 = @penalty_mno + @penalty_ins + @interest_mno + @interest_ins
			set @att_fee1 = @attorney_fee

			set @month = DATEPART(month, @effective_date)
			set @day   = DATEPART(day,   @effective_date)
			set @year  = DATEPART(year,  @effective_date)

			if (@month = 12)
			begin
				set @month = 1
				set @year  = @year + 1
			end
			else
			begin
				if (@day > 28)
				begin
				      	set @day = 28
				end

				set @month = @month + 1
			end

			set @date_string = convert(varchar(2), @month)+ '/' + convert(varchar(2),@day) + '/' + convert(varchar(4), @year)
			set @str_effective_date  =  @date_string
		end
		else if (@count = 2)
		begin
 			set @tax_due2 = @base_tax
			set @disc_pi2 = @penalty_mno + @penalty_ins + @interest_mno + @interest_ins
			set @att_fee2 = @attorney_fee
		end

		set @count = @count + 1
	end

	--Update bill record 	
	update delq_notice_bill
	set 	base_tax  	= @base_tax,
		disc_pi1	= @disc_pi,
		attorney_fee1	= @att_fee,
		tax_due1	= @tax_due,
		disc_pi2	= @disc_pi1,
		attorney_fee2	= @att_fee1,
		tax_due2	= @tax_due1,
		disc_pi3	= @disc_pi2,
		attorney_fee3	= @att_fee2,
		tax_due3	= @tax_due2
	where  delq_notice_bill.delq_notice_id = @delq_notice_id
		and    delq_notice_bill.bill_id = @bill_id

	FETCH NEXT FROM PROPERTY_BILL into @delq_notice_id, @bill_id
end

CLOSE PROPERTY_BILL
DEALLOCATE PROPERTY_BILL

--Get rid of any bills that are less than what is setup in the delq_notice_maint table...
delete from delq_notice_bill
from delq_notice_maint, delq_notice
where delq_notice_bill.delq_notice_id = delq_notice.delq_notice_id
	and delq_notice.prop_type_cd = 'R'
	and delq_notice_bill.tax_yr < delq_notice_maint.mobile_yr
	and delq_notice.pacs_user_id = @input_user_id
	and delq_notice.status = 'F'

delete from delq_notice_bill
from delq_notice_maint, delq_notice
where delq_notice_bill.delq_notice_id = delq_notice.delq_notice_id
	and delq_notice.prop_type_cd = 'MH'
	and delq_notice_bill.tax_yr < delq_notice_maint.mobile_yr
	and delq_notice.pacs_user_id = @input_user_id
	and delq_notice.status = 'F'

delete from delq_notice_bill
from delq_notice_maint, delq_notice
where delq_notice_bill.delq_notice_id = delq_notice.delq_notice_id
	and delq_notice.prop_type_cd = 'MN'
	and delq_notice_bill.tax_yr < delq_notice_maint.mineral_yr
	and delq_notice.pacs_user_id = @input_user_id
	and delq_notice.status = 'F'

delete from delq_notice_bill
from delq_notice_maint, delq_notice
where delq_notice_bill.delq_notice_id = delq_notice.delq_notice_id
	and delq_notice.prop_type_cd = 'P'
	and delq_notice_bill.tax_yr < delq_notice_maint.personal_yr
	and delq_notice.pacs_user_id = @input_user_id
	and delq_notice.status = 'F'

delete from delq_notice_bill
from delq_notice_maint, delq_notice
where delq_notice_bill.delq_notice_id = delq_notice.delq_notice_id
	and delq_notice.prop_type_cd = 'A'
	and delq_notice_bill.tax_yr < delq_notice_maint.auto_yr
	and delq_notice.pacs_user_id = @input_user_id
	and delq_notice.status = 'F'

--Get rid of any bills that are Quarterly bills and are NOT delinquent...
--HS37720
declare @effective_date_dt	datetime
declare @pay1_due_dt 		datetime
declare @pay2_due_dt 		datetime
declare @pay3_due_dt 		datetime
declare @pay4_due_dt 		datetime

set @effective_date_dt = convert(datetime, @input_effective_date )

Select
	@pay1_due_dt = pay1_due_dt,
	@pay2_due_dt = pay2_due_dt,
	@pay3_due_dt = pay3_due_dt,
	@pay4_due_dt = pay4_due_dt
FROM 	bill, tax_rate
WHERE  	bill.bill_id = @bill_id AND
	bill.entity_id = tax_rate.entity_id AND
	bill.sup_tax_yr = tax_rate.tax_rate_yr AND
	(bill.coll_status_cd <> 'RS') AND
	(bill.active_bill = 'T' OR bill.active_bill IS NULL OR tax_rate.collect_option = 'GS')

if @effective_date_dt > @pay1_due_dt
begin
set	@current_pay_due = @pay1_due
end

if @effective_date_dt > @pay2_due_dt
begin
set	@current_pay_due = @pay2_due
end

if @effective_date_dt > @pay3_due_dt
begin
set	@current_pay_due = @pay3_due
end

if @effective_date_dt > @pay4_due_dt
begin
set	@current_pay_due = @pay4_due
end
--

delete from delq_notice_bill
from delq_notice
where delq_notice_bill.delq_notice_id = delq_notice.delq_notice_id
	and delq_notice_bill.q_bill = 'Q'
	and delq_notice_bill.disc_pi1 = 0
	--HS37720
	and @current_pay_due = 0
	--
	and delq_notice.pacs_user_id = @input_user_id
	and delq_notice.status = 'F'

--Get rid of any bills that are Half bills and are NOT delinquent...
delete from delq_notice_bill
from delq_notice
where delq_notice_bill.delq_notice_id = delq_notice.delq_notice_id
	and delq_notice_bill.q_bill = 'H'
	and delq_notice_bill.disc_pi1 = 0
	--HS37720
	and @current_pay_due = 0
	--
	and delq_notice.pacs_user_id = @input_user_id
	and delq_notice.status = 'F'

--Finally, get rid of the delq_notice records where there are no corresponding delq_notice_bill records...
delete from delq_notice
where not exists
(
	select *
	from delq_notice_bill with (nolock)
	where delq_notice_id = delq_notice.delq_notice_id
)

--Get the adjustment codes associated with the notice
set @adjustment_codes = ''
set @prev_notice_id = -1

DECLARE ADJUSTMENT_CODES SCROLL CURSOR
FOR select distinct delq_notice_bill.delq_notice_id as notice_id, RTRIM(delq_notice_bill.adjustment_code) as adjustment_code
	from 	delq_notice with (nolock), delq_notice_bill with (nolock)
	where	delq_notice.pacs_user_id = @input_user_id
	and	delq_notice.status = 'F'
	and	delq_notice.delq_notice_id = delq_notice_bill.delq_notice_id
	and	delq_notice_bill.adjustment_code is not null
	order by notice_id, adjustment_code

OPEN ADJUSTMENT_CODES
FETCH NEXT FROM ADJUSTMENT_CODES INTO @notice_id, @adjustment_code

while (@@FETCH_STATUS = 0)
begin
	if (@notice_id = @prev_notice_id)
	begin
		if (@adjustment_codes = '')
		begin
			set @adjustment_codes = @adjustment_code
		end
		else
		begin
			set @adjustment_codes = @adjustment_codes + ', '
			set @adjustment_codes = @adjustment_codes + @adjustment_code
		end
	end
	else
	begin
		if (@prev_notice_id <> -1)
		begin
			update delq_notice
			set adjustment_codes = @adjustment_codes
			where delq_notice.delq_notice_id = @prev_notice_id
				and delq_notice.pacs_user_id = @input_user_id
				and delq_notice.status = 'F'

			set @adjustment_codes = ''
		end

		set @adjustment_codes = @adjustment_code
		set @prev_notice_id = @notice_id
	end

	FETCH NEXT FROM ADJUSTMENT_CODES into @notice_id, @adjustment_code
end

if (len(@adjustment_codes) > 0)
begin
	update delq_notice
	set adjustment_codes = @adjustment_codes
	where delq_notice.delq_notice_id = @prev_notice_id
		and delq_notice.pacs_user_id = @input_user_id
		and delq_notice.status = 'F'
end

update delq_notice
set adjustment_codes = ''
where delq_notice.pacs_user_id = @input_user_id
	and delq_notice.status = 'F'
	and adjustment_codes is null

CLOSE ADJUSTMENT_CODES
DEALLOCATE ADJUSTMENT_CODES

--Update the rest of the fields to be used in the notice
update delq_notice
set 	comment			= delq_notice_maint.comment,
	geo_id			= p.geo_id,
	legal_acreage		= pv.legal_acreage,
	legal_desc		= pv.legal_desc,
	dba_name		= p.dba_name
from prop_supp_assoc psa,
	property_val pv,
	property p,
	delq_notice_maint,
	pacs_system
where psa.prop_id = pv.prop_id
	and psa.sup_num = pv.sup_num
	and psa.owner_tax_yr = pv.prop_val_yr
	and pv.prop_id = p.prop_id
	and psa.owner_tax_yr in
	(
		select max(owner_tax_yr)
		from prop_supp_assoc
		where prop_id = psa.prop_id AND 
		owner_tax_yr <= pacs_system.tax_yr
	)
	and delq_notice.prop_id = psa.prop_id
	and delq_notice.pacs_user_id = @input_user_id
	and delq_notice.status = 'F'

--Set situs fields
update	delq_notice
set	situs_display = s.situs_display
from	situs s
where	delq_notice.prop_id = s.prop_id
	and	delq_notice.pacs_user_id = @input_user_id
	and	delq_notice.status = 'F'
	and	s.primary_situs = 'Y'

--Set pct_ownership
update delq_notice
set pct_ownership = o.pct_ownership
from prop_supp_assoc psa, owner o, pacs_system
where psa.prop_id = o.prop_id
	and psa.sup_num = o.sup_num
	and psa.owner_tax_yr = o.owner_tax_yr
	and psa.owner_tax_yr in
	(
		select max(owner_tax_yr)
		from prop_supp_assoc
		where prop_id = psa.prop_id AND 
		owner_tax_yr <= pacs_system.tax_yr
	)
	and delq_notice.prop_id = psa.prop_id
	and delq_notice.owner_id = o.owner_id
	and delq_notice.pacs_user_id = @input_user_id
	and delq_notice.status = 'F'

--Set pct_ownership if owner isn't the same as owner of bills, best way to handle at this point
update delq_notice
set pct_ownership = 100
where pct_ownership IS NULL
	and delq_notice.pacs_user_id = @input_user_id
	and delq_notice.status = 'F'

--Fill in owner information
update delq_notice
set 	owner_file_as_name	= account.file_as_name,
	owner_addr_line1	= address.addr_line1,
	owner_addr_line2	= address.addr_line2,
	owner_addr_line3	= address.addr_line3,
	owner_addr_city		= address.addr_city,
	owner_addr_state	= address.addr_state,
	owner_addr_country_cd	= address.country_cd,
	owner_addr_zip		= address.addr_zip,
	payee_file_as_name	= account.file_as_name,
	payee_addr_line1	= address.addr_line1,
	payee_addr_line2	= address.addr_line2,
	payee_addr_line3	= address.addr_line3,
	payee_addr_city		= address.addr_city,
	payee_addr_state	= address.addr_state,
	payee_addr_country_cd	= address.country_cd,
	payee_addr_zip		= address.addr_zip
from account, address
where delq_notice.owner_id = account.acct_id
	and account.acct_id = address.acct_id
	and address.primary_addr = 'Y'
	and delq_notice.pacs_user_id = @input_user_id
	and delq_notice.status = 'F'
	and delq_notice.owner_file_as_name IS NULL
	and delq_notice.owner_addr_line1 IS NULL
	and delq_notice.owner_addr_line2 IS NULL
	and delq_notice.owner_addr_line3 IS NULL
	and delq_notice.owner_addr_city IS NULL
	and delq_notice.owner_addr_state IS NULL
	and delq_notice.owner_addr_country_cd IS NULL
	and delq_notice.owner_addr_zip IS NULL

--Update the rest of the fields to be used in the notice for an AGENT
update delq_notice
set 	payee_file_as_name	= account.file_as_name,
	payee_addr_line1	= address.addr_line1,
	payee_addr_line2	= address.addr_line2,
	payee_addr_line3	= address.addr_line3,
	payee_addr_city		= address.addr_city,
	payee_addr_state	= address.addr_state,
	payee_addr_country_cd	= address.country_cd,
	payee_addr_zip		= address.addr_zip
from account, address
where delq_notice.payee_id = account.acct_id
	and account.acct_id = address.acct_id
	and address.primary_addr = 'Y'
	and delq_notice.owner_id <> delq_notice.payee_id
	and delq_notice.pacs_user_id = @input_user_id
	and delq_notice.status = 'F'

--If the user wants to generate an event, then setting the status = 'T' will make it a permanent record and won't ever be touched.
--Those records after this point that have a status of 'F' are fair game for deletion, etc.
if (@input_event = 'T')
begin
	--Generate event records for all delq_notice records...
	--Add an event_type record if one doesn't exist
	if not exists (select * from event_type where event_type_cd = 'DELQNOTICE')
	begin
		insert into event_type
		(
			event_type_cd,
			event_type_desc,
			sys_flag,
			event_type_flag
		)
		values
		(
			'DELQNOTICE',
			'Delinquent Notice',
			'T',
			'S'
		)
	end

	--Loop through all the records and create an event
	DECLARE DELQ_EVENT CURSOR FAST_FORWARD
	FOR select delq_notice_id, prop_id, owner_id, payee_id
	from delq_notice with (nolock)
	where pacs_user_id = @input_user_id
		and status = 'F'
 
	OPEN DELQ_EVENT
	FETCH NEXT FROM DELQ_EVENT into @delq_notice_id, @prop_id, @owner_id, @payee_id

	WHILE (@@FETCH_STATUS = 0)
	BEGIN
		--Get next_event_id
		exec dbo.GetUniqueID 'event', @next_event_id output, 1, 0
		
		--Create one event and the corresponding event_prop_assoc record
		insert into event
		(
			event_id,
			system_type,
			event_type,
			event_date,
			pacs_user,
			event_desc,
			ref_num,
			ref_evt_type
		)
		select
			@next_event_id,
			'C',
			'SYSTEM',
			GetDate(),
			pacs_user.pacs_user_name,
			'Delinquent Notice Printed' + case when @owner_id <> @payee_id then ' for Agent' else '' end,
			@delq_notice_id,
			'DELQNOTICE'
		from pacs_user
		where pacs_user.pacs_user_id = @input_user_id

		insert into prop_event_assoc
		(
			prop_id,
			event_id
		)
		select
			@prop_id,
			@next_event_id

		--Get next record			
		FETCH NEXT FROM DELQ_EVENT into @delq_notice_id, @prop_id, @owner_id, @payee_id
	END

	CLOSE DELQ_EVENT
	DEALLOCATE DELQ_EVENT
end


*/

GO

