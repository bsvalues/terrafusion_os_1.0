



CREATE  procedure LetterInsert
	@szSystemType varchar(5),
	@szLetterName varchar(50),
	@szLetterDesc varchar(50),
	@szLetterType varchar(10),
	@szEventTypeCode varchar(20) = '',
	@lCopies int = 1
as

set nocount on

	declare
		@lLetterID int,
		@szLetterPath varchar(255)

	/* Determine the server location for letters */
	select
		@szLetterPath = letter_path
	from pacs_system
	where
		system_type in ('A','B')

	/* Insert the letter record and get it's ID */
	insert letter (
		letter_name, letter_desc, event_type_cd, letter_path, letter_creation_dt, letter_type, letter_copies, system_type
	) values (
		@szLetterName, @szLetterDesc, @szEventTypeCode, @szLetterPath, getdate(), @szLetterType, @lCopies, @szSystemType
	)
	set @lLetterID = @@identity

	/* Build the path & file based on the ID, then store */
	set @szLetterPath = @szLetterPath + '\' + convert(varchar(12), @lLetterID) + '.doc'
	update letter set
		letter_path = @szLetterPath
	where
		letter_id = @lLetterID

set nocount off

	select
		lLetterID = @lLetterID,
		szLetterPath = @szLetterPath

GO

