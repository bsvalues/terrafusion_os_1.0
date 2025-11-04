
CREATE procedure SharedPropertyCodeVerify

	@lRunId int

as

set nocount on


declare @szCADCode varchar(5)

	select @szCADCode = szCADCode
	from import_shared_prop
	with (nolock)
	where lRunId = @lRunId

	select distinct szImprvHSStateCd as state_code
	from import_shared_prop_detail
	with (nolock)
	where lRunId = @lRunId
	and ltrim(szImprvHSStateCd) <> ''
	and szImprvHSStateCd not in (select cad_state_code from cad_state_codes with (nolock)
								where cad_code = @szCADCode)

	union
	select distinct szImprvNHSStateCd
	from import_shared_prop_detail
	with (nolock)
	where lRunId = @lRunId
	and ltrim(szImprvNHSStateCd) <> ''
	and szImprvNHSStateCd not in (select cad_state_code from cad_state_codes with (nolock)
								where cad_code = @szCADCode)

	union
	select distinct szLandHSStateCd
	from import_shared_prop_detail
	with (nolock)
	where lRunId = @lRunId
	and ltrim(szLandHSStateCd) <> ''
	and szLandHSStateCd not in (select cad_state_code from cad_state_codes with (nolock)
								where cad_code = @szCADCode)

	union
	select distinct szLandNHSStateCd
	from import_shared_prop_detail
	with (nolock)
	where lRunId = @lRunId
	and ltrim(szLandNHSStateCd) <> ''
	and szLandNHSStateCd not in (select cad_state_code from cad_state_codes with (nolock)
								where cad_code = @szCADCode)

	union
	select distinct szLandAgStateCd
	from import_shared_prop_detail
	with (nolock)
	where lRunId = @lRunId
	and ltrim(szLandAgStateCd) <> ''
	and szLandAgStateCd not in (select cad_state_code from cad_state_codes with (nolock)
								where cad_code = @szCADCode)

	union
	select distinct szLandTimberStateCd
	from import_shared_prop_detail
	with (nolock)
	where lRunId = @lRunId
	and ltrim(szLandTimberStateCd) <> ''
	and szLandTimberStateCd not in (select cad_state_code from cad_state_codes with (nolock)
								where cad_code = @szCADCode)

	union
	select distinct szPersonalStateCd
	from import_shared_prop_detail
	with (nolock)
	where lRunId = @lRunId
	and ltrim(szPersonalStateCd) <> ''
	and szPersonalStateCd  not in (select cad_state_code from cad_state_codes with (nolock)
								where cad_code = @szCADCode)

	union
	select distinct szMineralStateCd
	from import_shared_prop_detail
	with (nolock)
	where lRunId = @lRunId
	and ltrim(szMineralStateCd) <> ''
	and szMineralStateCd not in (select cad_state_code from cad_state_codes with (nolock)
								where cad_code = @szCADCode)


	/*
	 * 2nd resultset, productivity codes
	 */

	select distinct szProductivityCode as productivity_code
	from import_shared_prop_detail
	with (nolock)
	where lRunId = @lRunId
	and ltrim(szProductivityCode) <> ''
	and szProductivityCode not in (select cad_productivity_code from cad_productivity_codes with (nolock)
								where cad_code = @szCADCode)

GO

