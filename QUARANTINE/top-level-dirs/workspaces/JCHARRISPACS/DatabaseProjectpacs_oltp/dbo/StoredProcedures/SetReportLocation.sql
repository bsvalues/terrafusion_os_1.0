
create procedure SetReportLocation

@path varchar(255) = null

AS

set nocount on

if ( @path is null )
begin
	select @path = report_path
	from pacs_system with(nolock)
end

if ( @path is null )
begin
	set @path = ''
end

create table #tmp_srl_custom
(
	type varchar(10) not null,
	primary key clustered (type)
	with fillfactor = 100
)

insert #tmp_srl_custom
select r.type
from report as r
where location like '%\Custom\%'

update report
set
	report.location =
		@path +
		case
			when t.type is not null
			then '\Custom'
			else ''
		end +
		reverse(left(reverse(report.location),charindex('\',reverse(report.location))))
from report
left outer join #tmp_srl_custom as t on
	t.type = report.type

GO

