
create procedure LayerCopyProration
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int

as

set nocount on

if (
	@lYear_From = @lYear_To and 
	@lPropID_From = @lPropID_To and 
	@lSupNum_From <> @lSupNum_To)
begin

	insert dbo.property_prorated_exemptions with(rowlock) (
		year,
		sup_num,
		prop_id,
		ex_tax_year,
		ex_owner_year,
		ex_sup_num,
		ex_prop_id,
		ex_owner_id,
		ex_type_cd
	)
	select
		@lYear_To,
		@lSupNum_To,
		@lPropID_To,
		ex_tax_year,
		ex_owner_year,
		ex_sup_num,
		ex_prop_id,
		ex_owner_id,
		ex_type_cd		
	from dbo.property_prorated_exemptions as ppe with(nolock)
	where
		ppe.year = @lYear_From and
		ppe.sup_num = @lSupNum_From and
		ppe.prop_id = @lPropID_From


	insert dbo.property_prorated_supplements with(rowlock) (
		year,
		sup_num,
		prop_id,
		past_sup_num,
		begin_date,
		end_date
	)
	select
		@lYear_To,
		@lSupNum_To,
		@lPropID_To,
		past_sup_num,
		begin_date,
		end_date
	from dbo.property_prorated_supplements as pps with(nolock)
	where
		pps.year = @lYear_From and
		pps.sup_num = @lSupNum_From and
		pps.prop_id = @lPropID_From

end

return(0)

GO

