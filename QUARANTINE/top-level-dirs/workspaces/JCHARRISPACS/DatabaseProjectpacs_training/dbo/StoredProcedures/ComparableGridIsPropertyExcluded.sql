
create procedure ComparableGridIsPropertyExcluded
	@lPropID int,
	@lYear numeric(4,0),
	@bRS bit = 1,
	@bExcluded bit = null output
as

set nocount on

	set @bExcluded = 0

	declare
		@bSearchIncludeChild bit,
		@bSearchIncludeParent bit,
		@bSearchIncludeDeleted bit,
		@bExcludeIncompleteProps bit,
		@bUseImprovTypeInclusion bit

	select
		@bSearchIncludeChild = isnull(bSearchIncludeChild, 0),
		@bSearchIncludeParent = isnull(bSearchIncludeParent, 0),
		@bSearchIncludeDeleted = isnull(bSearchIncludeDeleted, 0),
		@bExcludeIncompleteProps = isnull(bExcludeIncompleteProps, 0),
		@bUseImprovTypeInclusion = isnull(bUseImprovTypeInclusion, 0)
	from comp_sales_config with(nolock)
	where lYear = @lYear

	declare @lSupNum int
	select @lSupNum = sup_num
	from prop_supp_assoc with(nolock)
	where
		owner_tax_yr = @lYear and
		prop_id = @lPropID

	declare
		@bIsChild bit,
		@bIsParent bit,
		@bIsDeleted bit,
		@bIsComplete bit,
		@bImprovClassExcluded bit,
		@bImprovTypeIncluded bit,
		@bTaxDistrictExcluded bit,
		@bEntityExcluded bit
		

	if ( @bSearchIncludeChild = 0 or @bSearchIncludeParent = 0 or @bSearchIncludeDeleted = 0 )
	begin
		select
			@bIsChild = case when pv.udi_parent_prop_id is not null then 1 else 0 end,
			@bIsParent = case when isnull(pv.udi_parent, '') = '' then 0 else 1 end,
			@bIsDeleted = case when isnull(pv.udi_parent, '') = 'T' or pv.prop_inactive_dt is null then 0 else 1 end
		from property_val as pv with(nolock)
		where
			pv.prop_val_yr = @lYear and
			pv.sup_num = @lSupNum and
			pv.prop_id = @lPropID
	end

	select
		@bIsComplete = case when isnull(pp.percent_complete, 100.0) = 100.0 then 1 else 0 end,
		@bImprovClassExcluded = case when cgeidc.szClass is null then 0 else 1 end,
		@bImprovTypeIncluded = case when cgiit.szImprovType is not null then 1 else 0 end
	from property_profile as pp with(nolock)
	left outer join comparable_grid_exclude_improv_detail_class as cgeidc with(nolock) on
		cgeidc.szClass = pp.class_cd
	left outer join comparable_grid_include_improv_type as cgiit with(nolock) on
		cgiit.szImprovType = pp.imprv_type_cd
	where
		pp.prop_val_yr = @lYear and
		pp.prop_id = @lPropID
	
	--Check on whether the property is not excluded because by tax district criterion
	set @bTaxDistrictExcluded = 0
	if exists (
		select top 1 *
		from comparable_grid_exclude_tax_district_vw with(nolock)
		where
			prop_val_yr = @lYear
			and	sup_num = @lSupNum
			and	prop_id = @lPropID
	)
	begin
		set @bTaxDistrictExcluded = 1
	end
	
	if exists (
		select top 1 epa.tax_yr
		from entity_prop_assoc as epa with(nolock)
		join comparable_grid_exclude_entity as cgee with(nolock) on
			cgee.lEntityID = epa.entity_id
		where
			epa.tax_yr = @lYear and
			epa.sup_num = @lSupNum and
			epa.prop_id = @lPropID
	)
	begin
		set @bEntityExcluded = 1
	end
	else
	begin
		set @bEntityExcluded = 0
	end

	declare
		@bExcludeReasonChild bit,
		@bExcludeReasonParent bit,
		@bExcludeReasonDeleted bit,
		@bExcludeReasonIncomplete bit,
		@bExcludeReasonImprovType bit

	set @bExcludeReasonChild =
		case @bSearchIncludeChild
			when 1 then 0
			else @bIsChild
		end
	set @bExcludeReasonParent =
		case @bSearchIncludeParent
			when 1 then 0
			else @bIsParent
		end
	set @bExcludeReasonDeleted =
		case @bSearchIncludeDeleted
			when 1 then 0
			else @bIsDeleted
		end
	set @bExcludeReasonIncomplete =
		case
			when @bExcludeIncompleteProps = 1 and @bIsComplete = 0
			then 1
			else 0
		end
	set @bExcludeReasonImprovType =
		case
			when @bUseImprovTypeInclusion = 0 or @bImprovTypeIncluded = 1
			then 0
			else 1
		end

	if (
		@bExcludeReasonChild = 1 or
		@bExcludeReasonParent = 1 or
		@bExcludeReasonDeleted = 1 or
		@bExcludeReasonIncomplete = 1 or
		@bExcludeReasonImprovType = 1 or
		@bImprovClassExcluded = 1 or
		@bTaxDistrictExcluded = 1 or
		@bEntityExcluded = 1
	)
	begin
		set @bExcluded = 1
	end

set nocount off

	if ( @bRS = 1 )
	begin
		select
			bExcludeReasonChild = isNull(@bExcludeReasonChild, 0),
			bExcludeReasonParent = isNull(@bExcludeReasonParent, 0),
			bExcludeReasonDeleted = isNull(@bExcludeReasonDeleted, 0),
			bExcludeReasonIncomplete = isNull(@bExcludeReasonIncomplete, 0),
			bExcludeReasonImprovType = isNull(@bExcludeReasonImprovType, 0),
			bExcludeReasonImprovClass = isNull(@bImprovClassExcluded, 0),
			bExcludeReasonTaxDistrict = isNull(@bTaxDistrictExcluded, 0),
			bExcludeReasonEntity = isNull(@bEntityExcluded, 0)
	end

GO

