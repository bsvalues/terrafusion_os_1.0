
create function fn_GetSpaceUsed
(
	@szTableName sysname
)
returns bigint /* space used (both data & indexes) in KB */

as

begin

	declare @lObjectID int

	select @lObjectID = id
	from sysobjects with(nolock)
	where name = @szTableName
	and xtype = 'U'

	if ( @lObjectID is null )
	begin
		return(0)
	end

	declare @lLow bigint
	select @lLow = low
	from master.dbo.spt_values with(nolock)
	where number = 1
	and type = 'E'

	declare @lPages bigint
	select @lPages = sum(used)
	from sysindexes with(nolock)
	where id = @lObjectID
	and indid in (0,1,255)

	declare @lKB bigint
	set @lKB = @lPages * @lLow / 1024

	return(@lKB)

end

GO

