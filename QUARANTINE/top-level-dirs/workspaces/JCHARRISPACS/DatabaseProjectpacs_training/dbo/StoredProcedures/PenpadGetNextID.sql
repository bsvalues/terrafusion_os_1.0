
create procedure PenpadGetNextID
	@szTableName sysname,
	@szColumnName sysname,
	@lNextID int = null output
as

set nocount on

	set @lNextID = null

	if (@szTableName = 'pacs_image')
	begin
		begin transaction

		select
			@lNextID = next_picture_id
		from pacs_imaging with(tablockx, holdlock, updlock)

		update pacs_imaging with(tablockx, holdlock)
		set next_picture_id = @lNextID + 1
		
		commit transaction
	end
	else
	begin
		if exists (
			select *
			from penpad_table_ids
			where szTableName = @szTableName and szColumnName = @szColumnName
			and szTableRef is null and szColumnRef is null
		)
		begin
			exec dbo.GetUniqueID @szTableName, @lNextID output, 1, 0
		end
	end
	
set nocount off

	select lNextID = @lNextID

GO

