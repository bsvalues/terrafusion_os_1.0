
create procedure LayerOperationSelectPropData
	@lGeneralRunID int
as

	select
		lopal.lYear_From,
		lopal.lSupNum_From,
		lopal.lPropID_From,
		lopal.lYear_To,
		lopal.lSupNum_To,
		lopal.lPropID_To,
		
		upper(rtrim(p.prop_type_cd)),
		
		bParent = convert(
			bit,
			case
			when isnull(pv.udi_parent, '') in ('D', 'T')
			then 1
			else 0
			end
		),

		bChild = convert(
			bit,
			case
			when pv.udi_parent_prop_id > 0
			then 1
			else 0
			end
		)

	from dbo.layer_operation_prop_assoc_list as lopal with(nolock)
	join dbo.property_val as pv with(nolock) on
		pv.prop_val_yr = lopal.lYear_From and
		pv.sup_num = lopal.lSupNum_From and
		pv.prop_id = lopal.lPropID_From
	join dbo.property as p with(nolock) on
		p.prop_id = lopal.lPropID_From
	where
		lopal.lGeneralRunID = @lGeneralRunID
	order by 1, 2, 3

	return( @@rowcount )

GO

