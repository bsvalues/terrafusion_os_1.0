
create procedure LayerCopyLease
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int,

	@szNewLeaseID varchar(20) = ''
as

set nocount on

	declare @lease_flag bit

	select @lease_flag = lease_flag
	from dbo.pacs_system with(nolock)
	where system_type in ('A','B')

	if ( isnull(@lease_flag, 0) = 0 )
	begin
		return(0)
	end

	declare @rev_num int

	if ( @szNewLeaseID = '' )
	begin
		select @szNewLeaseID = lease_id 
		from dbo.lease_prop_assoc with(nolock)
		where prop_id = @lPropID_From
		and lease_yr = @lYear_From
		and sup_num = @lSupNum_From
	end

	if ( @szNewLeaseID <> '' )
	begin
		select @rev_num = max(isnull(rev_num,0))
		from dbo.lease with(nolock)
		where lease_id = @szNewLeaseID
		and lease_yr = @lYear_To
	end
	else
	begin
		select @rev_num = max(isnull(rev_num,0))
		from dbo.lease_prop_assoc with(nolock)
		where prop_id = @lPropID_From
		and lease_yr = @lYear_From
		and sup_num = @lSupNum_From
	end

	insert dbo.lease_prop_assoc with(rowlock) (
		lease_id,
		lease_yr,
		rev_num,
		sup_num,
		prop_id,
		interest_type_cd,
		interest_pct,
		barrels_per_day
	)
	select
		@szNewLeaseID,
		@lYear_To,
		@rev_num,
		@lSupNum_To,
		@lPropID_To,
		interest_type_cd,
		interest_pct,
		barrels_per_day
	from dbo.lease_prop_assoc as lpa with(nolock)
	where prop_id = @lPropID_From
	and lease_yr = @lYear_From
	and sup_num = @lSupNum_From
	and rev_num = (
		select max(rev_num)
		from dbo.lease with(nolock)
		where lease_id = lpa.lease_id
		and lease_yr = lpa.lease_yr
	)

GO

