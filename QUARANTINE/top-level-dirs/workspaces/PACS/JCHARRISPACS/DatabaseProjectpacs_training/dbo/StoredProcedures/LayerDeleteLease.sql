
create procedure LayerDeleteLease
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int
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

	delete lpa
	from dbo.lease_prop_assoc as lpa with(rowlock)
	where prop_id = @lPropID
	and lease_yr = @lYear
	and sup_num = @lSupNum

GO

