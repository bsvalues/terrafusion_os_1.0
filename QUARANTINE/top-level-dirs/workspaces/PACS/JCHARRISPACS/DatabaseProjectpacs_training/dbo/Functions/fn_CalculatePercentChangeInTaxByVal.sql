
 
CREATE  FUNCTION fn_CalculatePercentChangeInTaxByVal  ( @prev_val NUMERIC(28,13),
                                                        @current_val NUMERIC(28,13) )  
RETURNS NUMERIC(28,13)
AS
BEGIN
	declare @resultVal NUMERIC(28,13)
	set @resultVal = NULL
	--
    if (@prev_val IS NULL OR @current_val IS NULL ) 
    BEGIN
        select @resultVal = NULL
    END
    ELSE
    IF (@prev_val=0)
        BEGIN
            IF (@current_val=0)
            BEGIN
               SELECT @resultVal = 0.00
            END
            ELSE
            BEGIN
               SELECT @resultVal = 100.00
            END
        END
    ELSE 
    IF (@current_val=0)
        BEGIN
            select @resultVal = (-100.00)
        END
    ELSE
        BEGIN
            select @resultVal = (100* (@current_val - @prev_val) / @prev_val)
        END 
	--	 
	RETURN (@resultVal)
END

GO

