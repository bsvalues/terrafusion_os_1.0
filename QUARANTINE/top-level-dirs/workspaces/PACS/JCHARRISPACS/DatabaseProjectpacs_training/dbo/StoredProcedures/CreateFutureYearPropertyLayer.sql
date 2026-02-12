
CREATE PROCEDURE [dbo].[CreateFutureYearPropertyLayer]
	@lInputPropID		int,
	@lInputCurrentSupp	int,
	@lInputFromYear		numeric(4,0),
	@lInputActualFutureYear	numeric(4,0),
	@bImportPropertyProfile bit = 1,
	@szPropType char(5) = null -- If the caller knows the value, it should be passed so this sp doesn't have to query for it
AS

-- Turn off logging
exec dbo.SetMachineLogChanges 0


if ( @szPropType is null )
begin
	select @szPropType = prop_type_cd
	from property with(nolock)
	where prop_id = @lInputPropID
end


declare	@lSupNum	int
set	@lSupNum = 0

declare	@lFutureYear	numeric(4,0)
set	@lFutureYear = 0


exec dbo.LayerCopyMain
	-- From
	@lInputFromYear,
	@lInputCurrentSupp,
	@lInputPropID,
	-- To
	@lFutureYear,
	@lSupNum,
	@lInputPropID


exec dbo.LayerCopyExemption
	-- From
	@lInputFromYear,
	@lInputCurrentSupp,
	@lInputPropID,
	-- To
	@lFutureYear,
	@lSupNum,
	@lInputPropID,
	null, -- All owners
	null, -- Same destination owner_id
	null, -- All exemption type codes
	1, -- Check that the destination doesn't exist
	1 -- Delete via prorate date


exec dbo.LayerCopyShared
	-- From
	@lInputFromYear,
	@lInputCurrentSupp,
	@lInputPropID,
	-- To
	@lFutureYear,
	@lSupNum,
	@lInputPropID


exec dbo.LayerCopyTableAgentAssoc
	-- From
	@lInputFromYear,
	@lInputPropID,
	-- To
	@lFutureYear,
	@lInputPropID,
	null


if ( @szPropType in ('R','MH') )
begin
	exec dbo.LayerCopyImprovement
		-- From
		@lInputFromYear,
		@lInputCurrentSupp,
		0,
		@lInputPropID,
		-- To
		@lFutureYear,
		@lSupNum,
		0,
		@lInputPropID,
		0, -- Assign new IDs
		null, -- All improvements
		null, -- All details of course
		0, 0, 0, -- Skip entity/exemption/owner assoc
		null, -- All owners
		'CFYPL' -- Create future year property layer semantics
		

	exec dbo.LayerCopyLand
		-- From
		@lInputFromYear,
		@lInputCurrentSupp,
		0,
		@lInputPropID,
		-- To
		@lFutureYear,
		@lSupNum,
		0,
		@lInputPropID,
		0, -- Assign new IDs
		null, -- All land segments
		0, 0, 0, -- Skip entity/exemption/owner assoc
		null, -- All owners
		'CFYPL' -- Create future year property layer semantics


	exec dbo.LayerCopyIncome
		-- From
		@lInputFromYear,
		@lInputCurrentSupp,
		@lInputPropID,
		-- To
		@lFutureYear,
		@lSupNum,
		@lInputPropID
end
else if ( @szPropType in ('P','A') )
begin
	exec dbo.LayerCopyPersonal
		-- From
		@lInputFromYear,
		@lInputCurrentSupp,
		@lInputPropID,
		-- To
		@lFutureYear,
		@lSupNum,
		@lInputPropID,
		0, -- Assign new IDs
		null, -- All segments
		0, 0, 0, -- Skip entity/exemption/owner assoc
		null, -- All owners
		'CFYPL' -- Create future year property layer semantics


	exec dbo.LayerCopyRendition
		-- From
		@lInputFromYear,
		@lInputCurrentSupp,
		@lInputPropID,
		-- To
		@lFutureYear,
		@lSupNum,
		@lInputPropID,
		0, 1, 1 -- Skip tracking/penalty/rendition tables
end
/*
else -- Mineral
begin
	exec dbo.LayerCopyLease
		-- From
		@lInputFromYear,
		@lInputCurrentSupp,
		@lInputPropID,
		-- To
		@lFutureYear,
		@lSupNum,
		@lInputPropID,
		@input_new_lease_id
end
*/

if ( @bImportPropertyProfile = 1 )
begin
	exec dbo.ImportPropertyProfile @lInputPropID, 0, 1
end

/* turn on logging */
exec SetMachineLogChanges 1

GO

