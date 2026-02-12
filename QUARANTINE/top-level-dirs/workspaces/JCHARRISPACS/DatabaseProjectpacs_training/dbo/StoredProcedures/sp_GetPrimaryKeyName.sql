
create procedure sp_GetPrimaryKeyName
	@szTableName sysname,
	@szPKName sysname = null output
as

set nocount on

	declare @lTableID int
	set @lTableID = object_id(@szTableName)

	set @szPKName = null
	select
		@szPKName = so.name
	from sysconstraints as sc with(nolock)
	join sysobjects as so with(nolock) on
		sc.constid = so.id
	where
		sc.id = @lTableID and
		(sc.status & 15) = 1

set nocount off

GO

