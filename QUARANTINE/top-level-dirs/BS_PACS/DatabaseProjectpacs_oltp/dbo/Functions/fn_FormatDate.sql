
CREATE FUNCTION fn_FormatDate ( @date datetime,
                                @bDoTime int  = 0 )
RETURNS varchar(30)
AS
BEGIN
	declare @output_date   varchar(30)
	select @output_date = CAST( DATEPART(month, @date) AS VARCHAR(2)) + '/' +
                          CAST( DATEPART(day,   @date) AS VARCHAR(2)) + '/' +
                          CAST( DATEPART(year,  @date) AS VARCHAR(4))  
    if (@bDoTime=1)
	BEGIN
		declare @time varchar(15)
		declare @qr   varchar(2)
		declare @hour int

		select @qr = 'AM'
	    select @hour = DATEPART(hour, @date)
        if (@hour>12)  
	    BEGIN
			select @hour = @hour-12
			select @qr   = 'PM'
		END
        select @time = CAST( @hour AS VARCHAR(2)) + ':' +
                       CAST( DATEPART(minute,  @date) AS VARCHAR(2)) + ' ' + @qr

	    SELECT @output_date =  @output_date + ' ' + @time
	END--if
	 
	RETURN (@output_date)
END

GO

