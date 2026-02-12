

create procedure PenpadDeleteReferenceProps

as

set nocount on

	if ( db_name() <> 'penpad' )
	begin
		/* This would be terrible to run on a pacsserver */
		return(-1)
	end

	declare @lPropID int

	declare curProps insensitive cursor
	for
		select prop_id
		from property
		where
			reference_flag = 'T'
	for read only

	open curProps
	fetch next from curProps into @lPropID

	while ( @@fetch_status = 0 )
	begin
		exec DeleteProperty @lPropID

		fetch next from curProps into @lPropID
	end

	close curProps
	deallocate curProps

	return(0)

set nocount off

GO

