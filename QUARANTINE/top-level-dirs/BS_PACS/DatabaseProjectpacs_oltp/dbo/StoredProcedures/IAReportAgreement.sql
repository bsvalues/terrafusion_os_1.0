

CREATE   procedure IAReportAgreement

@ia_id	int

as

declare @ia_acct_id		int
declare @ia_create_dt		datetime
declare @ia_payment_terms	varchar(5)
declare @ia_sched_type		varchar(1)
declare @payer			varchar(70)
declare @entity_list		varchar(50)
declare @year_list		varchar(50)
declare @entity_cd		varchar(5)
declare @sup_tax_yr		numeric(4)
declare @ia_amt_due		numeric(14,2)
declare @ia_dt_due		datetime
declare @ia_dt_end		datetime


declare @system_type 	char(1) 
declare @addr_line1 	varchar(50) 
declare @addr_line2 	varchar(50) 
declare @addr_line3 	varchar(50) 
declare @city 		varchar(50) 
declare @state 		char(2) 
declare @zip 		varchar (50)
declare @cad_id_code 	char(3) 
declare @phone_num 	varchar(25) 
declare @phone_num2 	varchar(25) 
declare @fax_num 	varchar(25) 
declare @chief_appraiser varchar(50) 
declare @county_name 	varchar(30) 
declare @office_name 	varchar(50) 
declare @url 		varchar(50) 
declare @file_as_name	varchar(70)

declare @own_addr_line1 	varchar(60) 
declare @own_addr_line2 	varchar(60) 
declare @own_addr_line3 	varchar(60) 
declare @own_addr_city 	varchar(50) 
declare @own_addr_state 	varchar(50) 
declare @own_addr_zip 	varchar(50) 
declare @own_is_international	bit
declare @own_country_name varchar(50)

declare @ia_ref_num		varchar(255)
declare @ia_num_months	int -- added to get the num of months PratimaV HS 13886



set @entity_list = ''
set @year_list   = ''

select @ia_acct_id       = ia_acct_id,
       @ia_create_dt     = ia_create_dt,
       @ia_payment_terms = ia_payment_terms,
       @ia_sched_type    = ia_sched_type,
       @file_as_name     = file_as_name,
       @own_addr_line1   = address.addr_line1,
       @own_addr_line2   = address.addr_line2,
       @own_addr_line3   = address.addr_line3,
       @own_addr_city    = address.addr_city,
       @own_addr_state   = address.addr_state,
       @own_addr_zip     = address.addr_zip,
       @own_is_international = address.is_international,
       @own_country_name   = country.country_name,
       @ia_ref_num	     = ia_ref_num,
       @ia_num_months    = ia_num_months -- added to get the num of months PratimaV HS 13886

from installment_agreement with (nolock)
inner join account with (nolock)
	on ia_acct_id = account.acct_id
inner join address with (nolock)
	left outer join country
		on country.country_cd = address.country_cd
	on account.acct_id = address.acct_id
	and address.primary_addr = 'Y'
where   ia_id = @ia_id

select @payer = file_as_name
from account
where acct_id = @ia_acct_id


declare entity_cursor CURSOR FAST_FORWARD
for select distinct rtrim(entity_cd) as entity_cd
    from bill, installment_agreement_bill_assoc iaba, entity
    where bill.bill_id = iaba.bill_id
    and   bill.entity_id = entity.entity_id
    and   iaba.ia_id = @ia_id
    order by entity.entity_cd

open entity_cursor
fetch next from entity_cursor into @entity_cd

while (@@FETCH_STATUS = 0)
begin
	if (@entity_list = '')
	begin
		set @entity_list = @entity_cd
	end
	else
	begin
		set @entity_list = @entity_list + ', ' + @entity_cd
	end

	fetch next from entity_cursor into @entity_cd
end

close entity_cursor
deallocate entity_cursor 




declare year_cursor CURSOR FAST_FORWARD
for select distinct sup_tax_yr
    from bill, installment_agreement_bill_assoc iaba
    where bill.bill_id = iaba.bill_id
    and   iaba.ia_id = @ia_id
    order by sup_tax_yr

open year_cursor
fetch next from year_cursor into @sup_tax_yr

while (@@FETCH_STATUS = 0)
begin
	if (@year_list = '')
	begin
		set @year_list = convert(varchar(4), @sup_tax_yr)
	end
	else
	begin
		set @year_list = @year_list + ', ' + convert(varchar(4), @sup_tax_yr)
	end

	fetch next from year_cursor into @sup_tax_yr
end

close year_cursor
deallocate year_cursor 

select top 1 @ia_amt_due = ia_amt_due,
	     @ia_dt_due  = ia_dt_due
from installment_agreement_schedule
where ia_id = @ia_id
order by ia_schedule_id

select top 1  @ia_dt_end  = ia_dt_due
from installment_agreement_schedule
where ia_id = @ia_id
order by ia_schedule_id desc

select
@system_type     = system_type,
@addr_line1 	 = addr_line1,
@addr_line2 	 = addr_line2,
@addr_line3 	 = addr_line3,
@city 		 = city,
@state 		 = state,
@zip 		 = zip,
@cad_id_code 	 = cad_id_code,
@phone_num 	 = phone_Num,
@phone_num2 	 = phone_num2,
@fax_num 	 = fax_num,
@chief_appraiser = chief_appraiser,
@county_name 	 = county_name,
@office_name 	 = office_name,
@url 		 = url
from system_address
where system_type = 'C'



select  ia_id		 = @ia_id,
	file_as_name     = @file_as_name,
	ia_acct_id       = @ia_acct_id,		
        ia_create_dt     = @ia_create_dt,		
	ia_payment_terms = @ia_payment_terms,	
	ia_sched_type    = @ia_sched_type,		
	payer 		 = @payer,			
	entity_list      = @entity_list,		
	year_list        = @year_list,
	ia_amt_due	 = @ia_amt_due,
	ia_dt_due	 = @ia_dt_due,
	system_type      = @system_type,
	addr_line1 	 = @addr_line1,
	addr_line2 	 = @addr_line2,
	addr_line3 	 = @addr_line3,
	city 		 = @city,
	state 		 = @state,
	zip 		 = @zip,
	cad_id_code 	 = @cad_id_code,
	phone_num 	 = @phone_Num,
	phone_num2 	 = @phone_num2,
	fax_num 	 = @fax_num,
	chief_appraiser  = @chief_appraiser,
	county_name 	 = @county_name,
	office_name 	 = @office_name,
	url 		 = @url,
	own_addr_line1   = @own_addr_line1,
        own_addr_line2   = @own_addr_line2,
        own_addr_line3   = @own_addr_line3,
        own_addr_city    = @own_addr_city,
        own_addr_state   = @own_addr_state,
        own_addr_zip     = @own_addr_zip,
        own_is_international = @own_is_international,
	own_country_name = @own_country_name,
	ia_ref_num	 = @ia_ref_num,
	ia_num_months	=  @ia_num_months, -- added to get the num of months PratimaV HS 13886
	ia_dt_end	 = @ia_dt_end

GO

