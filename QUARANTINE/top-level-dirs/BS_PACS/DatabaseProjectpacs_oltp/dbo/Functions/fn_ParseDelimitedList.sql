			
CREATE function [dbo].[fn_ParseDelimitedList](@Column varchar(8000), @Delimiter char(1), @Segment int)
returns varchar(8000)
as 
begin
	declare @counter int, @start int, @end int, @SegmentValue varchar(50)
	set @counter = 1
	set @end = 1
	set @start = 1

	if len( isnull(@Column, '') ) > 0 -- If @Column is not empty or null, start the parsing process.
	begin
		while charindex(@Delimiter, @Column, 1) > 0 and @Segment >= @counter-- If @Column contain the delimiter and segment not reached, enter the loop.
		begin
			set @end = charindex(@Delimiter, @Column, 1) -- Find the delimiter position
			
			if @counter = @Segment -- If loop hit the segment, return the segment value.
			begin
				return substring(@Column, @start, @end -1)
			end
			else -- Extract the rest of @Column and increment counter for the next loop.
			begin 
				set @Column = substring(@Column, @end + 1, len(@Column) - @end) 
				set @counter = @counter +1
			end
		end -- while loop
		
		-- @Column doesn't contain delimiter. @Column is only segment.		
		if @counter = @Segment -- The last segment of @Column.
			return @Column
		else  -- @Segment is greater than number of delimiter.
			return ''

	end --if len( isnull(@Column, '') ) > 0 
	else -- If @Column is empty or null, return ''.
		return ''

	return ''
end

GO

