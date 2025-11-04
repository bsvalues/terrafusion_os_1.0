
CREATE FUNCTION fn_Address
(
@file_as_name VARCHAR(80), 
@addr_line1 VARCHAR(50), 
@addr_line2 VARCHAR(50) = null, 
@addr_line3 VARCHAR(50) = null, 
@addr_city VARCHAR(50) = null, 
@addr_state VARCHAR(2) = null, 
@addr_zip VARCHAR(50) = null, 
@country_name VARCHAR(80) = null, 
@international bit = 0,
@num_lines int = 5			-- 5 for backward compatibility for NAME_ADDRESS), 
							-- 5: 5_LINE address, 6: 6_LINE address, 
							-- +1 for fields like CA_AGENT_OR_OWNER_NAME_ADDRESS (needs extra line for 'For:' line)
)
RETURNS varchar(1000)
AS
BEGIN
	declare @cr varchar(1)  		-- Carriage return
	declare @address varchar(1000)
	declare @line_count int
	declare @padding int
	
	set @CR = char(13)
	set @file_as_name = rtrim(isnull(@file_as_name, ''))
	set @addr_line1 = rtrim(@addr_line1)
	set @addr_line2 = rtrim(@addr_line2)
	set @addr_line3 = rtrim(@addr_line3)
	set @addr_city = rtrim(@addr_city)
	set @addr_state = rtrim(@addr_state)
	set @addr_zip = rtrim(@addr_zip)
	set @country_name = rtrim(@country_name)

	-- Build initial address up to city
	set @address = @file_as_name
	if len(@addr_line1) > 0
	begin
		set @address = @address + @cr + @addr_line1
	end
	if len(@addr_line2) > 0
	begin
		set @address = @address + @cr + @addr_line2 
	end
	if len(@addr_line3) > 0
	begin
		set @address = @address + @cr + @addr_line3
	end
	if len(@addr_city) > 0
	begin
		set @address = @address + @cr + @addr_city 
	end
	
	-- clear up extra lines (Possible data issues)
	set @address = replace(@address, @cr + @cr, @cr)
	
	set @line_count = len(@address) - len(replace(@address, @cr, '')) + 1 -- number of CR + 1
	
	if @international = 1
	begin
		-- Add country if there is space
		if @line_count < (@num_lines)
		begin
			set @address = @address + @cr + @country_name
			set @line_count = @line_count + 1
		end	
	end
	else
	begin
		-- Add [State] and [Zip] for local US addresses
		if len(@addr_state) > 0
		begin
			set @address = @address + ', ' + @addr_state + ' ' + @addr_zip
		end
		else
		begin
			set @address = @address + ' ' + @addr_zip
		end
	end
	
	-- clear up extra lines (Possible data issues)
	set @address = replace(@address, @cr + @cr, @cr)
	
	-- Pad address
	set @padding = (@num_lines) - @line_count
	while @padding > 0
	begin
		set @address = @address + @cr
		set @padding = @padding - 1
	end
	
	return (@address)
END

GO

