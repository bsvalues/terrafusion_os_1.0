
CREATE procedure SupGroupResetTables

	@sup_group_id int,
	@btax_only bit = 0

as

set nocount on 

if(@btax_only = 0)
begin
	delete from td_sup_group_tax_area_subtotal
	with (tablock)
	where sup_group_id = @sup_group_id

	delete from td_sup_group_tax_area_summary
	with (tablock)
	where sup_group_id = @sup_group_id
	
	delete from td_sup_group_property_info
	with (tablock)
	where sup_group_id = @sup_group_id
end
else
begin
	update td_sup_group_tax_area_summary 
	set curr_tax = 0, prev_tax = 0, gl_tax = 0
	where sup_group_id = @sup_group_id

end

GO

