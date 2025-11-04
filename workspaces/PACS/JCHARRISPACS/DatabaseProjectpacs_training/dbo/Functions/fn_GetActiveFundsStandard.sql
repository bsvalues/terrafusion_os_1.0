
CREATE FUNCTION [dbo].[fn_GetActiveFundsStandard]()
RETURNS TABLE
AS RETURN
	
SELECT * 
	FROM fund as f with(nolock)
	WHERE isnull(f.begin_date, '1/1/' + cast(f.year + 1 as varchar(4))) <= 
		'1/1/' + cast(f.year + 1 as varchar(4))
	AND isnull(f.end_date, '1/1/' + cast(f.year + 1 as varchar(4))) >= 
		'1/1/' + cast(f.year + 1 as varchar(4))

GO

