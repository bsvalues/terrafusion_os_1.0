

create procedure IsResidentialProperty
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int, -- Intentionally no longer used
	@bResidential bit output,
	@bRS bit = 0
as

set nocount on

	declare @cFlag char(1)

	select
		@cFlag = commercial_acct_flag
	from property_profile as p with(nolock)
	join state_code as s with(nolock) on
		p.state_cd = s.state_cd
	where
		p.prop_val_yr = @lYear and
		p.prop_id = @lPropID

	if @cFlag = 'T'
	begin
		set @bResidential = 0
	end
	else
	begin
		set @bResidential = 1
	end

set nocount off

	if ( @bRS = 1 )
	begin
		select bResidential = @bResidential
	end

GO

