


create procedure ARBInsertLetter
	@lPropValYr numeric(4,0),
	@lCaseID int,
	@szARBType varchar(2),
	@lLetterID int,
	@lPacsUserID int,
	@dtCreate datetime,
	@szAppLocation varchar(4),
	@szPathLocation varchar(256),
	@dtMail datetime,
	@lProtByID int,

	@lBatchID int = 0
as

set nocount on

	set @dtCreate = isnull(@dtCreate, getdate())
	set @dtMail = isnull(@dtMail, @dtCreate)

	insert _arb_letter_history (
		lPropValYr, lCaseID, szARBType, lLetterID, lPacsUserID, dtCreate, szAppLocation, szPathLocation, dtMail, lProtByID, lBatchID
	) values (
		@lPropValYr, @lCaseID, @szARBType, @lLetterID, @lPacsUserID, @dtCreate, @szAppLocation, @szPathLocation, @dtMail, @lProtByID, @lBatchID
	)

set nocount off

	select dtCreate = @dtCreate, @@identity as ID, dtMail = @dtMail

GO

