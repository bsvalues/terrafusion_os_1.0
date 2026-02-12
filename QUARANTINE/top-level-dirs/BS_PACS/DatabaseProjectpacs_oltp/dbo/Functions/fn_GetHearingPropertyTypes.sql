
CREATE FUNCTION [dbo].[fn_GetHearingPropertyTypes](@lHearingID int)
RETURNS varchar(20)
AS
BEGIN
	-- Declare the return variable here
	DECLARE @result varchar(20)
	SET @result = ''
	
	SELECT @result = @result + 
		(CASE WHEN LEN(@result) > 0 THEN ',' ELSE '' END) + szPropertyType 
	FROM _arb_protest_hearing_property_type 
		WHERE lHearingID = @lHearingID 
		ORDER BY szPropertyType DESC
	
	RETURN @result
END

GO

