
create procedure GetNextImageID

as

set nocount on

	declare
		@szSubPath varchar(255),
		@lImageID int,
		@szBaseDir varchar(255),
		@szCreateNewFolder varchar(4000),
		@maxImageID int

	begin transaction

	select
		@szSubPath = sub_dir,
		@lImageID = next_picture_id,
		@szBaseDir = base_dir
	from pacs_imaging with(tablockx, holdlock, updlock)

	select @maxImageID = max(image_id)+1 from pacs_image with(tablockx, holdlock)
	
	if (@maxImageID > @lImageID) set @lImageID = @maxImageID

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

	select
		szSubPath = @szSubPath,
		lImageID = @lImageID,
		szBaseDir = @szBaseDir

GO

