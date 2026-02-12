


CREATE FUNCTION fn_SelectAddress (@val int, @a2 varchar(30), @a3 varchar(30), 
				@a4 varchar(30), @a5 varchar(30))
RETURNS varchar(30)
AS
BEGIN
	/* calculate maximum value */
	
	declare @addr1 varchar(30),
		@addr2 varchar(30),
		@addr3 varchar(30),
		@addr1_ofst int,
		@addr2_ofst int,
		@addr3_ofst int,
		@addr	varchar(30)

	SET @addr1_ofst = 0
	SET @addr2_ofst = 0
	SET @addr3_ofst = 0
	
	
	IF(len(rtrim(isnull(@a2, ''))) > 0 )
	BEGIN
		IF( @addr1_ofst = 0)
		BEGIN
			SET @addr1 = @a2
			SET @addr1_ofst = 2
		END
		ELSE
		BEGIN
			SET @addr2 = @a2
			SET @addr2_ofst = 2
		END
	END	
	IF(len(rtrim(isnull(@a3, ''))) > 0 )
	BEGIN
		IF( @addr1_ofst = 0)
		BEGIN
			SET @addr1 = @a3
			SET @addr1_ofst = 3
		END
		ELSE
		IF( @addr2_ofst = 0)
		BEGIN
			SET @addr2 = @a3
			SET @addr2_ofst = 3
		END
		ELSE
		IF( @addr3_ofst = 0)
		BEGIN
			SET @addr3 = @a3
			SET @addr3_ofst = 3
		END
		
	END
	IF(len(rtrim(isnull(@a4, ''))) > 0 )
	BEGIN
		IF( @addr1_ofst = 0)
		BEGIN
			SET @addr1 = @a4
			SET @addr1_ofst = 4
		END
		ELSE
		IF( @addr2_ofst = 0)
		BEGIN
			SET @addr2 = @a4
			SET @addr2_ofst = 4
		END
		ELSE
		IF( @addr3_ofst = 0)
		BEGIN
			SET @addr3 = @a4
			SET @addr3_ofst = 4
		END
	END	
	IF(len(rtrim(isnull(@a5, ''))) > 0 )
	BEGIN
		IF( @addr1_ofst = 0)
		BEGIN
			SET @addr1 = @a5
			SET @addr1_ofst = 5
		END
		ELSE
		IF( @addr2_ofst = 0)
		BEGIN
			SET @addr2 = @a5
			SET @addr2_ofst = 5
		END
		ELSE
		IF( @addr3_ofst = 0)
		BEGIN
			SET @addr3 = @a5
			SET @addr3_ofst = 5
		END
	END
	IF( @val = 1)
	BEGIN
		SET @addr = @addr1
	END
	ELSE
	IF( @val = 2 )
	BEGIN
		SET @addr = @addr2
	END
	ELSE
	IF( @val = 3 )
	BEGIN
		SET @addr = @addr3
	END
	RETURN (@addr)
END

GO

