
CREATE FUNCTION [dbo].[fn_ReturnTableFromCommaSepValues]
(
	@CommaSeparatedString varchar(max)
)
RETURNS @Table Table (ID varchar(100))
-- This function will separate a comman separated list 
-- and return each value in a single column table
Begin
	Declare @TempStr varchar(max)
	Set @TempStr = @CommaSeparatedString + ','
	While Len(@TempStr) > 0 
	Begin 
		Insert Into @Table Select SubString(@TempStr,1,CharIndex(',',@TempStr)-1)
		Set @TempStr = Right(@TempStr,Len(@TempStr)-CharIndex(',',@TempStr))
	End
        -- now trim leading and trailing blanks for each entry
        UPDATE @Table
           SET ID = LTRIM(RTRIM(ID))

	Return
End

GO

