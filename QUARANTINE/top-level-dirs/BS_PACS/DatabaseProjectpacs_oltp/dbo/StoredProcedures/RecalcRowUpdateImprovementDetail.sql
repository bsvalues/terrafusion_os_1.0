
create procedure RecalcRowUpdateImprovementDetail
	@lPropID int,
	@lYear numeric(4,0),
	@lSupNum int,
	@lSaleID int,
	@lImprovID int,
	@lImprovDetailID int,

	@dep_pct numeric(5,2),
	@size_adj_pct numeric(5,2),
	@unit_price numeric(14,2),
	@new_value numeric(14,0),
	@new_value_flag char(1),
	@add_factor numeric(5,2),

	@imprv_det_adj_factor numeric(8,6),
	@imprv_det_adj_amt numeric(14,0),
	@imprv_det_calc_val numeric(14,0),
	@imprv_det_adj_val numeric(14,0),
	@imprv_det_val numeric(18,0),

	@bUpdate_Class bit,
	@imprv_det_class_cd char(10),
	@bUpdate_Method bit,
	@imprv_det_meth_cd char(5),
	@bUpdate_SubClass bit,
	@imprv_det_sub_class_cd varchar(10),
	@imprv_det_area numeric(18,1),
	@yr_new numeric(4,0),

	@economic_pct numeric(5,2),
	@physical_pct numeric(5,2),
	@functional_pct numeric(5,2),
	@percent_complete numeric(5,2),
	@depreciated_replacement_cost_new numeric(14,0),
	@depreciation_yr numeric(4,0),
	@yr_built numeric(4,0),
	@actual_age numeric(4,0),
	
	@imprv_det_cost_unit_price numeric(14,2),
	@imprv_det_ms_val numeric(14,0),
	@imprv_det_ms_unit_price numeric(14,2)

as

set nocount on

	if (@imprv_det_ms_val < 0) begin
		select @imprv_det_ms_val = imprv_det_ms_val
		from imprv_detail
		where
			prop_id = @lPropID and
			prop_val_yr = @lYear and
			sup_num = @lSupNum and
			sale_id = @lSaleID and
			imprv_id = @lImprovID and
			imprv_det_id = @lImprovDetailID	
	end
	
	if (@imprv_det_ms_unit_price < 0) begin
		select @imprv_det_ms_unit_price = imprv_det_ms_unit_price
		from imprv_detail
		where
			prop_id = @lPropID and
			prop_val_yr = @lYear and
			sup_num = @lSupNum and
			sale_id = @lSaleID and
			imprv_id = @lImprovID and
			imprv_det_id = @lImprovDetailID	
	end	

	update imprv_detail
	set
		dep_pct = @dep_pct,
		size_adj_pct = @size_adj_pct,
		physical_pct_source = null,
		unit_price = @unit_price,
		new_value = @new_value,
		new_value_flag = @new_value_flag,
		add_factor = @add_factor,

		imprv_det_adj_factor = @imprv_det_adj_factor,
		imprv_det_adj_amt = @imprv_det_adj_amt,
		imprv_det_calc_val = @imprv_det_calc_val,
		imprv_det_adj_val = @imprv_det_adj_val,
		imprv_det_val = @imprv_det_val,

		imprv_det_class_cd = case @bUpdate_Class
			when 1 then @imprv_det_class_cd
			else imprv_det_class_cd
		end
		,
		imprv_det_meth_cd = case @bUpdate_Method
			when 1 then @imprv_det_meth_cd
			else imprv_det_meth_cd
		end
		,
		imprv_det_sub_class_cd = case @bUpdate_SubClass
			when 1 then @imprv_det_sub_class_cd
			else imprv_det_sub_class_cd
		end,
		imprv_det_area = @imprv_det_area,
		yr_new = @yr_new,

		economic_pct = @economic_pct,
		physical_pct = @physical_pct,
		functional_pct = @functional_pct,
		percent_complete = @percent_complete,
		depreciated_replacement_cost_new = @depreciated_replacement_cost_new,
		depreciation_yr = @depreciation_yr,
		yr_built = @yr_built,
		actual_age = @actual_age,
		
		imprv_det_cost_unit_price = @imprv_det_cost_unit_price,
		imprv_det_ms_val = @imprv_det_ms_val,
		imprv_det_ms_unit_price = @imprv_det_ms_unit_price

	where
		prop_id = @lPropID and
		prop_val_yr = @lYear and
		sup_num = @lSupNum and
		sale_id = @lSaleID and
		imprv_id = @lImprovID and
		imprv_det_id = @lImprovDetailID

GO

