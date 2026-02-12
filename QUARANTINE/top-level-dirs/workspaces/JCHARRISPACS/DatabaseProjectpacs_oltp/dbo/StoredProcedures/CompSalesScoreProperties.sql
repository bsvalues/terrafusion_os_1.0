

create procedure CompSalesScoreProperties
	@lSubjectPropID int,
	@lSubjectPropYear numeric(4,0),
	@lPacsUserID int
as

set nocount on

	/* Variables to determine how to score a comparable */
	declare
		@lSchool int,
		@lCity int,
		@lNeighborhood int,
		@lAbsSubdv int,
		@lState int,
		@lLandType int,
		@lLandAreaMax int,
		@lLandAreaDec int,
		@lLandAreaPer int,
		@lSitus int,
		@lClass int,
		@lLivingAreaMax int,
		@lLivingAreaDec int,
		@lLivingAreaPer int,
		@lYearBuiltMax int,
		@lYearBuiltDec int,
		@lYearBuiltPer int,
		@lConditionCode int,
		@lSubClassMax int,
		@lSubClassDec int,
		@lSubClassPer int

	declare
		@lSubClassNumber_Subject bigint,
		@lSubClassNumber_Comp bigint

	/* Variables to process the cursor (for comparable properties) */
	declare
		@szSitusStreet varchar(50),
		@szSchool varchar(50),
		@szCity varchar(50),
		@szState varchar(50),
		@szRegion varchar(50),
		@szAbsSubdv varchar(50),
		@szNeighborhood varchar(50),
		@szSubset varchar(50),
		@szMapID varchar(50),
		@szImprvClass varchar(50),
		@lLivingArea numeric(14,0),
		@lYearBuilt numeric(4,0),
		@fImprvUnitPrice numeric(14,2),
		@lImprvAddVal numeric(14,0),
		@szLandType varchar(50),
		@fLandSqft numeric(18,2),
		@fLandAcres numeric(18,4),
		@fLandUP numeric(14,2),
		@lMarketVal numeric(14,0),
		@szSaleType varchar(50),
		@szSaleDate varchar(50),
		@lSalePrice numeric(14,0),
		@szConditionCode char(5),
		@szSubClassCode varchar(10)
	
	/* Variables describing the subject property */
	declare
		@lCompPropID int,
		@szSitusStreetSubject varchar(50),
		@szSchoolSubject varchar(50),
		@szCitySubject varchar(50),
		@szStateSubject varchar(50),
		@szAbsSubdvSubject varchar(50),
		@szNeighborhoodSubject varchar(50),
		@szImprvClassSubject varchar(50),
		@lLivingAreaSubject numeric(14,0),
		@lYearBuiltSubject numeric(4,0),
		@szConditionCodeSubject char(5),
		@szSubClassCodeSubject varchar(10)
	declare
		@fScore numeric(14,4),
		@fMaxScore numeric(14,4),
		@fElementScore numeric(14,4)

	/* Get the scoring information */
	if exists (
		select lSchool
		from sales_comp_score_improv with(nolock)
		where
			lPacsUserID = @lPacsUserID
	)
	begin
		select
			@lSchool = lSchool,
			@lCity = lCity,
			@lNeighborhood = lNeighborhood,
			@lAbsSubdv = lAbsSubdv,
			@lState = lState,
			@lSitus = lSitus,
			@lClass = lClassCode,
			@lLivingAreaMax = lLivingAreaMax,
			@lLivingAreaDec = lLivingAreaDec,
			@lLivingAreaPer = lLivingAreaPer,
			@lYearBuiltMax = lYearBuiltMax,
			@lYearBuiltDec = lYearBuiltDec,
			@lYearBuiltPer = lYearBuiltPer,
			@lConditionCode = lConditionCode,
			@lSubClassMax = isnull(lSubClassMax, 0),
			@lSubClassDec = isnull(lSubClassDec, 0),
			@lSubClassPer = isnull(lSubClassPer, 0)
		from sales_comp_score_improv with(nolock)
		where
			lPacsUserID = @lPacsUserID
	end
	else
	begin
		select
			@lSchool = lSchool,
			@lCity = lCity,
			@lNeighborhood = lNeighborhood,
			@lAbsSubdv = lAbsSubdv,
			@lState = lState,
			@lSitus = lSitus,
			@lClass = lClassCode,
			@lLivingAreaMax = lLivingAreaMax,
			@lLivingAreaDec = lLivingAreaDec,
			@lLivingAreaPer = lLivingAreaPer,
			@lYearBuiltMax = lYearBuiltMax,
			@lYearBuiltDec = lYearBuiltDec,
			@lYearBuiltPer = lYearBuiltPer,
			@lConditionCode = lConditionCode,
			@lSubClassMax = isnull(lSubClassMax, 0),
			@lSubClassDec = isnull(lSubClassDec, 0),
			@lSubClassPer = isnull(lSubClassPer, 0)
		from sales_comp_score_improv with(nolock)
		where
			lPacsUserID = 0
	end

	/* Get the subject property information */
	select
		@szSitusStreetSubject = situs.situs_street,
		@szSchoolSubject = school_entity.entity_cd,
		@szCitySubject = city_entity.entity_cd,
		@szStateSubject = pp.state_cd,
		@szAbsSubdvSubject = pp.abs_subdv,
		@szNeighborhoodSubject = pp.neighborhood,
		@szImprvClassSubject = pp.class_cd,
		@lLivingAreaSubject = pp.living_area,
		@lYearBuiltSubject = pp.yr_blt,
		@szConditionCodeSubject = pp.condition_cd,
		@szSubClassCodeSubject = pp.imprv_det_sub_class_cd
	from prop_supp_assoc as psa with(nolock)
	join property_profile as pp with(nolock) on
		psa.prop_id = pp.prop_id and
		psa.owner_tax_yr = pp.prop_val_yr
	left outer join situs with(nolock) on
		psa.prop_id = situs.prop_id and
		situs.primary_situs = 'Y'
	left outer join entity as city_entity with(nolock) on
		pp.city_id = city_entity.entity_id
	left outer join entity as school_entity with(nolock) on
		pp.school_id = school_entity.entity_id
	where
		psa.prop_id = @lSubjectPropID and
		psa.owner_tax_yr = @lSubjectPropYear

	select @lSubClassNumber_Subject = l64Number
	from code_number_assoc_linear with(nolock)
	where
		szType = 'SUBCLASS' and
		szCode = @szSubClassCodeSubject

	/* To enumerate the properties we will score */
	declare curProperties cursor
	for
		select
			convert(int, prop_id),
			situs_street,
			school,
			city,
			state_cd,
			region,
			abs_subdv,
			hood,
			subset,
			map_id,
			imprv_class,
			cast(living_area as numeric(14,0)),
			cast(year_built as numeric(4,0)),
			cast(imprv_up as numeric(14,2)),
			cast(imprv_add_val as numeric(14,0)),
			land_type,
			cast(land_sqft as numeric(18,2)),
			cast(land_acres as numeric(18,4)),
			cast(land_up as numeric(14,2)),
			cast(appraised_val as numeric(14,0)),
			sale_type,
			sale_date,
			sale_price,
			condition_cd,
			imprv_sub_class
		from #sales_comp_print
	for update of score

	open curProperties
	fetch next from curProperties into
		@lCompPropID,
		@szSitusStreet,
		@szSchool,
		@szCity,
		@szState,
		@szRegion,
		@szAbsSubdv,
		@szNeighborhood,
		@szSubset,
		@szMapID,
		@szImprvClass,
		@lLivingArea,
		@lYearBuilt,
		@fImprvUnitPrice,
		@lImprvAddVal,
		@szLandType,
		@fLandSqft,
		@fLandAcres,
		@fLandUP,
		@lMarketVal,
		@szSaleType,
		@szSaleDate,
		@lSalePrice,
		@szConditionCode,
		@szSubClassCode
	
	/* For each property to score */
	while @@fetch_status = 0
	begin
		set @fScore = 0.0
		set @fMaxScore = 0.0

		/* School */
		if isnull(@szSchool, '') <> '' and isnull(@szSchoolSubject, '') <> ''
		begin
			set @fMaxScore = @fMaxScore + @lSchool

			if @szSchool = @szSchoolSubject
			begin
				set @fScore = @fScore + @lSchool
			end
		end

		/* City */
		if isnull(@szCity, '') <> '' and isnull(@szCitySubject, '') <> ''
		begin
			set @fMaxScore = @fMaxScore + @lCity

			if @szCity = @szCitySubject
			begin
				set @fScore = @fScore + @lCity
			end
		end

		/* State code */
		if isnull(@szState, '') <> '' and isnull(@szStateSubject, '') <> ''
		begin
			set @fMaxScore = @fMaxScore + @lState

			if @szState = @szStateSubject
			begin
				set @fScore = @fScore + @lState
			end
		end

		/* Abstract / Subdivision */
		if isnull(@szAbsSubdv, '') <> '' and isnull(@szAbsSubdvSubject, '') <> ''
		begin
			set @fMaxScore = @fMaxScore + @lAbsSubdv

			if @szAbsSubdv = @szAbsSubdvSubject
			begin
				set @fScore = @fScore + @lAbsSubdv
			end
		end

		/* Neighborhood */
		if isnull(@szNeighborhood, '') <> '' and isnull(@szNeighborhoodSubject, '') <> ''
		begin
			set @fMaxScore = @fMaxScore + @lNeighborhood

			if @szNeighborhood = @szNeighborhoodSubject
			begin
				set @fScore = @fScore + @lNeighborhood
			end
		end

		/* Situs */
		if
			(
				(@szSitusStreet is not null) and (@szSitusStreetSubject is not null)
			)
			or
			(
				/*
					They can't possibly be on the same street if they are
					in different cities, so go ahead and add to max score.
					Well, I suppose they *could* be, but the benefits of
					a more accurate score in the case of not having situs
					street data, do outweigh, in my opinion, the possibility
					of overscoring a comparable, even if they are on the
					same street, in different cities (they could even be
					next door to each other).  However, since we have no
					way of knowing if James Way in Carrollton is the same
					physical street as James Way in Plano ... we will assume
					they are not.
				*/
				isnull(@szCity, '') <> isnull(@szCitySubject, '')
			)
		begin
			set @fMaxScore = @fMaxScore + @lSitus
		end
		if (isnull(@szCity, '') = isnull(@szCitySubject, '')) and (@szSitusStreet = @szSitusStreetSubject)
		begin
			set @fScore = @fScore + @lSitus
		end

		/* Class */
		if isnull(@szImprvClass, '') <> '' and isnull(@szImprvClassSubject, '') <> ''
		begin
			set @fMaxScore = @fMaxScore + @lClass

			if @szImprvClass = @szImprvClassSubject
			begin
				set @fScore = @fScore + @lClass
			end
		end

		/* Living area */
		if isnull(@lLivingArea, 0) > 0 and isnull(@lLivingAreaSubject, 0) > 0
		begin
			set @fMaxScore = @fMaxScore + @lLivingAreaMax

			set @fElementScore = cast(@lLivingAreaMax as numeric(14,4)) +
				cast(@lLivingAreaDec as numeric(14,4)) * (
					abs( cast( (@lLivingAreaSubject - @lLivingArea) as numeric(14,4) ) )
					/
					cast(@lLivingAreaPer as numeric(14,4))
				)

			if @fElementScore > 0.0
			begin
				set @fScore = @fScore + @fElementScore
			end
		end

		/* Year built */
		if isnull(@lYearBuilt, 0) > 0 and isnull(@lYearBuiltSubject, 0) > 0
		begin
			set @fMaxScore = @fMaxScore + @lYearBuiltMax

			set @fElementScore = cast(@lYearBuiltMax as numeric(14,4)) +
				cast(@lYearBuiltDec as numeric(14,4)) * (
					abs( cast( (@lYearBuiltSubject - @lYearBuilt) as numeric(14,4) ) )
					/
					cast(@lYearBuiltPer as numeric(14,4))
				)

			if @fElementScore > 0.0
			begin
				set @fScore = @fScore + @fElementScore
			end
		end

		/* Sub Class */
		if isnull(@szSubClassCode, '') <> '' and isnull(@szSubClassCodeSubject, '') <> '' and @lSubClassPer > 0
		begin
			if ( @lSubClassMax > 0 )
			begin
				set @lSubClassNumber_Comp = null

				select @lSubClassNumber_Comp = l64Number
				from code_number_assoc_linear with(nolock)
				where
					szType = 'SUBCLASS' and
					szCode = @szSubClassCode

				if ( @lSubClassNumber_Subject > 0 and @lSubClassNumber_Comp > 0 )
				begin
					set @fMaxScore = @fMaxScore + @lSubClassMax

					set @fElementScore = cast(@lSubClassMax as numeric(14,4)) +
						cast(@lSubClassDec as numeric(14,4)) * (
							abs( cast( (@lSubClassNumber_Subject - @lSubClassNumber_Comp) as numeric(14,4) ) )
							/
							cast(@lSubClassPer as numeric(14,4))
						)

					if @fElementScore > 0.0
					begin
						set @fScore = @fScore + @fElementScore
					end
				end
			end
		end

		/* Condition code */
		if isnull(@szConditionCode, '') <> '' and isnull(@szConditionCodeSubject, '') <> ''
		begin
			set @fMaxScore = @fMaxSCore + @lConditionCode

			if @szConditionCode = @szConditionCodeSubject
			begin
				set @fScore = @fScore + @lConditionCode
			end
		end


		/* Score can be no less than zero */
		if @fScore < 0.0
		begin
			set @fScore = 0.0
		end

		/* Update the table with the score */
		if @fMaxScore <= 0.0
		begin
			update #sales_comp_print set
				score = '0.0'
			where
				current of curProperties
		end
		else
		begin
			update #sales_comp_print set
				score = case
					when @lCompPropID = @lSubjectPropID
						then '100.0'
					else
						cast(
							convert(numeric(4,1), (@fScore / @fMaxScore * 100.0)) as varchar(50)
						)
				end
			where
				current of curProperties
		end

		fetch next from curProperties into
			@lCompPropID,
			@szSitusStreet,
			@szSchool,
			@szCity,
			@szState,
			@szRegion,
			@szAbsSubdv,
			@szNeighborhood,
			@szSubset,
			@szMapID,
			@szImprvClass,
			@lLivingArea,
			@lYearBuilt,
			@fImprvUnitPrice,
			@lImprvAddVal,
			@szLandType,
			@fLandSqft,
			@fLandAcres,
			@fLandUP,
			@lMarketVal,
			@szSaleType,
			@szSaleDate,
			@lSalePrice,
			@szConditionCode,
			@szSubClassCode
	end

	close curProperties
	deallocate curProperties

set nocount off

GO

