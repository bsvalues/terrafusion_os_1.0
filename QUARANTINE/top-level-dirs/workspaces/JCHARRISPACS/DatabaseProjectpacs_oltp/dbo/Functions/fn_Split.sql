
 create function dbo.fn_Split(@string varchar(max), @delimiter char(1))
 returns @temptable table (Id int, Item varchar(8000))
 as
 begin
 -- NB! len() does a rtrim() (ex. len('2 ') = 1)
 if ( len( @string ) < 1 or @string is null ) return
declare @idx int
declare @slice varchar(8000)
declare @stringLength int
declare @counter int ; set @counter = 1

set @idx = charindex( @delimiter, @string )

while @idx!= 0
begin
    set @slice = ltrim( rtrim( left(@string, @idx - 1)))
    set @slice = replace( replace(@slice, char(10), ''), char(13), '')
    insert into @temptable(Id, Item) values(@counter, @slice)

    -- To handle trailing blanks use datalength()
    set @stringLength = datalength(@string)
    set @string = right( @string, (@stringLength - @idx) )
    set @idx = charindex( @delimiter, @string )
    set @counter = @counter + 1
end

-- What's left after the last delimiter
set @slice = ltrim(rtrim(@string))
set @slice = replace( replace(@slice, char(10), ''), char(13), '')
insert into @temptable(Id, Item) values(@counter, @slice)


 return
 end

GO

