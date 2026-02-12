
CREATE PROCEDURE AcceptSuppGroup
   @input_sup_group int,
   @input_user_id int
AS


-- James - Added this to prevent supp group from being accepted in the below scenarios
-- This is desirable because with these conditions:
--		1.  CalculateTaxable will produce property_owner_entity_state_cd rows with ERROR state code
--		2.  PTD Export will have errors b/c of the CalculateTaxable output
--
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
		Check to see if:
			Any properties in the group have not been recalculated
			OR
			Any properties in the group have ptd recalc errors
	*/
	if (
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

		or

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
				pv.accept_create_id is null and
				exists (
					select top 1 pre.error_id
					from prop_recalc_errors as pre with(nolock)
					where
						pre.sup_yr = pv.prop_val_yr and
						pre.sup_num = pv.sup_num and
						pre.prop_id = pv.prop_id and
						pre.error_type like 'PTD%'
				)
		)
	)
	begin
		raiserror('One or more properties have not been recalculated or have PTD recalc errors', 18, 1)
		return(-1)
	end
end

-- Remove pvsc/pvcsc orphans
delete pvsc
from dbo.property_val_state_cd as pvsc
join dbo.supplement as s with(nolock) on
	s.sup_tax_yr = pvsc.prop_val_yr and
	s.sup_num = pvsc.sup_num and
	s.sup_group_id = @input_sup_group
where not exists (
	select pv.prop_val_yr
	from dbo.property_val as pv with(nolock)
	where
		pv.prop_val_yr = pvsc.prop_val_yr and
		pv.sup_num = pvsc.sup_num and
		pv.prop_id = pvsc.prop_id
)

delete pvcsc
from dbo.property_val_cad_state_cd as pvcsc
join dbo.supplement as s with(nolock) on
	s.sup_tax_yr = pvcsc.prop_val_yr and
	s.sup_num = pvcsc.sup_num and
	s.sup_group_id = @input_sup_group
where not exists (
	select pv.prop_val_yr
	from dbo.property_val as pv with(nolock)
	where
		pv.prop_val_yr = pvcsc.prop_val_yr and
		pv.sup_num = pvcsc.sup_num and
		pv.prop_id = pvcsc.prop_id
)


declare @sup_tax_yr numeric(4)
declare @sup_num    int

-- Fix any bad prev sup nums
exec sp_FixPrevSupNumPerSupGroup @input_sup_group
-- Fix any bad sup action
exec sp_FixSupActionPerSupGroup @input_sup_group

DECLARE SUPP_GROUP_VW SCROLL CURSOR
FOR select sup_tax_yr,
	   sup_num 
    from   supplement_vw
    where  sup_group_id = @input_sup_group

OPEN SUPP_GROUP_VW
FETCH NEXT FROM SUPP_GROUP_VW into @sup_tax_yr, @sup_num

while (@@FETCH_STATUS = 0)
begin
	-- here we will calculate the entity/property exemption value and the  entity/property taxable value
	exec SetPropertyEntityValue @sup_tax_yr, @sup_num
	
	-- there could be a situation where an entity is deleted from a property, if that is the case we must 
	-- still record a value in the prop_owner_entity_val table so that we can record previous and current values
	exec SetDeletedEntityValue @sup_tax_yr, @sup_num
           
 	FETCH NEXT FROM SUPP_GROUP_VW into @sup_tax_yr, @sup_num
end

CLOSE SUPP_GROUP_VW
DEALLOCATE SUPP_GROUP_VW

-- update the sup group to a status of 'A' which indicates that the supp group has been accepted
update sup_group
set status_cd = 'A', sup_accept_dt = GetDate(), sup_accept_by_id = @input_user_id
where sup_group_id = @input_sup_group

GO

