
--declare @i bigint 
--select @i = (select dbo.fn_IsTableReplicated('property_val'))
--print @i

CREATE function dbo.fn_IsTableReplicated
  (@szTableNm sysname)
RETURNS bit
AS 
BEGIN 

declare @Replicated bit
declare @szSQL varchar(1000)

if ( object_id('sysarticles') is not null )
  begin

	if exists (select 1 from sysarticles as a 
                             join 
                             sysobjects as o
                        on a.objid = o.id
                      where a.name = @szTableNm)
	   begin 
		  set @Replicated = 1
	   end
	else
	   begin
		  set @Replicated = 0
	   end
  end
else
  begin
    set @Replicated = 0
  end
   
RETURN @Replicated
END

GO

