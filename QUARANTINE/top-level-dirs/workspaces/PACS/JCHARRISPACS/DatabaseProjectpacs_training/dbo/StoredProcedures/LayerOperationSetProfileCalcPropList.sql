
create procedure LayerOperationSetProfileCalcPropList
	@lGeneralRunID int,
	@lPacsUserID int,
	@szProcessName varchar(23)
as

set nocount on

	delete dbo.recalc_prop_list
	where pacs_user_id = @lPacsUserID

	if ( @szProcessName = 'SUPPLEMENTCREATE' )
	begin
		insert dbo.recalc_prop_list (pacs_user_id, sup_yr, sup_num, prop_id)
		select @lPacsUserID, lYear_To, lSupNum_To, lPropID_To
		from dbo.layer_operation_prop_assoc_list as lopal with(nolock)
		where
			lopal.lGeneralRunID = @lGeneralRunID
	end
	else if ( @szProcessName = 'SUPPLEMENTMOVE' )
	begin
		insert dbo.recalc_prop_list (pacs_user_id, sup_yr, sup_num, prop_id)
		select @lPacsUserID, lYear_From, lSupNum_To, lPropID_From
		from dbo.layer_operation_prop_assoc_list as lopal with(nolock)
		where
			lopal.lGeneralRunID = @lGeneralRunID
	end
	else if ( @szProcessName = 'FYLCREATE' )
	begin
		insert dbo.recalc_prop_list (pacs_user_id, sup_yr, sup_num, prop_id)
		select @lPacsUserID, 0, 0, lPropID_To
		from dbo.layer_operation_prop_assoc_list as lopal with(nolock)
		where
			lopal.lGeneralRunID = @lGeneralRunID
	end
	else if ( @szProcessName = 'SUPPLEMENTDELETE' )
	begin
		insert dbo.recalc_prop_list (pacs_user_id, sup_yr, sup_num, prop_id)
		select @lPacsUserID, psa.owner_tax_yr, psa.sup_num, psa.prop_id
		from dbo.layer_operation_prop_assoc_list as lopal with(nolock)
		join dbo.prop_supp_assoc as psa with(nolock) on
			psa.owner_tax_yr = lopal.lYear_From and
			psa.prop_id = lopal.lPropID_From
		where
			lopal.lGeneralRunID = @lGeneralRunID
	end
	else
	begin
		return(-1)
	end

	return(0)

GO

