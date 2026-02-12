

create procedure GetServerVersion

as

set nocount on

	if (@@version like '%Microsoft SQL Server  2000%')
	begin
		return(2000)
	end
	else if (@@version like '%Microsoft SQL Server  7%')
	begin
		return(7)
	end
	else
	begin
		return(0)
	end

set nocount off

GO

