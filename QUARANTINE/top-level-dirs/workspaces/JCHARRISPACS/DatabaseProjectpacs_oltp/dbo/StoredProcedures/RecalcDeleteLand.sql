
create procedure RecalcDeleteLand
	@lPacsUserID bigint,
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int = 0
as

set nocount on

	if ( @lPacsUserID != 0 )
	begin
			delete land_detail
			from land_detail
			join recalc_prop_list_current_division as rpl with(nolock) on
				land_detail.prop_id = rpl.prop_id and
				land_detail.prop_val_yr = rpl.sup_yr and
				land_detail.sup_num = rpl.sup_num and
				rpl.pacs_user_id = @lPacsUserID
			where
				land_detail.sale_id = @lSaleID and
				land_detail.land_type_cd = 'OA'
	end
	else
	begin
		if ( @lPropID = 0 )
		begin
			delete land_detail with(tablock)
			where
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				sale_id = @lSaleID and
				land_type_cd = 'OA'
		end
		else
		begin
			delete land_detail
			where
				prop_id = @lPropID and
				prop_val_yr = @lYear and
				sup_num = @lSupNum and
				sale_id = @lSaleID and
				land_type_cd = 'OA'
		end
	end

set nocount off

GO

