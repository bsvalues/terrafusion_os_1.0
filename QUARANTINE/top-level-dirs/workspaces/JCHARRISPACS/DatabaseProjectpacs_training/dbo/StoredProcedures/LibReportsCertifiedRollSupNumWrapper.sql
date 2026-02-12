
CREATE PROCEDURE LibReportsCertifiedRollSupNumWrapper

	@input_query varchar(6000),
	@input_year numeric(4,0),
	@input_sup_num int

as

declare @szQuery varchar(6000)
declare @szSelect varchar(6000)
declare @lFromIndex int
declare @lOrderByIndex int
declare @lJoinIndex int
declare @strSQL varchar(6000)


set @szQuery = @input_query
set @szSelect = @input_query
set @lFromIndex = charindex('FROM', @szQuery)

/*
 * First strip off the stuff in front of the FROM statement
 */

if @lFromIndex > 0
begin
	set @szQuery = right(@szQuery, len(@szQuery) - @lFromIndex + 1)
end

/*
 * Next, strip off the order by clause
 */

set @lOrderByIndex = charindex('ORDER', @szQuery)

if @lOrderByIndex > 0
begin
	set @szQuery = left(@szQuery, @lOrderByIndex - 1)
end
set @szQuery = 'select distinct poev.prop_id ' + @szQuery

set @szQuery = replace(@szQuery, '"', '''')


/*
 * Now create a supp_assoc table as the user wants the report
 * as of a certain supplement number, so this is necessary to get
 * the latest one.
 */

create table #poev_supp_assoc
(
	prop_id int not null,
	year numeric(4,0) not null,
	sup_num int not null,

	primary key clustered (prop_id, year, sup_num)
	with fillfactor = 100
)

set @strSQL = '
		insert into #poev_supp_assoc
		select
			distinct prop_id, ' + cast(@input_year as varchar(4)) + ', max(sup_num) ' + '
		from prop_owner_entity_val with(nolock)
		where
			sup_yr = ' + cast(@input_year as varchar(4)) + '
			and sup_num <= ' + cast(@input_sup_num as varchar(5))

set @strSQL = @strSQL + ' and prop_id in (' + @szQuery + ') '
set @strSQL = @strSQL + '
		group by prop_id
		order by 3, 1'

	exec(@strSQL)

set @lJoinIndex = charindex('INNER', @szSelect)
if @lJoinIndex <= 0
begin
	set @lJoinIndex = charindex('JOIN', @szSelect)
end

set @szSelect = left(@szSelect, @lJoinIndex - 1) + 'JOIN #poev_supp_assoc as pvsa with (nolock) on poev.prop_id = pvsa.prop_id and poev.sup_yr = pvsa.year and poev.sup_num = pvsa.sup_num ' + right(@szSelect, len(@szSelect) - @lJoinIndex + 1)

set @szSelect = 'SELECT DISTINCT 1 as DumbID, ' + @szSelect
set @szSelect = replace(@szSelect, '"', '''')

--print @szSelect
-- set @new_query = 'SELECT DISTINCT 1 as DumbID, ' + replace(@input_query, '"', '''')
exec(@szSelect)

GO

