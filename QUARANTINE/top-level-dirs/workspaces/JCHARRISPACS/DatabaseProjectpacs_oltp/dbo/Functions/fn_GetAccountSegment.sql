
CREATE FUNCTION [dbo].fn_GetAccountSegment (@account_number varchar(255), @segment_number int)
RETURNS varchar(255)
AS
BEGIN
	declare @char_separator varchar(1)
	declare @string_piece varchar(255)
	declare @return_piece varchar(255)

	select @char_separator = szConfigValue 
	from pacs_config where szGroup = 'SYSTEM' and szConfigName = 'Account Number Separator'

	if @char_separator is null
	begin
		set @char_separator = '.'
	end

	set @string_piece = @account_number

	while @segment_number > 0
	begin
		if charindex(@char_separator, @string_piece) > 0
		begin
			set @return_piece = left(@string_piece, charindex(@char_separator, @string_piece))
			set @string_piece = substring(@string_piece, charindex(@char_separator, @string_piece) + 1, 255)
		end
		else
		begin
			set @return_piece = @string_piece
			set @string_piece = ''
		end
			
		set @segment_number = @segment_number - 1
	end

	if charindex(@char_separator, @return_piece) > 0
	begin
		set @return_piece = left(@return_piece, charindex(@char_separator, @return_piece) - 1)
	end
	
	return @return_piece
END

GO

