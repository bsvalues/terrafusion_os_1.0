






CREATE      procedure RecapDTR

@input_pacs_user_id		int,
@input_entity_list	varchar(1000),
@input_month		int,
@input_year		numeric(4),
@input_begin_dt		varchar(50) = '',
@input_end_dt		varchar(50) = ''

as


declare @begin_dt	datetime
declare @end_dt		datetime
declare @entity_id	int

if (@input_month <> 0)
begin
	select  @begin_dt = begin_date,
		@end_dt   = end_date
	from recap_month
	where tax_month = @input_month
	and   tax_yr    = @input_year
end
else
begin
	set @begin_dt = @input_begin_dt
	set @end_dt   = @input_end_dt
end

exec DTRBuild @input_pacs_user_id, @input_entity_list, @end_dt, 'T'

declare @strDelete varchar(500)

set @strDelete = 'delete from recap_balance where type = ''DTR'' '
set @strDelete = @strDelete + ' and   tax_month = ' + convert(varchar(10), @input_month)
set @strDelete = @strDelete + ' and   tax_yr    = ' + convert(varchar(4),  @input_year)
set @strDelete = @strDelete + ' and   recap_balance.entity_id in (' + @input_entity_list + ')'
	
exec (@strDelete)

insert into recap_balance
(
type,
entity_id,
tax_month,
tax_yr,
balance
)
select 'DTR',
	entity_id,
	@input_month,
	@input_year,
	sum(base_tax_due)
from delq_roll_totals
where pacs_user_id = @input_pacs_user_id
group by entity_id

GO

