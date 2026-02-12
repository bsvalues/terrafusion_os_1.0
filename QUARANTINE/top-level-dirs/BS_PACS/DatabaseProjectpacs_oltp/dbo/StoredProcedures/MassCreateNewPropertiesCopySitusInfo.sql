
CREATE  PROCEDURE MassCreateNewPropertiesCopySitusInfo

	@source_prop_id		int,
	@new_prop_id		int

AS

	declare @situs_id	int
	declare @primary_situs varchar(1)
	declare @situs_num varchar(15)
	declare @situs_street_prefx varchar(10)
	declare @situs_street varchar(50)
	declare @situs_street_sufix varchar(10)
	declare @situs_unit varchar(5)
	declare @situs_city varchar(30)
	declare @situs_state varchar(2)
	declare @situs_zip varchar(10)

	declare SITUS CURSOR FAST_FORWARD
	for SELECT primary_situs, 
				situs_num,
				situs_street_prefx, 
				situs_street, 
				situs_street_sufix,
				situs_unit,
				situs_city,
				situs_state,
				situs_zip
		FROM situs WITH (NOLOCK)
		WHERE prop_id = @source_prop_id

	OPEN SITUS
	FETCH NEXT FROM SITUS INTO @primary_situs,
						@situs_num,
						@situs_street_prefx,
						@situs_street,
						@situs_street_sufix,
						@situs_unit,
						@situs_city,
						@situs_state,	
						@situs_zip

	WHILE @@FETCH_STATUS = 0
	BEGIN
		exec dbo.GetUniqueID 'situs', @situs_id output, 1, 0

		INSERT INTO situs
		(prop_id, situs_id, primary_situs, situs_num, situs_street_prefx,
		situs_street, situs_street_sufix, situs_unit, situs_city,
		situs_state, situs_zip)
		VALUES
		(@new_prop_id, @situs_id, @primary_situs, @situs_num, @situs_street_prefx,
		@situs_street, @situs_street_sufix, @situs_unit, @situs_city,
		@situs_state, @situs_zip)

		FETCH NEXT FROM SITUS INTO @primary_situs,
							@situs_num,
							@situs_street_prefx,
							@situs_street,
							@situs_street_sufix,
							@situs_unit,
							@situs_city,
							@situs_state,	
							@situs_zip
	END

	CLOSE SITUS
	DEALLOCATE SITUS

GO

