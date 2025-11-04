


CREATE PROCEDURE UndoAcceptSuppGroup
   @input_sup_group int,
   @input_user_id int
AS

if (@input_sup_group <> 0)
begin
	
	declare @sup_tax_yr numeric(4)
	declare @sup_num    int
	
	DECLARE SUPP_GROUP_VW SCROLL CURSOR
	FOR select sup_tax_yr,
		   sup_num 
	    from   supplement_vw
	    where  sup_group_id = @input_sup_group
	
	OPEN SUPP_GROUP_VW
	FETCH NEXT FROM SUPP_GROUP_VW into @sup_tax_yr, @sup_num
	
	while (@@FETCH_STATUS = 0)
	begin
	
		/* here we will calculate the entity/property exemption value and the 
		   entity/property taxable value */
		delete from property_entity_exemption
		where sup_num    = @sup_num
		and exmpt_tax_yr = @sup_tax_yr
		and owner_tax_yr = @sup_tax_yr
		and exists (select * from property_val
				where prop_id = property_entity_exemption.prop_id
				and     sup_num = property_entity_exemption.sup_num
				and     prop_val_yr = property_entity_exemption.owner_tax_yr
				and     accept_create_id is null) 
	
		delete from prop_owner_entity_val	
		where sup_num = @sup_num
		and   sup_yr  = @sup_tax_yr
		and exists (select * from property_val
				where prop_id = prop_owner_entity_val.prop_id
				and     sup_num = prop_owner_entity_val.sup_num
				and     prop_val_yr = prop_owner_entity_val.sup_yr
				and     accept_create_id is null) 
			
	 	FETCH NEXT FROM SUPP_GROUP_VW into @sup_tax_yr, @sup_num
	end
	
	CLOSE SUPP_GROUP_VW
	DEALLOCATE SUPP_GROUP_VW
	
	/* update the sup group to a status of 'L' which indicates that the supp group has been locked
	   and clear the accept fields
	 */
	update sup_group
	set status_cd = 'L', sup_accept_dt = NULL, sup_accept_by_id = NULL
	where sup_group_id = @input_sup_group

	/*
	 * Reset the sup_group_* tables for the Supplement Roll report
	 */

	exec SupGroupResetTables @input_sup_group
end

GO

