
create procedure LitigationGetOwnerList
	@lLitigationID int,
	@szOwners varchar(2048) = null output,
	@bOutputRS bit = 1
as

set nocount on

	declare curOwners cursor
	for
		select distinct co.file_as_name
		from litigation_statement_assoc as lba with(nolock)
		join bill as b with(nolock) on
			lba.statement_id = b.statement_id and lba.year = b.year
		join curr_tax_property_owner_vw as co with(nolock) on
			b.prop_id = co.owner_prop_id
		where
			lba.litigation_id = @lLitigationID
	for read only

	declare @szOwner varchar(70)

	open curOwners
	fetch next from curOwners into @szOwner

	declare @lIndex int
	
	set @lIndex = 0
	set @szOwners = ''

	while ( @@fetch_status = 0 )
	begin
		if ( @lIndex > 0 )
		begin
			set @szOwners = @szOwners + ' ; '
		end

		set @szOwners = @szOwners + @szOwner

		set @lIndex = @lIndex + 1

		fetch next from curOwners into @szOwner
	end

	close curOwners
	deallocate curOwners

set nocount off

	if ( @bOutputRS = 1 )
	begin
		select szOwners = @szOwners
	end

GO

