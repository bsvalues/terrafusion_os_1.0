
create function fn_CheckDigitMod10
( 
	@input_sequence varchar(8000)
)
returns char(1)
as
begin

	declare @ret char(1)
	
	declare @len int
	set @len = len(@input_sequence)
	
	declare @index int
	set @index = @len
	
	declare @current_char char(1)
	declare @current_num int
	
	declare @sum int
	set @sum = 0
	
	declare @current_multiplier int
	set @current_multiplier = 1
	
	while (@index > 0)
	begin
		set @current_char = substring(@input_sequence, @index, 1)
		if (@current_char in ('0','1','2','3','4','5','6','7','8','9'))
		begin
			set @current_num = convert(int, @current_char)
			set @sum = @sum + (@current_num * @current_multiplier)
		end
		
		set @current_multiplier = @current_multiplier + 1
		if (@current_multiplier > 2)
			set @current_multiplier = 1
		
		set @index = @index - 1
	end
	
	declare @remainder int
	set @remainder = @sum % 10
	
	declare @check_digit int
	set @check_digit = 10 - @remainder

	if (@check_digit = 10)
		set @ret = '0'
	else
		set @ret = convert(char(1), @check_digit)

	return (@ret)

end

GO

