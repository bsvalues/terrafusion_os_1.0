
create procedure AnnualAuditorReportDataGenerator

	@dataset_id int,
	@property_types varchar(50),
	@tax_years varchar(100),
	@select_years varchar(200),
	@sort_option varchar(50)
	
as

declare @sql varchar(4000)

set @sql = '
declare @prop_table table
(prop_id int, base_tax_due numeric(14,2), owner_name varchar(70),
 PRIMARY KEY (prop_id)
)

insert ##annual_auditor_report_options
(dataset_id, [year], sort_option)
values
(' + convert(varchar, @dataset_id) + ', ''' + @tax_years + ''', ''' + @sort_option + ''')

insert @prop_table
(prop_id, base_tax_due, owner_name)

select p.prop_id, 0, a.file_as_name
from property as p
with (nolock) 
join account as a
with (nolock)
on p.col_owner_id = a.acct_id
join current_year_property_type_ioll_vw as cypt
with (nolock)
on p.prop_id = cypt.prop_id '

if len(@property_types) > 0
begin
	set @sql = @sql + 'where cypt.property_type in (''' + replace(@property_types, '~', ''',''') + ''') '
end

set @sql = @sql + '
update @prop_table
set base_tax_due = base_tax_due + t.total_due
from @prop_table as p
join
(
	select b.prop_id, sum(b.current_amount_due - b.amount_paid) as total_due
	from bill as b
	with (nolock)
	join @prop_table as pt
	on b.prop_id = pt.prop_id
	where b.[year] in (' + @select_years + ')
	and b.amount_paid < b.current_amount_due
	group by b.prop_id
) as t
on p.prop_id = t.prop_id

update @prop_table
set base_tax_due = base_tax_due + t.total_due
from @prop_table as p
join
(
	select fpv.prop_id, sum(f.current_amount_due - f.amount_paid) as total_due
	from fee as f
	with (nolock)
	join fee_property_vw as fpv
	with (nolock)
	on f.fee_id = fpv.fee_id
	join @prop_table as pt
	on fpv.prop_id = pt.prop_id
	where f.[year] in (' + @select_years + ')
	and f.amount_paid < f.current_amount_due
	group by fpv.prop_id
) as t
on p.prop_id = t.prop_id

delete
from @prop_table
where base_tax_due = 0

if ''' + @sort_option + ''' = ''Property IDs''
begin
	insert ##annual_auditor_report
	(dataset_id, [year], prop_id, owner_name, base_tax_due)

	select ' + convert(varchar, @dataset_id) + ', 0, prop_id, owner_name, base_tax_due
	from @prop_table
	order by prop_id
end

else if ''' + @sort_option + ''' = ''Base Tax Amount [Descending]''
begin
	insert ##annual_auditor_report
	(dataset_id, [year], prop_id, owner_name, base_tax_due)

	select ' + convert(varchar, @dataset_id) + ', 0, prop_id, owner_name, base_tax_due
	from @prop_table
	order by base_tax_due desc
end

else
begin
	insert ##annual_auditor_report
	(dataset_id, [year], prop_id, owner_name, base_tax_due)

	select ' + convert(varchar, @dataset_id) + ', 0, prop_id, owner_name, base_tax_due
	from @prop_table
	order by owner_name
end

'

exec(@sql)

GO

