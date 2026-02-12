

create procedure CompSalesScoreProperty
	@lPacsUserID int,
	@lSubjectPropID int,
	@lCompPropID int,
	@lYear numeric(4,0),
	@fScore numeric(14,4) = 0.0 output,
	@cOutputRS char(1) = 'T'
as

set nocount on

	/* Variables to determine how to score a property */
	declare
		@lSchool int,
		@lCity int,
		@lSitus int,
		@lNeighborhood int,
		@lAbsSubdv int,
		@lState int,
		@lClassCode int,
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

	/* Get the values for scoring */
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
			@lClassCode = lClassCode,
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
			@lClassCode = lClassCode,
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

	/* Variables describing the subject property */
	declare
		@lSubjectSchoolID int,
		@lSubjectCityID int,
		@szSubjectNeighborhood varchar(10),
		@szSubjectAbsSubdv varchar(10),
		@szSubjectStateCode varchar(10),
		@szSubjectSitusStreet varchar(50),
		@szSubjectClassCode varchar(10),
		@lSubjectYearBuilt numeric(4,0),
		@lSubjectLivingArea numeric(14,0),
		@szSubjectConditionCode char(5),
		@szSubjectSubClassCode varchar(10)

	/* Variables describing the comparable property */
	declare
		@lCompSchoolID int,
		@lCompCityID int,
		@szCompNeighborhood varchar(10),
		@szCompAbsSubdv varchar(10),
		@szCompStateCode varchar(10),
		@szCompSitusStreet varchar(50),
		@szCompClassCode varchar(10),
		@lCompYearBuilt numeric(4,0),
		@lCompLivingArea numeric(14,0),
		@szCompConditionCode char(5),
		@szCompSubClassCode varchar(10)

	/* Get the subject property information */
	select
		@lSubjectSchoolID = pp.school_id,
		@lSubjectCityID = pp.city_id,
		@szSubjectNeighborhood = pp.neighborhood,
		@szSubjectAbsSubdv = pp.abs_subdv,
		@szSubjectStateCode = pp.state_cd,
		@szSubjectSitusStreet = situs.situs_street,
		@szSubjectClassCode = pp.class_cd,
		@lSubjectYearBuilt = pp.yr_blt,
		@lSubjectLivingArea = pp.living_area,
		@szSubjectConditionCode = pp.condition_cd,
		@szSubjectSubClassCode = pp.imprv_det_sub_class_cd
	from prop_supp_assoc as psa with(nolock)
	join property_profile as pp with(nolock) on
		pp.prop_id = psa.prop_id and
		pp.prop_val_yr = psa.owner_tax_yr and
		pp.sup_num = psa.sup_num
	left outer join situs with(nolock) on
		pp.prop_id = situs.prop_id
	where
		psa.prop_id = @lSubjectPropID and
		psa.owner_tax_yr = @lYear

	/* Get the comparable property information */
	select
		@lCompSchoolID = pp.school_id,
		@lCompCityID = pp.city_id,
		@szCompNeighborhood = pp.neighborhood,
		@szCompAbsSubdv = pp.abs_subdv,
		@szCompStateCode = pp.state_cd,
		@szCompSitusStreet = situs.situs_street,
		@szCompClassCode = pp.class_cd,
		@lCompYearBuilt = pp.yr_blt,
		@lCompLivingArea = pp.living_area,
		@szCompConditionCode = pp.condition_cd,
		@szCompSubClassCode = pp.imprv_det_sub_class_cd
	from prop_supp_assoc as psa with(nolock)
	join property_profile as pp with(nolock) on
		pp.prop_id = psa.prop_id and
		pp.prop_val_yr = psa.owner_tax_yr and
		pp.sup_num = psa.sup_num
	left outer join situs with(nolock) on
		pp.prop_id = situs.prop_id
	where
		psa.prop_id = @lCompPropID and
		psa.owner_tax_yr = @lYear

	/* Variables to compute the score */
	declare
		@fMaxScore numeric(14,4),
		@fElementScore numeric(14,4)

	set @fScore = 0.0
	set @fMaxScore = 0.0

	/* School */
	if (@lCompSchoolID is not null) and (@lSubjectSchoolID is not null)
	begin
		set @fMaxScore = @fMaxScore + @lSchool

		if @lCompSchoolID = @lSubjectSchoolID
		begin
			set @fScore = @fScore + @lSchool
		end
	end

	/* City */
	if (@lCompCityID is not null) and (@lSubjectCityID is not null)
	begin
		set @fMaxScore = @fMaxScore + @lCity

		if @lCompCityID = @lSubjectCityID
		begin
			set @fScore = @fScore + @lCity
		end
	end

	/* State code */
	if (@szCompStateCode is not null) and (@szSubjectStateCode is not null)
	begin
		set @fMaxScore = @fMaxScore + @lState

		if @szCompStateCode = @szSubjectStateCode
		begin
			set @fScore = @fScore + @lState
		end
	end

	/* Abstract / Subdivision */
	if (@szCompAbsSubdv is not null) and (@szSubjectAbsSubdv is not null)
	begin
		set @fMaxScore = @fMaxScore + @lAbsSubdv

		if @szCompAbsSubdv = @szSubjectAbsSubdv
		begin
			set @fScore = @fScore + @lAbsSubdv
		end
	end

	/* Neighborhood */
	if (@szCompNeighborhood is not null) and (@szSubjectNeighborhood is not null)
	begin
		set @fMaxScore = @fMaxScore + @lNeighborhood

		if @szCompNeighborhood = @szSubjectNeighborhood
		begin
			set @fScore = @fScore + @lNeighborhood
		end
	end

	/* Situs */
	if
		(
			(@szCompSitusStreet is not null) and (@szSubjectSitusStreet is not null)
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
			@lCompCityID <> @lSubjectCityID
		)
	begin
		set @fMaxScore = @fMaxScore + @lSitus
	end
	if (@lCompCityID = @lSubjectCityID) and (@szCompSitusStreet = @szSubjectSitusStreet)
	begin
		set @fScore = @fScore + @lSitus
	end

	/* Class */
	if (@szCompClassCode is not null) and (@szSubjectClassCode is not null)
	begin
		set @fMaxScore = @fMaxScore + @lClassCode

		if @szCompClassCode = @szSubjectClassCode
		begin
			set @fScore = @fScore + @lClassCode
		end
	end

	/* Living area */
	if isnull(@lCompLivingArea, 0) > 0 and isnull(@lSubjectLivingArea, 0) > 0 and @lLivingAreaPer > 0
	begin
		set @fMaxScore = @fMaxScore + @lLivingAreaMax

		set @fElementScore = cast(@lLivingAreaMax as numeric(14,4)) +
			cast(@lLivingAreaDec as numeric(14,4)) * (
				abs( cast( (@lSubjectLivingArea - @lCompLivingArea) as numeric(14,4) ) )
				/
				cast(@lLivingAreaPer as numeric(14,4))
			)

		if @fElementScore > 0.0
		begin
			set @fScore = @fScore + @fElementScore
		end
	end

	/* Year built */
	if isnull(@lCompYearBuilt, 0) > 0 and isnull(@lSubjectYearBuilt, 0) > 0 and @lYearBuiltPer > 0
	begin
		set @fMaxScore = @fMaxScore + @lYearBuiltMax

		set @fElementScore = cast(@lYearBuiltMax as numeric(14,4)) +
			cast(@lYearBuiltDec as numeric(14,4)) * (
				abs( cast( (@lSubjectYearBuilt - @lCompYearBuilt) as numeric(14,4) ) )
				/
				cast(@lYearBuiltPer as numeric(14,4))
			)

		if @fElementScore > 0.0
		begin
			set @fScore = @fScore + @fElementScore
		end
	end

	/* Sub Class */
	if isnull(@szCompSubClassCode, '') <> '' and isnull(@szSubjectSubClassCode, '') <> '' and @lSubClassPer > 0
	begin
		if ( @lSubClassMax > 0 )
		begin
			declare
				@lSubClassNumber_Subject bigint,
				@lSubClassNumber_Comp bigint

			select @lSubClassNumber_Subject = l64Number
			from code_number_assoc_linear with(nolock)
			where
				szType = 'SUBCLASS' and
				szCode = @szSubjectSubClassCode

			select @lSubClassNumber_Comp = l64Number
			from code_number_assoc_linear with(nolock)
			where
				szType = 'SUBCLASS' and
				szCode = @szCompSubClassCode

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

	/* Condition */
	if isnull(@szCompConditionCode, '') <> '' and isnull(@szSubjectConditionCode, '') <> ''
	begin
		set @fMaxScore = @fMaxScore + @lConditionCode

		if @szCompConditionCode = @szSubjectConditionCode
		begin
			set @fScore = @fScore + @lConditionCode
		end
	end

	/* Score can be no less than zero */
	if @fScore < 0.0
	begin
		set @fScore = 0.0
	end

	/* Ensure score is on a 0-100 range */
	if ( @lSubjectPropID = @lCompPropID )
	begin
		set @fScore = 100.0
	end
	else if @fMaxScore = 0.0
	begin
		set @fScore = 0.0
	end
	else
	begin
		set @fScore = (@fScore / @fMaxScore * 100.0)
	end

set nocount off

	if @cOutputRS = 'T'
	begin
		select fScore = @fScore
	end

GO

