
---- example: exec REETWebPortalDelete '130, 104' ----
create proc REETWebPortalDeleteRejectImportRecords (@webportal_id_input varchar(max))
as
BEGIN
declare @SplitOn char(1)
declare @error_message varchar(512)

set nocount on

	IF object_id('tempdb..#webportalID') IS NOT NULL
	BEGIN
		DROP TABLE #webportalID
	END
	
	IF object_id('tempdb..#webportalCannotDelete') IS NOT NULL
	BEGIN
		DROP TABLE #webportalCannotDelete
	END
	

	CREATE TABLE #webportalID (	
		webportal_id varchar(10)	
	)
	
	CREATE TABLE #webportalCannotDelete (	
		webportal_id varchar(10),
		import_status varchar(25),
		error_message varchar(512)	
	)

	SET @SplitOn = ','
	
	
print @webportal_id_input

	While (Charindex(@SplitOn, @webportal_id_input) > 0)
	Begin
		Insert Into  #webportalID (webportal_id)
		Select 
			cast(ltrim(rtrim(Substring(@webportal_id_input, 1, Charindex(@SplitOn, @webportal_id_input) -1 ))) as varchar)

		Set @webportal_id_input = Substring(@webportal_id_input, Charindex(@SplitOn, @webportal_id_input) +1, len(@webportal_id_input))			
	End

	
	if (@webportal_id_input is not null)
	begin
		Insert Into  #webportalID (webportal_id)
		select cast(ltrim(rtrim(@webportal_id_input)) as varchar)
	end


	insert into #webportalCannotDelete (webportal_id, import_status, error_message)
	select webportal_id, status, 'Not deleted, only Rejected import record can be deleted'
	from reet_webportal_import
	where isNull(status, '') <> 'Reject' and webportal_id in ( select webportal_id from #webportalID )

	insert into #webportalCannotDelete (webportal_id, import_status, error_message)
	select webportal_id, null, 'Not deleted, import record doesn''t exist'
	from #webportalID
	where webportal_id not in ( select webportal_id from reet_webportal_import )

	

	delete from #webportalID
	where webportal_id in 
		(select webportal_id from #webportalCannotDelete)
		
	
	delete reet_webportal_import_property 
	where webportal_id in ( select webportal_id from #webportalID)

	delete reet_webportal_import_account 
	where webportal_id in ( select webportal_id from #webportalID )
	
	delete reet_webportal_import 
	where webportal_id in ( select webportal_id from #webportalID )
	
	declare @errorCount int
	select @errorCount = COUNT(*) from #webportalCannotDelete
	if (@errorCount > 0)
	begin
		select * from #webportalCannotDelete
	end
	
	set nocount off
		
	drop table #webportalID
	drop table #webportalCannotDelete

END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[REETWebPortalDeleteRejectImportRecords] TO PUBLIC
    AS [dbo];


GO

