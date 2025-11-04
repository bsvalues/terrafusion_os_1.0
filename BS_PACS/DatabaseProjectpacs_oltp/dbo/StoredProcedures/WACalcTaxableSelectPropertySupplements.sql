
create procedure WACalcTaxableSelectPropertySupplements
	@lYear numeric(4,0),
	@lSupNum int,
	@lPropID int,
	@lPacsUserID int
as


if ( @lPacsUserID <> 0)
begin
	-- select records for properties in the temporary table
	select
		convert(smallint, pv.prop_val_yr) as year,
		convert(smallint, pv.sup_num) as sup_num,
		pv.prop_id,
		o.owner_id,
		convert(smallint, past_pv.sup_num) as past_sup_num,
		past_o.owner_id as past_owner_id

	from #taxable_property_list tpl with(nolock)

	join property_val pv with(nolock)
	on tpl.year = pv.prop_val_yr
	and tpl.sup_num = pv.sup_num
	and tpl.prop_id = pv.prop_id

	join property_val past_pv with(nolock)
	on past_pv.prop_id = pv.prop_id
	and past_pv.prop_val_yr = pv.prop_val_yr
	and past_pv.sup_num <= pv.sup_num
	
	join owner o with(nolock)
	on o.owner_tax_yr = pv.prop_val_yr
	and o.sup_num = pv.sup_num
	and o.prop_id = pv.prop_id

	join owner past_o with(nolock)
	on past_o.owner_tax_yr = past_pv.prop_val_yr
	and past_o.sup_num = past_pv.sup_num
	and past_o.prop_id = past_pv.prop_id

	order by 1,2,3,4,5
end

else if ( @lPropID <> 0)
begin
	-- one specific property
	select
		convert(smallint, pv.prop_val_yr) as year,
		convert(smallint, pv.sup_num) as sup_num,
		pv.prop_id,
		o.owner_id,
		convert(smallint, past_pv.sup_num) as past_sup_num,
		past_o.owner_id as past_owner_id

	from property_val pv with(nolock)

	join property_val past_pv with(nolock)
	on past_pv.prop_id = pv.prop_id
	and past_pv.prop_val_yr = pv.prop_val_yr
	and past_pv.sup_num <= pv.sup_num
	
	join owner o with(nolock)
	on o.owner_tax_yr = pv.prop_val_yr
	and o.sup_num = pv.sup_num
	and o.prop_id = pv.prop_id

	join owner past_o with(nolock)
	on past_o.owner_tax_yr = past_pv.prop_val_yr
	and past_o.sup_num = past_pv.sup_num
	and past_o.prop_id = past_pv.prop_id

	where pv.prop_val_yr = @lYear
	and pv.sup_num = @lSupNum
	and pv.prop_id = @lPropID
	
	order by 1,2,3,4,5
end

else begin
	-- records for all properties in the given year/sup
	select
		convert(smallint, pv.prop_val_yr) as year,
		convert(smallint, pv.sup_num) as sup_num,
		pv.prop_id,
		o.owner_id,
		convert(smallint, past_pv.sup_num) as past_sup_num,
		past_o.owner_id as past_owner_id

	from property_val pv with(nolock)

	join property_val past_pv with(nolock)
	on past_pv.prop_id = pv.prop_id
	and past_pv.prop_val_yr = pv.prop_val_yr
	and past_pv.sup_num <= pv.sup_num
	
	join owner o with(nolock)
	on o.owner_tax_yr = pv.prop_val_yr
	and o.sup_num = pv.sup_num
	and o.prop_id = pv.prop_id

	join owner past_o with(nolock)
	on past_o.owner_tax_yr = past_pv.prop_val_yr
	and past_o.sup_num = past_pv.sup_num
	and past_o.prop_id = past_pv.prop_id

	where pv.prop_val_yr = @lYear
	and pv.sup_num = @lSupNum
	
	order by 1,2,3,4,5
end

GO

