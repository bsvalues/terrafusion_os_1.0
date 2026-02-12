
CREATE FUNCTION fn_GetAgentPhoneNums ( @input_agent_id int  )
RETURNS varchar(100)
AS
BEGIN
	declare @phone_number varchar(100)
	declare @temp varchar(30)
	--LOOP
	set @phone_number = ''
	DECLARE PHONE_CSR CURSOR FOR
	SELECT phone_num FROM phone WHERE acct_id = @input_agent_id AND phone_type_cd = 'B'
	OPEN PHONE_CSR 
	FETCH NEXT FROM PHONE_CSR INTO @temp
	WHILE @@FETCH_STATUS = 0
	BEGIN 
		SELECT @phone_number = @phone_number + CHAR(9) + @temp  
		FETCH NEXT FROM PHONE_CSR INTO @temp
	END
	CLOSE PHONE_CSR
	DEALLOCATE PHONE_CSR

	RETURN (@phone_number)
END

GO

