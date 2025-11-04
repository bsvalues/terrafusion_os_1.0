

CREATE procedure LetterTemplateInsert
	@szComputerName varchar(50),
	@szTemplateName varchar(50),
	@szLetterType varchar(10)
as

set nocount on

	declare
		@lLetterID int

	insert letter_template (
		computername, template_name, template_datetime, template_type
	) values (
		@szComputerName, @szTemplateName,  getdate(), @szLetterType
	)
	set @lLetterID = @@identity

set nocount off

	select
		lLetterID = @lLetterID

GO

