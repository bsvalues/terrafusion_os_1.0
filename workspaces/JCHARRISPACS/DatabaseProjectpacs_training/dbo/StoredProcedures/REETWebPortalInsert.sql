
create proc REETWebPortalInsert (
	@webportal_id varchar(10)
	,@agency_id decimal(4,0)
	,@partial_sale bit
	,@exemption_claimed bit
	,@imp_forestland_flag bit
	,@imp_current_use_flag bit
	,@imp_historic_flag bit
	,@imp_continuance_flag bit
	,@imp_open_space_flag bit
	,@pers_prop_description varchar(140)
	,@wac_number_type_cd varchar(32)
	,@wac_reason varchar(100)
	,@instrument_type_cd char(10)
	,@sale_date datetime
	,@sale_price numeric(11,2)
	,@pers_prop_val numeric(11,2)
	,@exemption_amount numeric(11,2)
	,@taxable_selling_price numeric(11,2)
	,@imp_city varchar(150)
	,@legal_desc varchar(max)
	,@url_image varchar(255)
	,@transaction_date datetime
	,@assigned_user_name varchar(30) = null
	,@imp_timber_ag_flag bit
	,@imp_multiple_locations bit
)
as
BEGIN
	BEGIN TRY

		DECLARE @errorMessage varchar(500)

		if exists(select webportal_id from ##reet_webportal_import where webportal_id = @webportal_id)
		BEGIN
			set @errorMessage = 'webportal_id ' + @webportal_id + ' already exists'
			RAISERROR(@errorMessage,16,1)
		END

		if exists(select webportal_id from reet_webportal_import where webportal_id = @webportal_id)
		BEGIN
			set @errorMessage = 'webportal_id ' + @webportal_id + ' already exists'
			RAISERROR(@errorMessage,16,1)
		END


		if (len(ltrim(@wac_number_type_cd)) = 0)
			set @wac_number_type_cd = null

		if (@exemption_claimed = 1) and not exists(select * from reet_wac_code where wac_cd = isnull(@wac_number_type_cd, wac_cd))
		BEGIN
			set @errorMessage = 'exemption_claimed is 1, invalid wac number type cd ' + @wac_number_type_cd + ' provided'
			RAISERROR(@errorMessage, 16,1)
		END
		
		if (@exemption_claimed = 1) and ((len(ltrim(@wac_number_type_cd)) = 0) or @wac_number_type_cd is null)
		BEGIN
			RAISERROR('exemption_claimed is 1, wac_number_type_cd not provided', 16,1)
		END

		if (len(ltrim(@instrument_type_cd)) = 0)
			set @instrument_type_cd = null

		declare @mappingUser varchar(5)
		select @mappingUser = 
			szConfigValue from pacs_config
			where szGroup = 'REET' 
			and szConfigName = 'Web Portal REET Import User Mapping'

		SELECT @assigned_user_name = ISNULL(@assigned_user_name, '')
		SELECT @assigned_user_name = RTRIM(LTRIM(@assigned_user_name))


		if (@mappingUser = 'Yes')
		BEGIN
			if (lEN(@assigned_user_name) < 1)
			BEGIN
				set @errorMessage = 'Web Portal REET Import User Mapping is True, assigned_user_name not provided'
				RAISERROR(@errorMessage, 16,1)
			END
		END

		if (lEN(@assigned_user_name) > 0)
		BEGIN
			if not exists 
				(select pacs_user_name from pacs_user
					where pacs_user_name = @assigned_user_name)							
			BEGIN
				set @errorMessage = 'assigned_user_name ' + @assigned_user_name + ' does not exist'
				RAISERROR(@errorMessage, 16,1)
			END
		END

	INSERT INTO ##reet_webportal_import
           ([webportal_id]
           ,[agency_id]
           ,[partial_sale]
           ,[exemption_claimed]
           ,[imp_forestland_flag]
           ,[imp_current_use_flag]
           ,[imp_historic_flag]
           ,[imp_continuance_flag]
           ,[imp_open_space_flag]
           ,[pers_prop_description]
           ,[wac_number_type_cd]
           ,[wac_reason]
           ,[instrument_type_cd]
           ,[sale_date]
           ,[sale_price]
           ,[pers_prop_val]
           ,[exemption_amount]
           ,[taxable_selling_price]
           ,[imp_city]
           ,[legal_desc]
           ,[url_image]
	   ,[transaction_date]
 	   ,[assigned_user_name]
           ,[imp_timber_ag_flag]
           ,[imp_multiple_locations]
           )
     VALUES
           (@webportal_id
			,@agency_id
			,@partial_sale
			,@exemption_claimed
			,@imp_forestland_flag
			,@imp_current_use_flag
			,@imp_historic_flag
			,@imp_continuance_flag
			,@imp_open_space_flag
			,@pers_prop_description
			,@wac_number_type_cd
			,@wac_reason
			,@instrument_type_cd
			,@sale_date
			,@sale_price
			,@pers_prop_val
			,@exemption_amount
			,@taxable_selling_price
			,@imp_city
			,@legal_desc
			,@url_image
			,@transaction_date
			,@assigned_user_name
			,@imp_timber_ag_flag
			,@imp_multiple_locations
			)
	END TRY
	BEGIN CATCH
		
		 select ERROR_MESSAGE() as [Error_Message]
		 return
	END CATCH

	select NULL as [Error_Message]

END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[REETWebPortalInsert] TO [simplifile]
    AS [dbo];


GO

GRANT EXECUTE
    ON OBJECT::[dbo].[REETWebPortalInsert] TO PUBLIC
    AS [dbo];


GO

