

CREATE PROCEDURE GetPOSTNETCode (
	@zipsource   varchar(20) ,
	@strResult   varchar(14) OUTPUT )
as

declare @zipdestination as varchar (20)
declare @counter as int
declare @TotalSize as int
declare @char as varchar(1) 
declare @totalsumperdigit as int
declare @CheckDigit as int

-- 
select @TotalSize = LEN(@zipsource) 
select @counter = 0  
select @zipdestination = ''
select @totalsumperdigit = 0 
select @CheckDigit = 0
select @strResult = ''
--
--we can't work on a string that has a non digit char 
if (  PatIndex( '%[^0-9]%', @zipsource ) < 1) 
BEGIN
	while ( @counter < @TotalSize )
	BEGIN
		select @char = SUBSTRING( @zipsource, @counter+1, 1 ) 
		select @counter = @counter + 1 
		-- 
		select @zipdestination = @zipdestination + @char
		select @totalsumperdigit = @totalsumperdigit + CAST(@char as int ) 
		--
	END
END
--
if (LEN(@zipdestination) > 0 ) 
BEGIN
    --print '@totalsumperdigit:' + CAST( @totalsumperdigit as varchar)
    if (@totalsumperdigit % 10 )> 0  
    BEGIN
    	select @CheckDigit = 10 - ( @totalsumperdigit % 10 )
    END
    --print '@CheckDigit:' + CAST( @CheckDigit  as Varchar ) 
    --build the end result 
    select @strResult = '*' + @zipdestination + CAST(@CheckDigit as VarChar) + '*'
    --print @strResult   
END

GO

