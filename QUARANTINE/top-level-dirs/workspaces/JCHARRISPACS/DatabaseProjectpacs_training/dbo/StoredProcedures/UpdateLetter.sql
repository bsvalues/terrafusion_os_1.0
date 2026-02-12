
CREATE PROCEDURE UpdateLetter

	@letter_id int = 0,
	@letter_name varchar(50),
	@letter_desc varchar(50),
	@event_type varchar(20),
	@letter_Type varchar(10),
	@letter_copies int,
	@system_type varchar(5)

AS

SET NOCOUNT ON

	declare @new_letter_id int


	IF NOT(EXISTS(SELECT letter_id
					FROM letter
					WHERE letter_id = @letter_id))
	BEGIN
		declare @nextID bigint
		exec GetUniqueID 'letter', @nextID output
		
		set @new_letter_id = convert(int, @nextID)

		INSERT INTO letter
		(letter_id, letter_name, letter_desc, event_type_cd, create_dt, letter_type, letter_copies, system_type)
		VALUES
		(@new_letter_id, @letter_name, @letter_desc, @event_type, getdate(), @letter_Type, @letter_copies, @system_type)
	END

	ELSE
	BEGIN
		UPDATE letter
		SET letter_name = @letter_name,
			letter_desc = @letter_desc,
			event_type_cd = @event_type,
			letter_type = @letter_Type,
			letter_copies = @letter_copies,
			system_type = @system_type
		WHERE letter_id = @letter_id

		set @new_letter_id = @letter_id
	END

SET NOCOUNT OFF

	select letter_id = @new_letter_id

GO

