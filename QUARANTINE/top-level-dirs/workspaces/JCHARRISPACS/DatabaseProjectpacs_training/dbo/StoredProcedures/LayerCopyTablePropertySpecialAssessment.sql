

create procedure [dbo].[LayerCopyTablePropertySpecialAssessment]
	@lYear_From numeric(4,0),
	@lSupNum_From int,
	@lPropID_From int,
	@lYear_To numeric(4,0),
	@lSupNum_To int,
	@lPropID_To int
	with recompile
as

set nocount on

	insert dbo.property_special_assessment with(rowlock) (
		year,
		sup_num,
		prop_id,
		agency_id,
		assessment_use_cd,
		assessment_amt,
		additional_fee_amt,
		imported_assessment_amt
	)
	select
		@lYear_To,
		@lSupNum_To,
		@lPropID_To,
		psa.agency_id,
		psa.assessment_use_cd,
		psa.assessment_amt,
		psa.additional_fee_amt,
		psa.imported_assessment_amt
	from dbo.property_special_assessment as psa with(nolock)

	--Make sure that the record doesnt already exist - PK constraint
	left join (select *
				from property_special_assessment with (nolock) 
				where year = @lYear_To
				and prop_id = @lPropID_To
				and sup_num = @lSupNum_To
		) as fy_psa
		on fy_psa.agency_id = psa.agency_id

	--Make sure that the special assessment isnt ending	
	join special_assessment_agency as saa with (nolock) 
		on psa.agency_id = saa.agency_id

	--Make sure that the special assessment record exists - FK constraint
	join special_assessment as sa with (nolock) 
		on sa.agency_id = psa.agency_id
	
	where
		psa.year = @lYear_From and
		psa.sup_num = @lSupNum_From and
		psa.prop_id = @lPropID_From and
		fy_psa.prop_id is null and
		isNull(year(saa.end_date), @lYear_To) >= @lYear_To
		and IsNull(sa.year, @lYear_To) = @lYear_To

	insert dbo.property_assessment_attribute_val (
		prop_val_yr,
		sup_num,
		prop_id,
		assessment_use_cd,
		impervious_surface,
		benefit_acres,
		multi_family_units
	)
	select
		@lYear_To,
		@lSupNum_To,
		@lPropID_To,
		assessment_use_cd,
		impervious_surface,
		benefit_acres,
		multi_family_units
	from dbo.property_assessment_attribute_val with(nolock)
	where
		prop_val_yr = @lYear_From and
		sup_num = @lSupNum_From and
		prop_id = @lPropID_From
		
	-- user_property_special_assessment
	exec dbo.LayerCopyUserTablePropertySpecialAssessment
		@lYear_From, @lSupNum_From, @lPropID_From,
		@lYear_To, @lSupNum_To, @lPropID_To
	
	return(0)

GO

