
create proc [dbo].[REETWebPortalImportAccountInsert](
		@webportal_id varchar(10)
		,@account_type_cd char(1)
		,@name varchar(150)
		,@addr_line1 varchar(60)
		,@addr_line2 varchar(60)
		,@addr_line3 varchar(60)
		,@addr_city varchar(50)
		,@addr_state varchar(50)
		,@addr_zip char(9)
		,@addr_country_cd char(5)
		,@phone_num varchar(15)
)
AS
BEGIN
	
	BEGIN TRY

		DECLARE @errorMessage varchar(500)
		if not exists(select webportal_id from ##reet_webportal_import where webportal_id = @webportal_id)
		BEGIN
			set @errorMessage = 'webportal_id ' + @webportal_id + ' not found'
			RAISERROR(@errorMessage ,16,1)
		END

		if @account_type_cd not in ('B','S')
		BEGIN
			set @errorMessage = 'Invalid account_type_cd ' + @account_type_cd + ', Valid Account Type shall be B or S'
			RAISERROR(@errorMessage,16,1)
		END
	
		if exists (select * from ##reet_webportal_import_account where webportal_id = @webportal_id and account_type_cd = @account_type_cd and name = @name)
		BEGIN
			set @errorMessage = 'name ' + @name + ' already exists for this reet record and account type'
			RAISERROR(@errorMessage,16,1)
		END
		
		
		if (CHARINDEX(' ', @phone_num) > 0)
		BEGIN
			set @errorMessage = 'Invalid phone_num ' + @phone_num + ', Phone Number contains Non-Numerical characters'
			RAISERROR(@errorMessage,16,1)
		END
		ELSE
		BEGIN
			if (ISNUMERIC(@phone_num) = 0) and (LEN(@phone_num) > 0)
			BEGIN
				set @errorMessage = 'Invalid phone_num ' + @phone_num + ', Phone Number contains Non-Numerical characters'
				RAISERROR(@errorMessage,16,1)
			END
		END
		

		INSERT INTO ##reet_webportal_import_account
           ([webportal_id]
           ,[account_type_cd]
           ,[name]
           ,[addr_line1]
           ,[addr_line2]
           ,[addr_line3]
           ,[addr_city]
		   ,[addr_state]
           ,[addr_zip]
           ,[addr_country_cd]
           ,[phone_num]
           )
     VALUES
           (@webportal_id
           ,@account_type_cd
           ,@name
           ,@addr_line1
           ,@addr_line2
           ,@addr_line3
           ,@addr_city
		   ,@addr_state
           ,@addr_zip
           ,@addr_country_cd
           ,@phone_num)
	END TRY
	BEGIN CATCH
		
		 select ERROR_MESSAGE() as [Error_Message]
		 return
	END CATCH

	select NULL as [Error_Message]

END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[REETWebPortalImportAccountInsert] TO PUBLIC
    AS [dbo];


GO

