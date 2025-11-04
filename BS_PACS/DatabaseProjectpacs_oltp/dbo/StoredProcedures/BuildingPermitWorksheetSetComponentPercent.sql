

create procedure BuildingPermitWorksheetSetComponentPercent
	@lBuildingPermitID int,
	@lComponentID int,
	@fPercentOfTotal numeric(4,1),
	@fInputPercent numeric(4,1)
as

set nocount on

	update building_permit_worksheet set
		bp_worksheet_component_percent = @fPercentOfTotal,
		bp_worksheet_component_input_percent = @fInputPercent
	where
		bldg_permit_id = @lBuildingPermitID and
		bp_worksheet_component_id = @lComponentID

	if ( @@rowcount = 0 )
	begin
		insert building_permit_worksheet (
			bldg_permit_id, bp_worksheet_component_id, bp_worksheet_component_percent, bp_worksheet_component_input_percent
		) values (
			@lBuildingPermitID, @lComponentID, @fPercentOfTotal, @fInputPercent
		)
	end

set nocount off

GO

