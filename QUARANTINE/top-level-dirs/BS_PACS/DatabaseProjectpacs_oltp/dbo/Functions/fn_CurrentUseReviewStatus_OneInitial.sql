
CREATE FUNCTION fn_CurrentUseReviewStatus_OneInitial()
RETURNS INT
AS 
BEGIN
	DECLARE @result INT

	SELECT @result = COUNT(*)
	FROM current_use_review_status
		WITH (NOLOCK)
	WHERE initial = 1

	RETURN @result
END

GO

