
CREATE PROCEDURE UpdateImportExportFieldLength
	@definition varchar(50),
	@field varchar(127),
	@length int
AS

	DECLARE @definition_name varchar(50)

	--Cursor current row variables
	DECLARE @cur_field_row_num int
	DECLARE @cur_field_name varchar(127)
	DECLARE @cur_field_start_pos int
	DECLARE @cur_field_length int

	--Variables for the field who's length and start pos is going to adjusted
	DECLARE @field_row_num int
	DECLARE @field_name varchar(127)
	DECLARE @field_new_start_pos int
	DECLARE @field_new_length int

	--Variables for the other fields who's start pos is going to adjusted due
	DECLARE @other_field_row_num int
	DECLARE @other_field_name varchar(127)
	DECLARE @other_field_start_pos int
	DECLARE @other_field_length int

	--Variable to store difference of the field start pos
	DECLARE @start_pos_adjustment int

	DECLARE @field_found bit
	SET @field_found = 0

	SET @definition_name = @definition
	SET @field_name = @field
	SET @field_new_length = @length

	--Input parameter validation
	IF (@definition_name = '')
	BEGIN
		RAISERROR('Invalid definition name for import/export',16,1)
		RETURN
	END

	IF (@field_name = '')
	BEGIN
		RAISERROR('Invalid field name for import/export',16,1)
		RETURN
	END

	IF (@field_new_length <= 0)
	BEGIN
		RAISERROR('Invalid field length for import/export',16,1)
		RETURN
	END

	IF NOT EXISTS(SELECT * FROM import_export_defs WHERE definition_name = @definition_name AND field_name = @field_name)
	BEGIN
		RAISERROR('Invalid definition or field name for import/export',16,1)
		RETURN
	END

	SET NOCOUNT ON

	DECLARE cur CURSOR 
	FOR 
		SELECT 
			ROW_NUMBER() OVER(ORDER BY start_pos ASC) AS row_num,
			field_name, 
			start_pos, 
			length 
		FROM 
			import_export_defs 
		WHERE 
			definition_name  =  @definition_name

	FOR 
		UPDATE OF start_pos, length;

	OPEN cur;
	
		--Fetching first record
		FETCH NEXT FROM cur INTO @cur_field_row_num, @cur_field_name, @cur_field_start_pos, @cur_field_length 
	
		WHILE @@FETCH_STATUS = 0
		BEGIN

			IF (@cur_field_name = @field_name)
				BEGIN
				
					SET @field_found = 1
					SET @field_row_num = @cur_field_row_num
					SET @start_pos_adjustment = @field_new_length - @cur_field_length

					UPDATE 
						import_export_defs 
					SET 
						length = @field_new_length
					WHERE field_name = @field_name AND definition_name = @definition_name
				
				END
			ELSE IF (@field_found = 1)
				BEGIN
				
					SET @other_field_row_num = @cur_field_row_num

					IF (@other_field_row_num > @field_row_num)
					BEGIN
						UPDATE 
							import_export_defs 
						SET 
							start_pos =  @cur_field_start_pos + @start_pos_adjustment
						WHERE field_name = @cur_field_name AND definition_name = @definition_name
					END 
				END

			--Fetching next record
			FETCH NEXT FROM cur INTO @cur_field_row_num, @cur_field_name, @cur_field_start_pos, @cur_field_length 
		END

	CLOSE cur;
	DEALLOCATE cur;

GO

