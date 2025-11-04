
CREATE FUNCTION [dbo].[fn_GetActiveFunds](@as_of_date datetime)
RETURNS TABLE
AS RETURN
	
	SELECT * 
	FROM fund as f with(nolock)
	WHERE isnull(f.begin_date, @as_of_date) <= @as_of_date
	AND isnull(f.end_date, @as_of_date) >= @as_of_date

GO

