
CREATE FUNCTION [dbo].[fn_GetSplitIntoProperties] ( @input_prop_id int )
RETURNS varchar(2048)

AS

BEGIN

	declare @split_into_props varchar(2048)
	declare @split_prop_id int

	set @split_into_props = ''

	declare splitCursor CURSOR FAST_FORWARD
	FOR select distinct child_id
		from split_into as si
		with (nolock)
		where parent_id = @input_prop_id

	OPEN splitCursor

	FETCH NEXT FROM splitCursor into @split_prop_id

	WHILE @@FETCH_STATUS = 0
	BEGIN
		if len(@split_into_props) > 0
		begin
			set @split_into_props = @split_into_props + ','
		end

		set @split_into_props = @split_into_props + rtrim(convert(varchar(12), @split_prop_id))

		FETCH NEXT FROM splitCursor into @split_prop_id
	END

	CLOSE splitCursor
	DEALLOCATE splitCursor

	return (@split_into_props)

END

GO

