
create procedure LayerCopyTableEntityPropAssoc
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int
as

set nocount on

	declare @region varchar(551)
	
	select @region = szConfigValue
	from core_config with(nolock)
	where
		szGroup = 'SYSTEM' and
		szConfigName = 'REGION'
	
	--Not used in Washington	
	if @region = 'WA'
	begin
		return(0)
	end

	insert dbo.entity_prop_assoc with(rowlock) (
		entity_id,
		prop_id,
		entity_prop_id,
		entity_prop_pct,
		conv_taxable_val,
		conv_taxable_value,
		sup_num,
		tax_yr,
		annex_yr,
		entity_taxable_val,
		pct_imprv_hs,
		pct_imprv_nhs,
		pct_land_hs,
		pct_land_nhs,
		pct_ag_use,
		pct_ag_mkt,
		pct_tim_use,
		pct_tim_mkt,
		new_val_hs,
		new_val_hs_override,
		new_val_hs_override_amount,
		new_val_nhs,
		new_val_nhs_override,
		new_val_nhs_override_amount,
		new_val_p,
		new_val_p_override,
		new_val_p_override_amount
	)
	select
		epa.entity_id,
		@lPropID_To,
		epa.entity_prop_id,
		epa.entity_prop_pct,
		epa.conv_taxable_val,
		epa.conv_taxable_value,
		@lSupNum_To,
		@lYear_To,
		epa.annex_yr,
		epa.entity_taxable_val,
		epa.pct_imprv_hs,
		epa.pct_imprv_nhs,
		epa.pct_land_hs,
		epa.pct_land_nhs,
		epa.pct_ag_use,
		epa.pct_ag_mkt,
		epa.pct_tim_use,
		epa.pct_tim_mkt,
		case when @lYear_To <> 0 then epa.new_val_hs else null end,
		case when @lYear_To <> 0 then epa.new_val_hs_override else 0 end,
		case when @lYear_To <> 0 then epa.new_val_hs_override_amount else null end,
		case when @lYear_To <> 0 then epa.new_val_nhs else null end,
		case when @lYear_To <> 0 then epa.new_val_nhs_override else 0 end,
		case when @lYear_To <> 0 then epa.new_val_nhs_override_amount else null end,
		case when @lYear_To <> 0 then epa.new_val_p else null end,
		case when @lYear_To <> 0 then epa.new_val_p_override else 0 end,
		case when @lYear_To <> 0 then epa.new_val_p_override_amount else null end
	from dbo.entity_prop_assoc as epa with(nolock)
	join dbo.tax_rate as tr with(nolock) on
		tr.tax_rate_yr = @lYear_To and
		tr.entity_id = epa.entity_id
	where
		epa.tax_yr = @lYear_From and
		epa.sup_num = @lSupNum_From and
		epa.prop_id = @lPropID_From


	return(0)

GO

