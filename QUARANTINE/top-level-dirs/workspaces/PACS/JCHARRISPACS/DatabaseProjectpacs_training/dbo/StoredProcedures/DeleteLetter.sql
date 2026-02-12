


CREATE PROCEDURE DeleteLetter

	@letter_id int

AS

	DELETE 
	FROM letter
	WHERE letter_id = @letter_id

GO

