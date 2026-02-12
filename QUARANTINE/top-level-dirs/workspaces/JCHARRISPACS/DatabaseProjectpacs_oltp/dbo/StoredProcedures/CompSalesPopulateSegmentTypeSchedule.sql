

create procedure CompSalesPopulateSegmentTypeSchedule
	@lAppraisalYear numeric(4,0),
	@cMethod char(5),
	@cMidPointMethod char(1),
	@cReplaceExisting char(1) = 'T',
	@cLeaveUserValues char(1) = 'T'
as
	/* To enumerate the improvement types and qualities */
	declare
		@cImprovementType char(10),
		@cQuality char(10)

	/* To enumerate the ranges for a specific type and quality */
	declare
		@fRangeMax numeric(18,1),
		@fRangeAdjPrice numeric(14,2)

	/* To find a midpoint and calculate the value */
	declare
		@lIDMin int,
		@lIDMax int,
		@lCount int,
		@fRangeAdjPrice1 numeric(14,2),
		@fRangeAdjPrice2 numeric(14,2)

	/*
		The main area adjustment factor, which we'll multiply
		against all the individual improvement range factors
	*/
	declare @fMainAreaAdjPct float(24)

	/* Text describing how an adjustment value was calculated */
	declare @szMethod varchar(255)

	select
		@fMainAreaAdjPct = main_area_adj_pct_factor / 100.0
	from comp_sales_config
	where
		lYear = @lAppraisalYear

	begin transaction

	/* Start over */
	if @cReplaceExisting = 'T'
	begin
		if @cLeaveUserValues = 'T'
		begin
			/* Remove only those that are system generated */
			delete imprv_sched_detail_comp with (tablockx)
			where
				imprv_yr = @lAppraisalYear and
				imprv_det_meth_cd = @cMethod and
				use_system_flag = 'T'
		end
		else
		begin
			/* Remove all */
			delete imprv_sched_detail_comp with (tablockx)
			where
				imprv_yr = @lAppraisalYear and
				imprv_det_meth_cd = @cMethod
		end
	end
	
	if @cMidPointMethod = 'T'
	begin
		/* To be used in finding a midpoint */
		create table #tmp_range
		(
			lID int identity(100000000,1) not null,
			fRangeAdjPrice numeric(14,2) not null
		)
	end

	/* Cursor to enumerate the improvement types and qualities */
	declare curTypeQuality insensitive cursor
	for
		select distinct
			imprv_det_type_cd, imprv_det_class_cd
		from imprv_sched_detail
		where
			imprv_yr = @lAppraisalYear and
			imprv_det_meth_cd = @cMethod
		order by
			imprv_det_type_cd asc, imprv_det_class_cd asc
	for read only

	open curTypeQuality
	fetch next from curTypeQuality into
		@cImprovementType, @cQuality

	/* For each distinct type and quality */
	while @@fetch_status = 0
	begin
		/* Check to see if we need to calculate a value */
		if @cLeaveUserValues = 'T' or @cReplaceExisting = 'T'
		begin
			if exists (
				select
					imprv_det_meth_cd
				from imprv_sched_detail_comp
				where
					imprv_yr = @lAppraisalYear and
					imprv_det_meth_cd = @cMethod and
					imprv_seg_type_cd = @cImprovementType and
					imprv_seg_quality_cd = @cQuality
			)
			begin
				/* A user defined value already exists */
				fetch next from curTypeQuality into
					@cImprovementType, @cQuality

				continue
			end
		end

		if @cMidPointMethod = 'T'
		begin
			/* Use the midpoint of the ranges on the improvement schedule */

			/* Empty the worktable */
			delete #tmp_range

			/* Populate the worktable with only the values we use to calculate the midpoint*/
			insert #tmp_range (
				fRangeAdjPrice
			)
			select
				range_adj_price
			from imprv_sched_detail
			where
				imprv_yr = @lAppraisalYear and
				imprv_det_meth_cd = @cMethod and
				imprv_det_type_cd = @cImprovementType and
				imprv_det_class_cd = @cQuality
			order by
				range_adj_price asc

			/* Calculate which row or rows to use in finding the midpoint */
			select
				@lIDMin = min(lID),
				@lIDMax = max(lID),
				@lCount = count(*)
			from #tmp_range

			set @lIDMin = @lIDMin + (@lCount / 2)
			set @lIDMax = @lIDMax - (@lCount / 2)

			if @lCount % 2 = 0
			begin
				set @lIDMin = @lIDMin - 1
				set @lIDMax = @lIDMax + 1
			end

			/*
				Get the midpoint, or the average of the
				two rows that compose the midpoint
			*/
			select
				@fRangeAdjPrice = avg(fRangeAdjPrice)
			from #tmp_range
			where
				lID >= @lIDMin and
				lID <= @lIDMax

			if @lIDMin = @lIDMax
			begin
				/* There was only one value used in the midpoint (Ex: odd number of ranges) */
				set @szMethod = 'Midpoint method: One midpoint value (' + cast(@fRangeAdjPrice as varchar(24)) + ')'
			end
			else
			begin
				select
					@fRangeAdjPrice1 = fRangeAdjPrice
				from #tmp_range
				where
					lID = @lIDMin

				select
					@fRangeAdjPrice2 = fRangeAdjPrice
				from #tmp_range
				where
					lID = @lIDMax

				/* There were two values used in the midpoint (Ex: even number of ranges) */
				set @szMethod =
					'Midpoint method: Average of the two midpoint values (' +
					cast(@fRangeAdjPrice1 as varchar(24)) + ' and ' +
					cast(@fRangeAdjPrice2 as varchar(24)) + ')'
			end

			set @szMethod = @szMethod + ' times MA Adj factor (' + cast( (@fMainAreaAdjPct * 100.0) as varchar(24) ) + '%)'

			insert imprv_sched_detail_comp (
				imprv_yr, imprv_det_meth_cd, imprv_seg_type_cd, imprv_seg_quality_cd, sqft_max, system_adj_factor, user_adj_factor, use_system_flag, midpoint_flag, szMethod
			) values (
				@lAppraisalYear, @cMethod, @cImprovementType, @cQuality, 0.0, @fRangeAdjPrice * @fMainAreaAdjPct, @fRangeAdjPrice * @fMainAreaAdjPct, 'T', 'T', @szMethod
			)
		end /* if midpoint method */
		else
		begin
			/* Use the ranges on the improvement schedule */

			/*
				Cursor to enumerate each range in the schedule
				for the current type and quality
			*/
			declare curRanges insensitive cursor
			for
				select
					range_max, range_adj_price
				from imprv_sched_detail
				where
					imprv_yr = @lAppraisalYear and
					imprv_det_meth_cd = @cMethod and
					imprv_det_type_cd = @cImprovementType and
					imprv_det_class_cd = @cQuality
				order by
					range_max asc, range_adj_price asc
			for read only

			open curRanges
			fetch next from curRanges into
				@fRangeMax, @fRangeAdjPrice

			/* For each range in the schedule for the current type and quality */
			while @@fetch_status = 0
			begin
				set @szMethod =
					'Range method: Adj factor (' + cast(@fRangeAdjPrice as varchar(24)) + ')' +
					' times MA Adj factor (' + cast( (@fMainAreaAdjPct * 100.0) as varchar(24) ) + '%)'

				insert imprv_sched_detail_comp (
					imprv_yr, imprv_det_meth_cd, imprv_seg_type_cd, imprv_seg_quality_cd, sqft_max, system_adj_factor, user_adj_factor, use_system_flag, midpoint_flag, szMethod
				) values (
					@lAppraisalYear, @cMethod, @cImprovementType, @cQuality, @fRangeMax, @fRangeAdjPrice * @fMainAreaAdjPct, @fRangeAdjPrice * @fMainAreaAdjPct, 'T', 'F', @szMethod
				)

				fetch next from curRanges into
					@fRangeMax, @fRangeAdjPrice
			end

			close curRanges
			deallocate curRanges
		end /* if non midpoint method */

		fetch next from curTypeQuality into
			@cImprovementType, @cQuality
	end

	close curTypeQuality
	deallocate curTypeQuality

	if @cMidPointMethod = 'T'
	begin
		drop table #tmp_range
	end

	commit transaction

GO

