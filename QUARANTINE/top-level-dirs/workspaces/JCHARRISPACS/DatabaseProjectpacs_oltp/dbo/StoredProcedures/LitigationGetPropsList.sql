
create procedure LitigationGetPropsList
	@lLitigationID int,
	@szProps varchar(2048) = null output,
	@bOutputRS bit = 1
as

set nocount on

	declare curProps cursor
	for
		select distinct b.prop_id
		from litigation_statement_assoc as lba with(nolock)
		join bill as b with(nolock) on
			lba.statement_id = b.statement_id and lba.year = b.year
		where
			lba.litigation_id = @lLitigationID
	for read only

	declare @lPropID int

	open curProps
	fetch next from curProps into @lPropID

	declare @lIndex int
	
	set @lIndex = 0
	set @szProps = ''

	while ( @@fetch_status = 0 )
	begin
		if ( @lIndex > 0 )
		begin
			set @szProps = @szProps + ', '
		end

		set @szProps = @szProps + convert(varchar(12), @lPropID)

		set @lIndex = @lIndex + 1

		fetch next from curProps into @lPropID
	end

	close curProps
	deallocate curProps

set nocount off

	if ( @bOutputRS = 1 )
	begin
		select szProps = @szProps
	end

GO

