
CREATE FUNCTION dbo.fn_GetMaxValue
(
	@i1 numeric(14,0),
	@i2 numeric(14,0),
	@i3 numeric(14,0),
	@i4 numeric(14,0),
	@i5 numeric(14,0),
	@i6 numeric(14,0),
	@i7 numeric(14,0),
	@i8 numeric(14,0),
	@i9 numeric(14,0),
	@i10 numeric(14,0),
	@i11 numeric(14,0),
	@i12 numeric(14,0)
)
RETURNS numeric(14,0)
AS
BEGIN
	declare @maximum_value   numeric(14,0)
	/* calculate maximum value */
	SET @maximum_value = 0
	IF (@i1 > @maximum_value)
	BEGIN
		SET @maximum_value = @i1
	END
	IF (@i2 > @maximum_value)
	BEGIN
		SET @maximum_value = @i2
	END
	IF (@i3 > @maximum_value)
	BEGIN
		SET @maximum_value = @i3
	END
	IF (@i4 > @maximum_value)
	BEGIN
		SET @maximum_value = @i4
	END
	IF (@i5 > @maximum_value)
	BEGIN
		SET @maximum_value = @i5
	END
	IF (@i6 > @maximum_value)
	BEGIN
		SET @maximum_value = @i6
	END
	IF (@i7 > @maximum_value)
	BEGIN
		SET @maximum_value = @i7
	END
	IF (@i8 > @maximum_value)
	BEGIN
		SET @maximum_value = @i8
	END
	IF (@i9 > @maximum_value)
	BEGIN
		SET @maximum_value = @i9
	END
	IF (@i10 > @maximum_value)
	BEGIN
		SET @maximum_value = @i10
	END
	IF (@i11 > @maximum_value)
	BEGIN
		SET @maximum_value = @i11
	END
	IF (@i12 > @maximum_value)
	BEGIN
		SET @maximum_value = @i12
	END
	
	RETURN (@maximum_value)
END

GO

