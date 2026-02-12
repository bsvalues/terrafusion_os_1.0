


/****** Object:  Stored Procedure dbo.LibReportsWrapper    Script Date: 9/25/2000 11:55:18 AM ******/
CREATE PROCEDURE LibReportsWrapper

	@input_query 	varchar(3000) = '',
	@input_distinct varchar(10) = ''

AS

declare @new_query varchar(5000)

set @new_query = 'SELECT ' + @input_distinct + ' 1 as DumbID,  ' + replace(@input_query, '"', '''')


exec(@new_query)

GO

