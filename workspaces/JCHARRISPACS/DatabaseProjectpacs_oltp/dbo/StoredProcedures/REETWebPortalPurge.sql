
create proc REETWebPortalPurge (@webportal_id_input varchar(max))

as
BEGIN
declare @SplitOn char(1)

   

    

	set nocount on

	IF object_id('tempdb..#webportalID') IS NOT NULL
	BEGIN
		DROP TABLE #webportalID
	END
	

	CREATE TABLE #webportalID (	
		webportal_id varchar(10)	
	)
	
	
	SET @SplitOn = ','
	
	
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


	delete ##reet_webportal_import_property where webportal_id in (select webportal_id from #webportalID)
	delete ##reet_webportal_import_account where webportal_id in ( select webportal_id from #webportalID )
	delete ##reet_webportal_import where webportal_id in ( select webportal_id from #webportalID )


	set nocount off

	drop table #webportalID
	



END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[REETWebPortalPurge] TO PUBLIC
    AS [dbo];


GO

