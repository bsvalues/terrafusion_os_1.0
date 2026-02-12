

CREATE PROCEDURE IAInsertLetter
	@ia_id int,
	@letter_id int,
	@pacs_user_id int,
	@create_dt datetime,
	@app_location varchar(4),
	@path_location varchar(256)
AS

SET NOCOUNT ON

	SET	@create_dt = ISNULL(@create_dt, GETDATE())

	INSERT	installment_agreement_letter_history
		(
		ia_id,
		letter_id,
		pacs_user_id,
		create_dt,
		app_location,
		path_location
		)

	VALUES
		(
		@ia_id,
		@letter_id,
		@pacs_user_id,
		@create_dt,
		@app_location,
		@path_location
		)

SET NOCOUNT OFF

	SELECT create_dt = @create_dt

GO

