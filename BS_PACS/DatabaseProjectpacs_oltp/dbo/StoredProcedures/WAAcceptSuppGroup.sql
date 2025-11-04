
CREATE PROCEDURE [dbo].[WAAcceptSuppGroup]
   @input_sup_group int,
   @input_user_id int
AS

set nocount on

--	Please do not update property_val.recalc_dt or delete prop_recalc_errors to work around
--	this check.  This check exists so that the user may *really recalculate* the properties
--	in order to produce good totals and ptd export.
if exists (
	select system_type
	from pacs_system with(nolock)
	where system_type in ('A','B')
)
begin
	/*
		Check to see if any properties in the group have not been recalculated
	*/
	if 
		exists (
			select top 1 pv.prop_val_yr
			from sup_group as sg with(nolock)
			join supplement as s with(nolock) on
				s.sup_group_id = sg.sup_group_id
			join prop_supp_assoc as psa with(nolock) on
				psa.owner_tax_yr = s.sup_tax_yr and
				psa.sup_num = s.sup_num
			join property_val as pv with(nolock) on
				pv.prop_val_yr = psa.owner_tax_yr and
				pv.sup_num = psa.sup_num and
				pv.prop_id = psa.prop_id
			where
				sg.sup_group_id = @input_sup_group and
				pv.recalc_dt is null and
				(pv.prop_inactive_dt is null or pv.udi_parent = 'T') and -- Deleted properties need not (and cannot) be recalculated
				pv.accept_create_id is null
		)
	begin
		raiserror('One or more properties have not been recalculated', 18, 1)
		return(-1)
	end

declare @sup_tax_yr numeric(4)
declare @sup_num    int

-- Fix any bad prev sup nums
exec sp_FixPrevSupNumPerSupGroup @input_sup_group
-- Fix any bad sup action
exec sp_FixSupActionPerSupGroup @input_sup_group

-- update the sup group to a status of 'A' which indicates that the supp group has been accepted
update sup_group
set status_cd = 'A', sup_accept_dt = GetDate(), sup_accept_by_id = @input_user_id
where sup_group_id = @input_sup_group

end

GO

