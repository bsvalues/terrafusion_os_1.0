


CREATE PROCEDURE LetterPrinters 
	@machine_name varchar(50),
	@letter_type varchar(20) = ''

AS
	BEGIN
		IF @letter_type = 'ARB'
		BEGIN
			SELECT 
				letter.letter_id, 
				letter.letter_name, 
				letter.letter_desc, 
				letter.letter_type, 
				letter_printers.machine_name, 
				letter_printers.printer_name
			FROM letter letter
			LEFT OUTER JOIN letter_printers letter_printers ON
			letter.letter_id = letter_printers.letter_id and
			letter_printers.machine_name = @machine_name
			WHERE
			(letter.letter_type='AP' OR letter.letter_type='AI')
			AND (letter_printers.machine_name is null OR letter_printers.machine_name = '' OR letter_printers.machine_name = @machine_name)
			ORDER BY letter.letter_type
		END
		ELSE IF @letter_type = 'ARBITRATION'
		BEGIN
			SELECT 
				letter.letter_id, 
				letter.letter_name, 
				letter.letter_desc, 
				letter.letter_type, 
				letter_printers.machine_name, 
				letter_printers.printer_name
			FROM letter letter
			LEFT OUTER JOIN letter_printers letter_printers ON
			letter.letter_id = letter_printers.letter_id and
			letter_printers.machine_name = @machine_name
			WHERE
			letter.letter_type like 'AR_%'
			AND (letter_printers.machine_name is null OR letter_printers.machine_name = '' OR letter_printers.machine_name = @machine_name)
			ORDER BY letter.letter_type
		END
	END

GO

