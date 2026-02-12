
create procedure PenpadUpdateNextIDs

as

set nocount on

	/* This should only be run on the penpad laptop */
	if ( db_name() <> 'penpad' )
	begin
		return(-1)
	end

	declare @szTableName sysname

	declare curNextIDs cursor
	for
		select distinct szTableName
		from penpad_table_ids
		where
			szTableRef is null and
			szColumnRef is null
	for read only

	open curNextIDs
	fetch next from curNextIDs into @szTableName

	while ( @@fetch_status = 0 )
	begin
		update next_unique_id
		set id = id + 100000
		where id_name = @szTableName

		fetch next from curNextIDs into @szTableName
	end

	close curNextIDs
	deallocate curNextIDs

set nocount off

GO

