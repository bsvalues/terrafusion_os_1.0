







CREATE PROCEDURE [dbo].[CreateCertMailUse]

	@ret_type int,
    @cert_mail_cd_out varchar(50) OUTPUT,
	@return_result_set bit = 0

as

-- If @ret_type is 0, then we will return the current cert mail id, calculate the next and change the table
-- If @ret_type is 1, then we will calculate the current id, return our calculated one and DO NOT change the table.

declare @next_mail_id int
declare @first_mail_id int
declare @last_mail_id int
declare @cert_mail_cd varchar(50)
declare @serv_type varchar(5)
declare @cust_id varchar(16)

declare @next_id_str varchar(9)
declare @next_id_rev_str varchar(19)
declare @idx int
declare @digit int
declare @sum int
declare @check_digit int
declare @next_cert_mail_cd varchar(50)

declare @full_cert_num varchar(50)
declare @coded_cert_num varchar(50)
declare @bc_char char(1)
declare @digit_char varchar(7)
DECLARE @multiplier int
declare @pass int

select @pass = 0

WHILE @pass < 100
BEGIN

	SELECT TOP 1
	@next_mail_id = next_cert_mail_id,
	@first_mail_id = first_mail_id,
	@last_mail_id = last_mail_id,
	@cert_mail_cd = cert_mail_cd,
	@serv_type = serv_type,
	@cust_id = cust_id
	FROM next_cert_mail_id

	IF @ret_type = 0
	BEGIN
	SELECT @next_mail_id = @next_mail_id +1
	END

	IF @next_mail_id > @last_mail_id
	BEGIN
	SELECT @next_mail_id = @first_mail_id
	END

	-- Get check digit
	SELECT @next_id_str = CAST(@next_mail_id as VARCHAR(9))

	WHILE LEN(@next_id_str)<8
	BEGIN
	SELECT @next_id_str = '0' + @next_id_str
	END

	SELECT @next_id_rev_str = REVERSE(@serv_type + @cust_id + @next_id_str)
	SELECT @sum = 0

	select @idx = 1
	WHILE @idx<=LEN(@next_id_rev_str)
	BEGIN 

	SELECT @digit = CAST(SUBSTRING(@next_id_rev_str,@idx,1) AS INT)

	IF @idx %2 <> 0
	BEGIN
	   SELECT @digit =  @digit *3
	   /*IF @digit > 9
	   BEGIN
		  SELECT @digit = @digit - 9
	   END*/
	END

	SELECT @sum = @sum + @digit

	SELECT @idx = @idx + 1
	END

	SELECT @check_digit = ((((@sum/10) + 1)*10)-@sum)%10

	-- Next ID
	SELECT @next_cert_mail_cd = @serv_type + @cust_id + @next_id_str + cast(@check_digit as char(1))

	------------ Create an CM Number that does not contain the char '^'
             ------------- It causes Word to crash sometimes
		---------------------------------------------------------------
		-- Calc 128C bar code

		-- get rid of spaces
		SELECT @full_cert_num = REPLACE(@cert_mail_cd,' ','')

		-- start barcode
		exec Get128BarCodeMapping 'start c','c',@char_out = @bc_char OUTPUT
		SELECT @coded_cert_num = @bc_char

		-- MOD 103 checksum calc
		SELECT @idx = 1
		SELECT @multiplier = 1
		SELECT @sum = 105 -- start C value
		WHILE @idx <= len(@full_cert_num)
		BEGIN
			SELECT @digit_char = SUBSTRING(@full_cert_num,@idx,2)
			exec Get128BarCodeMapping @digit_char,'c',@char_out = @bc_char OUTPUT
			SELECT @coded_cert_num = @coded_cert_num + @bc_char

			SELECT @digit = CAST(@digit_char AS INT)
			SELECT @sum = @sum + (@digit * @multiplier)
			SELECT @idx = @idx + 2
			SELECT @multiplier = @multiplier + 1
		END

		SELECT @sum = @sum % 103
		-- END MOD 103

		-- add sum and  stop character
		SELECT @digit_char = STR(@sum,4,0)
		exec Get128BarCodeMapping @digit_char,'c',@char_out = @bc_char OUTPUT
		SELECT @coded_cert_num = @coded_cert_num + @bc_char
		exec Get128BarCodeMapping 'stop','c',@char_out = @bc_char OUTPUT
		SELECT @coded_cert_num = @coded_cert_num + @bc_char

                          -- Allow trying 100 times to create the CM Number
		Select @pass = @pass + 1
    
                          -- if '^' character is not in the barcode value, allow the process to pass
		IF CHARINDEX('^', @coded_cert_num) = 0
		BEGIN
		   Select @pass = 100
		END

	------------



	--split with spaces
	SELECT  @next_cert_mail_cd = SUBSTRING(@next_cert_mail_cd,1,4) + ' ' + SUBSTRING(@next_cert_mail_cd,5,4) + ' ' + SUBSTRING(@next_cert_mail_cd,9,4) + ' ' + SUBSTRING(@next_cert_mail_cd,13,4) + ' ' + SUBSTRING(@next_cert_mail_cd,17,4)

	IF @ret_type = 0
	BEGIN

	  DELETE FROM next_cert_mail_id WHERE next_cert_mail_id = @next_mail_id - 1
	  INSERT next_cert_mail_id
	  values (@next_mail_id, @first_mail_id, @last_mail_id, @next_cert_mail_cd,@serv_type,@cust_id)

	  select @cert_mail_cd_out = @cert_mail_cd
	END
	ELSE
	BEGIN
	  select @cert_mail_cd_out = @next_cert_mail_cd
	END

	if @return_result_set = 1
	begin
	  select resultset = @cert_mail_cd_out
	end
END

--UPDATE ##certified_mailer 
--        SET cert_mail_cd = @cert_mail_cd_out
--  WHERE case_id = @case_id AND prop_val_yr = @prop_val_yr AND session_id = @spid


--SELECT TOP 1
--      @cert_mail_cd as cert_mail_cd,
--      REPLACE(@cert_mail_cd,' ','') as cert_mail_num

GO

