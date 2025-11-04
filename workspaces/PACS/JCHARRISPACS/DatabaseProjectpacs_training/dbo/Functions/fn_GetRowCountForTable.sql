
-- example call
--declare @i bigint 
--select @i = (select dbo.fn_GetRowCountForTable('property_val'))
--print @i

CREATE function dbo.fn_GetRowCountForTable
  (@szTableNm sysname)
RETURNS bigint
AS 
BEGIN 

declare @TotRows bigint

if not exists (
	select *
	from sysobjects
        where name = @szTableNm
     )
  begin
    set @TotRows = 0
  end
else
  begin
	SELECT @TotRows = max(i.rowcnt)
	  FROM sysobjects o join sysindexes i
		on i.id = o.id
	 where indid IN(0,1)
	   and o.name = @szTableNm
  end

RETURN @TotRows
END

GO

