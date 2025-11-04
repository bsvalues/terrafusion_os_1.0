



CREATE PROCEDURE SetPreviousMarketValueOnAg
AS

set nocount on

declare @prop_id 	int
declare @prop_val_yr 	numeric(4,0)
declare @sup_num 	int
declare @land_seg_id 	int
declare @sale_id 	int
declare @prev_mkt_val	numeric(14,0)
declare @total_acres	numeric(18,4)
declare @size_acres	numeric(18,4)

DECLARE LAND_DETAIL_NEW_AG CURSOR FAST_FORWARD
FOR select land_detail.prop_id, land_detail.prop_val_yr, land_detail.sup_num, land_detail.land_seg_id, land_detail.sale_id
from land_detail, prop_supp_assoc
where land_detail.prop_id = prop_supp_assoc.prop_id
and land_detail.sup_num = prop_supp_assoc.sup_num
and land_detail.prop_val_yr = prop_supp_assoc.owner_tax_yr
and land_detail.prop_val_yr = land_detail.ag_eff_tax_year
and land_detail.ag_apply = 'T'
and isnull(land_detail.new_ag_prev_val_override, 'F') = 'F'
order by land_detail.prop_val_yr, land_detail.prop_id

OPEN LAND_DETAIL_NEW_AG
FETCH NEXT FROM LAND_DETAIL_NEW_AG into @prop_id, @prop_val_yr, @sup_num, @land_seg_id, @sale_id

while (@@FETCH_STATUS = 0)
begin
	--Get Previous Market Value for entire property
	select @prev_mkt_val = (isnull(land_hstd_val, 0) + isnull(land_non_hstd_val, 0) + isnull(ag_market, 0) + isnull(timber_market, 0))
	from property_val, prop_supp_assoc
	where property_val.prop_id = prop_supp_assoc.prop_id
	and property_val.sup_num = prop_supp_assoc.sup_num
	and property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr
	and prop_supp_assoc.prop_id = @prop_id
	and prop_supp_assoc.owner_tax_yr = (@prop_val_yr - 1)

	--Get total current acres for entire property
	select @total_acres = sum(isnull(size_acres, 0))
	from land_detail, prop_supp_assoc
	where land_detail.prop_id = prop_supp_assoc.prop_id
	and land_detail.sup_num = prop_supp_assoc.sup_num
	and land_detail.prop_val_yr = prop_supp_assoc.owner_tax_yr
	and land_detail.sale_id = @sale_id
	and land_detail.prop_id = @prop_id
	and land_detail.sup_num = @sup_num
	and land_detail.prop_val_yr = @prop_val_yr

	--Get acres for just this land_detail
	select @size_acres = isnull(size_acres, 0)
	from land_detail, prop_supp_assoc
	where land_detail.prop_id = prop_supp_assoc.prop_id
	and land_detail.sup_num = prop_supp_assoc.sup_num
	and land_detail.prop_val_yr = prop_supp_assoc.owner_tax_yr
	and land_detail.land_seg_id = @land_seg_id
	and land_detail.sale_id = @sale_id
	and land_detail.prop_id = @prop_id
	and land_detail.sup_num = @sup_num
	and land_detail.prop_val_yr = @prop_val_yr

	--Now compute Previous Market value
	if (@prev_mkt_val > 0)
	begin
		if (@total_acres > 0)
		begin
			set @prev_mkt_val = @prev_mkt_val / @total_acres

			if (@size_acres > 0)
			begin
				set @prev_mkt_val = @prev_mkt_val * @size_acres
			end
			else
			begin
				set @prev_mkt_val = 0
			end
		end
		else
		begin
			set @prev_mkt_val = 0
		end
	end
	else
	begin
		set @prev_mkt_val = 0
	end

	--Now update the land_detail record
	update land_detail
	set land_detail.new_ag 			 = 'T',
	    land_detail.new_ag_prev_val 	 = @prev_mkt_val,
	    land_detail.new_ag_prev_val_override = 'F'
	where land_detail.land_seg_id = @land_seg_id
	and land_detail.sale_id = @sale_id
	and land_detail.prop_id = @prop_id
	and land_detail.sup_num = @sup_num
	and land_detail.prop_val_yr = @prop_val_yr 

	--Get next record
	FETCH NEXT FROM LAND_DETAIL_NEW_AG into @prop_id, @prop_val_yr, @sup_num, @land_seg_id, @sale_id
end

CLOSE LAND_DETAIL_NEW_AG
DEALLOCATE LAND_DETAIL_NEW_AG

GO

