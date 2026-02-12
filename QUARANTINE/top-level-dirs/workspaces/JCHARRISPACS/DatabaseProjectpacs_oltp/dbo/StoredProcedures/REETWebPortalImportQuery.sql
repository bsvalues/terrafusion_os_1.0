
create proc REETWebPortalImportQuery (
	@batch_date datetime,
	@webportal_ids varchar(2000),
	@agency_id int = NULL
)
as
BEGIN


	if len(ltrim(@webportal_ids)) > 0
	BEGIN
		set nocount on
		DECLARE @SplitOn char(1)

		IF object_id('tempdb..#webportalids') IS NOT NULL
		BEGIN
		   DROP TABLE #webportalids
		END

		CREATE TABLE #webportalids (
			webportal_id varchar(10)
			)
		set @SplitOn = ','
		While (Charindex(@SplitOn,@webportal_ids)>0)
		Begin
			Insert Into #webportalids (webportal_id)
			Select cast(ltrim(rtrim(Substring(@webportal_ids,1,Charindex(@SplitOn,@webportal_ids)-1))) as varchar(10))

			Set @webportal_ids = Substring(@webportal_ids,Charindex(@SplitOn,@webportal_ids)+1,len(@webportal_ids))
		End
		
		if len(ltrim(@webportal_ids)) > 0
		BEGIN
			Insert Into #webportalids (webportal_id)
			Select cast(ltrim(rtrim(@webportal_ids)) as varchar(10))
		END


		set nocount off

		if @agency_id is not null
		BEGIN
			select rwi.*, rwip.prop_id from reet_webportal_import rwi 
				inner join #webportalids wpi on
					rwi.webportal_id = wpi.webportal_id 
				inner join reet_webportal_import_property as rwip on
					rwi.webportal_id = rwip.webportal_id
				where rwi.batch_balance_date = isnull(@batch_date, rwi.batch_balance_date)
					and rwi.agency_id = @agency_id
		END
		ELSE
		BEGIN
			select rwi.*, rwip.prop_id  from reet_webportal_import rwi 
				inner join #webportalids wpi on
					rwi.webportal_id = wpi.webportal_id
				inner join reet_webportal_import_property as rwip on
					rwi.webportal_id = rwip.webportal_id
				where rwi.batch_balance_date = isnull(@batch_date, rwi.batch_balance_date)
		END
	END
	ELSE
	BEGIN
		if @agency_id is not null
		BEGIN
			select rwi.*, rwip.prop_id from reet_webportal_import rwi 
			inner join reet_webportal_import_property as rwip on
					rwi.webportal_id = rwip.webportal_id
				where rwi.batch_balance_date = isnull(@batch_date, rwi.batch_balance_date)
					and rwi.agency_id = @agency_id
		END
		ELSE
		BEGIN
			select rwi.*, rwip.prop_id from reet_webportal_import rwi 
			inner join reet_webportal_import_property as rwip on
					rwi.webportal_id = rwip.webportal_id
				where rwi.batch_balance_date = isnull(@batch_date, rwi.batch_balance_date)
		END
	END
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[REETWebPortalImportQuery] TO PUBLIC
    AS [dbo];


GO

