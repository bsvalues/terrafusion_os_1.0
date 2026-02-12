
create proc REETWebPortalImportPropertyInsert (
@webportal_id varchar(10)
,@prop_id varchar(50)
,@land_use_cd varchar(10)
,@location_cd varchar(4)
,@parcel_segregated bit
)
as
BEGIN
	DECLARE @key char(1)
	DECLARE @result varchar(250)
	DECLARE @appr_yr int
	SET @result = NULL
	BEGIN TRY


	select @appr_yr = appr_yr from pacs_system with (nolock)
	
	select @key = szConfigValue from pacs_config with (nolock)
	where szGroup = 'REET'
		and szConfigName = 'Electronic REET Processing Default Mapping Key'

	if @key <> 'P'
	BEGIN
		SELECT @prop_id	= cast(prop_id as varchar(10)) from property with (nolock) where GEO_id = @prop_id
	END

		if not exists(select webportal_id from ##reet_webportal_import with (nolock) where webportal_id = @webportal_id)
		BEGIN
			DECLARE @webportalError varchar(500)
			set @webportalError = 'webportal_id ' + @webportal_id + ' not found'
			RAISERROR(@webportalError,16,1)
		END

		if exists(select webportal_id from ##reet_webportal_import_property with (nolock) where webportal_id = @webportal_id and prop_id = cast(@prop_id as int))
		BEGIN
			DECLARE @duplicateError varchar(500)
			set @duplicateError = 'duplicate property ' + @prop_id + ' for webportal_id ' + @webportal_id
			RAISERROR(@duplicateError,16,1)
		END

		if not exists(select * from prop_supp_assoc with (nolock) where owner_tax_yr = @appr_yr and prop_id = cast(@prop_id as int))
		BEGIN
			DECLARE @propertyError varchar(500)
			set @propertyError = 'prop_id ' + @prop_id + ' not found in Appraisal Year ' + CONVERT(varchar(5), @appr_yr)
			RAISERROR(@propertyError  ,16,1)
		END


		INSERT INTO ##reet_webportal_import_property
				   ([webportal_id]
				   ,[prop_id]
				   ,[land_use_cd]
				   ,[location_cd]
				   ,[parcel_segregated])
			 VALUES
				   (@webportal_id
				   ,cast(@prop_id as int)
				   ,@land_use_cd
				   ,@location_cd
				   ,@parcel_segregated)
	END TRY
	BEGIN CATCH
		
		 select ERROR_MESSAGE() as [Error_Message]
		 return
	END CATCH

	select NULL as [Error_Message]

END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[REETWebPortalImportPropertyInsert] TO PUBLIC
    AS [dbo];


GO

