
create procedure ComparableGridSelectMultiSubject
	@lTempPropGridID int,
	@lYear numeric(4,0) = null /* If not null, then the additional subject PIDs will be added to #comp_sales_property_pid */
as

set nocount on

	if ( @lYear is not null )
	begin
		insert #comp_sales_property_pid (lPropID, lSupNum)
		select cgs.lSecondarySubjectPropID, psa.sup_num
		from comparable_grid_temp_subject as cgs with(nolock)
		join prop_supp_assoc as psa with(nolock) on
			psa.owner_tax_yr = @lYear and
			psa.prop_id = cgs.lSecondarySubjectPropID
		where
			cgs.lTempPropGridID = @lTempPropGridID and
			not exists (
				select c.lPropID
				from #comp_sales_property_pid as c with(nolock)
				where
					c.lPropID = cgs.lSecondarySubjectPropID
			)
	end

set nocount off

	select cgs.lSecondarySubjectPropID
	from comparable_grid_temp_subject as cgs with(nolock)
	where
		cgs.lTempPropGridID = @lTempPropGridID

	return( @@rowcount )

GO

