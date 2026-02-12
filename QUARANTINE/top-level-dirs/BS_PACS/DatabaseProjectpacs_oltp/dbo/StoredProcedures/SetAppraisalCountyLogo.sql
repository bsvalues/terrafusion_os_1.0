
create procedure SetAppraisalCountyLogo
	@logoPath varchar(4000)
as

set nocount on

declare @updateCommand varchar(4096)

set @updateCommand = 
	'update system_address
	 set county_logo_blob =
	 (select image_data.* from openrowset
	 (bulk ''' + @logoPath + ''', SINGLE_BLOB) image_data)
	 where system_type = ''A'' '

exec (@updateCommand)

GO

