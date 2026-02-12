

create procedure CompSalesCreateDefaultGrid
	@lPacsUserID int,
	@szGridType varchar(5) = 'RS', 
	@cResidentialGrid char(1)= 'T'
as

set nocount on

	declare @lGridID int

	begin transaction

	declare @text varchar(64)

	if @szGridType = 'RS'
	begin
		set @text = 'Default Residential Sales'
	end

	else if @szGridType = 'RE'
	begin
		set @text = 'Default Residential Equity'
	end

	else if @szGridType = 'CS'
	begin
		set @text = 'Default Commercial Sales'
	end

	else if @szGridType = 'CI'
	begin
		set @text = 'Default Commercial Income'
	end

	else if @szGridType = 'LS'
	begin
		set @text = 'Default Land Sales'
	end

	else
	begin
		set @text = 'Default'
	end





	insert comp_sales_display_grid with(rowlock) (
		lPacsUserID, szGridName, cDefault, szGridType, cResidentialGrid

	) values (
		@lPacsUserID, @text, 'T', @szGridType ,@cResidentialGrid
	)

	set @lGridID = @@identity

	/*
		Just in case this procedure is creating a new default grid when, in fact, there is
		already a default grid for the specified user, set the new default to the one just created
	*/
	exec CompSalesSetDefaultGrid @lPacsUserID, @lGridID, @cResidentialGrid, @szGridType

	if @lPacsUserID = 0
	begin
		/* We're creating the default system wide grid */

		/* Default grid contains all available fields ... */
		insert comp_sales_display_grid_layout with(rowlock) (
			lGridID, lFieldID
		)
		select
			@lGridID, lFieldID
		from comp_sales_display_grid_fields with(nolock)
		where
			lFieldID > 0 /* ... except blank lines */
			and
			(
				(cResidentialField = 'T' and @szGridType = 'RS')
				or
				(cResidentialField = 'T' and @szGridType = 'RE')
				or
				(cCorpField = 'T' and  @szGridType = 'CS')
				or
				(cCIField = 'T' and @szGridType = 'CI')
				or
				(cLandField = 'T' and @szGridType = 'LS')
			)
		order by szFieldName
	end
	else
	begin
		declare @lSystemGridID int
		
		/* Get the system wide grid ID */
		select
			@lSystemGridID = lGridID
		from comp_sales_display_grid with(nolock)
		where
			lPacsUserID = 0 and
			cDefault = 'T' and
			--cResidentialGrid = @cResidentialGrid and
			szGridType = @szGridType

		/* Default grid contains the same fields as the system wide grid */
		insert comp_sales_display_grid_layout with(rowlock) (
			lGridID, lFieldID
		)
		select
			@lGridID, lFieldID
		from comp_sales_display_grid_layout with(nolock)
		where
			lGridID = @lSystemGridID
		order by
			lGridLayoutID
	end

	commit transaction

set nocount off

	/* Output grid ID */
	select lGridID = @lGridID

GO

