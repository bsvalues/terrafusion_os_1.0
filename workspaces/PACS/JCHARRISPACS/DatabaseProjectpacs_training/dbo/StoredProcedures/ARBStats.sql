
CREATE procedure ARBStats

@begin_date	datetime,
@end_date	datetime

as

declare @date		datetime
declare @day		int


create table #arb_stats 
(
DDay		int,
Dt		datetime null,
Counter		int null,
Fax		int null,
Mail		int null,
District	int null,
Phone		int null,
TU		int null,
total_inq	int null,
protest		int null
)

--set @begin_date = '05/05/2003'
--set @end_date   = '07/01/2003'

set @date = @begin_date
set @day = 1

while (@date < @end_date)
begin

	declare @temp_date	datetime
	declare @Counter	int
	declare @Fax		int
	declare @Mail		int
	declare @District	int
	declare @Phone		int
	declare @TU		int
	declare @protest	int
	
	set @temp_date = dateadd(dd, 1, @date)

	select @Counter = count(*) from _arb_inquiry with (nolock)
	where inq_create_dt >= @date
	and   inq_create_dt <  @temp_date
	and   inq_type = 'C'

	select @Fax = count(*) from _arb_inquiry   with (nolock)
	where inq_create_dt >= @date
	and   inq_create_dt <  @temp_date
	and   inq_type = 'F'

	select @Mail = count(*) from _arb_inquiry  with (nolock)
	where inq_create_dt >= @date
	and   inq_create_dt <  @temp_date
	and   inq_type = 'M'

	select @District = count(*) from _arb_inquiry  with (nolock)
	where inq_create_dt >= @date
	and   inq_create_dt <  @temp_date
	and   inq_type = 'AD'

	select @Phone = count(*) from _arb_inquiry  with (nolock)
	where inq_create_dt >= @date
	and   inq_create_dt <  @temp_date
	and   inq_type = 'P'

	select @TU = count(*) from _arb_inquiry  with (nolock)
	where inq_create_dt >= @date
	and   inq_create_dt <  @temp_date
	and   inq_type = 'TU'

	select @protest = count(*) from _arb_protest  with (nolock)
	where prot_create_dt >= @date
	and   prot_create_dt <  @temp_date

	insert into #arb_stats 
	values
	(
	@day,
	@date,
	@counter,
	@fax,
	@mail,
	@district,
	@phone,
	@TU,
	@counter + @fax + @mail + @district + @phone + @tu,
	@protest
	)
		
	set @day =  @day + 1
	
	set @date = dateadd(dd, 1, @date)
end
	
select 
convert(varchar(15), Dt, 101) as 'Date',	
DDay		as 'Day',	
Counter		as 'Counter',	
Fax		as 'Fax',	
Mail		as 'Mail',
District	as 'District',
Phone		as 'Phone',
TU		as 'Taxing Unit',
total_inq	as 'Total Inquiry',
protest		as 'Total Protest'
From #arb_stats


drop table #arb_stats

GO

