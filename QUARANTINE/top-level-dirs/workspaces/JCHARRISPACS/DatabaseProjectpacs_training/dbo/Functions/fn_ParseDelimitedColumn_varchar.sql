

/*
User defined function fn_ParseDelimitedColumn:
Input Parameters: 
	@Column: Column that has multi value separated by delimiter.
	@Delimiter: Delimiter that separate the values.
	@Segment: Position of value separated by delimiter.
Return Value:
	The nth segment value designated by @Segment. If @Segment is greater than the number of 
	delimeter, empty string, '', will be returned.
Usage:
	Given a column value, delimiter, and position of the segment to be parsed. The function return
	the segment value.
	For ACAD/ATC conversion:
	Using union to parse all the multi values into individual records. Find out the maximum number 
	of delimiters exist in the target table. Using union to parse all the multi values into 
	individual records in TARGET_TABLE. Some records might not have values after parsing because
	not all records have the maximum number of values. Delete those records that don't have value.
 	See below for example.

	EX: insert into TARGET_TABLE
			select prop_id, dbo.fn_ParseDelimitedColumn(<COLUMN_NAME>, ']', 1) as col from SOURCE_TABLE
			union
			select prop_id, dbo.fn_ParseDelimitedColumn(<COLUMN_NAME>, ']', 2) as col from SOURCE_TABLE
			union
			select prop_id, dbo.fn_ParseDelimitedColumn(<COLUMN_NAME>, ']', 3) as col from SOURCE_TABLE
			union
			select prop_id, dbo.fn_ParseDelimitedColumn(<COLUMN_NAME>, ']', 4) as col from SOURCE_TABLE
			union
			select prop_id, dbo.fn_ParseDelimitedColumn(<COLUMN_NAME>, ']', 5) as col from SOURCE_TABLE
	
			Delete TARGET_TABLE where col = ''
Date: 5/22/2006
By: Michael Ye
*/

			
create function [dbo].[fn_ParseDelimitedColumn_varchar](@Column varchar(8000), @Delimiter char(1), @Segment int)
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

