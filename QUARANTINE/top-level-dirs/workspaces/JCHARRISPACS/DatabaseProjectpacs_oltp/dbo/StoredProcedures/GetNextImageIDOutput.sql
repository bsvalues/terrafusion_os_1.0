
create procedure GetNextImageIDOutput
		@szSubPath varchar(255) output,
		@lImageID int output,
		@szBaseDir varchar(255) output
	
as

set nocount on

declare @szCreateNewFolder varchar(4000)

	begin transaction

	select
		@szSubPath = sub_dir,
		@lImageID = next_picture_id,
		@szBaseDir = base_dir
	from pacs_imaging with(tablockx, holdlock, updlock)

	update pacs_imaging with(tablockx, holdlock)
	set next_picture_id = @lImageID + 1

	if ( (@lImageID % 1000) = 0 )
	begin
		set @szSubPath = convert(varchar(255), convert(int, @szSubPath) + 1)

		set @szCreateNewFolder = 'mkdir "' + @szBaseDir + '\' + @szSubPath + '"'
		exec xp_cmdshell @szCreateNewFolder, no_output

		update pacs_imaging with(tablockx, holdlock)
		set sub_dir = @szSubPath
	end

	commit transaction

set nocount off

GO

