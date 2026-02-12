

create procedure CompSalesPopulateQualitySchedule
	@lAppraisalYear numeric(4,0),
	@szMethod char(5),
	@cReplace char(1) = 'T',
	@cLeaveUserValues char(1) = 'T'
as

set nocount on

	begin transaction

	/* Start over */
	if @cReplace = 'T'
	begin
		if @cLeaveUserValues = 'T'
		begin
			/* Remove only values not overridden by the user */
			delete imprv_sched_detail_quality_comp with (tablockx)
			where
				imprv_yr = @lAppraisalYear and
				szImprovMethod = @szMethod and
				use_system_flag = 'T'
		end
		else
		begin
			/* Remove all values */
			delete imprv_sched_detail_quality_comp with (tablockx)
			where
				imprv_yr = @lAppraisalYear and
				szImprovMethod = @szMethod
		end
	end

	/*
		Table to hold the list of distinct quality codes
		and their respective adjustment amounts
	*/
	create table #tmp_quality
	(
		szQualityCode varchar(10) not null,
		fRangeAdjPrice numeric(14,2) not null
	)

	/*
		Table to use in finding the midpoint of a range
	*/
	create table #tmp_range
	(
		lID int identity(100000000,1) not null,
		fRangeAdjPrice numeric(14,2) not null
	)

	/* Populate the table */
	insert #tmp_quality (
		szQualityCode, fRangeAdjPrice
	)
	select
		distinct imprv_det_class_cd, 0.0
	from imprv_sched_detail
	where
		imprv_det_meth_cd = @szMethod and
		imprv_yr = @lAppraisalYear and
		imprv_det_type_cd in (
			select
				imprv_det_type_cd
			from imprv_det_type
			where
				comp_sales_main_area_flag = 'T'
		)

	/* Variable to enumerate the distinct quality codes */
	declare @szQualityCode char(10)
	
	/* The value of the adjustment for a quality */
	declare @fRangeAdjPrice numeric(14,2)

	/* To find a midpoint */
	declare
		@lIDMin int,
		@lIDMax int,
		@lCount int

	/* To enumerate the distinct quality codes */
	declare curQuality scroll cursor
	for
		select
			szQualityCode
		from #tmp_quality
	for read only

	open curQuality
	fetch next from curQuality into
		@szQualityCode

	/* For each quality */
	while @@fetch_status = 0
	begin
		/* Start over */
		delete #tmp_range

		/* Fill the table with the range of data for the current quality */
		insert #tmp_range (
			fRangeAdjPrice
		)
		select
			range_adj_price
		from imprv_sched_detail
		where
			imprv_det_meth_cd = @szMethod and
			imprv_yr = @lAppraisalYear and
			imprv_det_type_cd in (
				select
					imprv_det_type_cd
				from imprv_det_type
				where
					comp_sales_main_area_flag = 'T'
			) and
			imprv_det_class_cd = @szQualityCode
		order by
			range_max asc
			
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

		/* Store the midpoint for this quality */
		update #tmp_quality set
			fRangeAdjPrice = @fRangeAdjPrice
		where
			szQualityCode = @szQualityCode

		fetch next from curQuality into
			@szQualityCode
	end

	close curQuality
	deallocate curQuality

	/* We don't need this anymore */
	drop table #tmp_range

	/*
		Populate the quality adjustment table by
		joining the worktable to itself to produce
		all possible quality adjustments
	*/
	if @cReplace = 'T'
	begin
		insert imprv_sched_detail_quality_comp (
			imprv_yr, szImprovMethod, subject_quality_cd, comp_quality_cd, system_adj_factor, user_adj_factor, use_system_flag, szMethod
		)
		select
			@lAppraisalYear,
			@szMethod,
			t1.szQualityCode,
			t2.szQualityCode,
			t1.fRangeAdjPrice - t2.fRangeAdjPrice,
			t1.fRangeAdjPrice - t2.fRangeAdjPrice,
			'T',
			'Subject quality adj factor (' + cast(t1.fRangeAdjPrice as varchar(24)) + ') minus ' +
			'Comp quality adj factor (' + cast(t2.fRangeAdjPrice as varchar(24)) + ')'
		from #tmp_quality as t1
		cross join #tmp_quality as t2
		where
			t1.szQualityCode <> t2.szQualityCode and
			(
				@cLeaveUserValues = 'F'
				or
				not exists (
					select
						imprv_yr
					from imprv_sched_detail_quality_comp
					where
						imprv_yr = @lAppraisalYear and
						szImprovMethod = @szMethod and
						subject_quality_cd = t1.szQualityCode and
						comp_quality_cd = t2.szQualityCode
				)
			)
		order by
			t1.szQualityCode, t2.szQualityCode
	end
	else
	begin
		insert imprv_sched_detail_quality_comp (
			imprv_yr, szImprovMethod, subject_quality_cd, comp_quality_cd, system_adj_factor, user_adj_factor, use_system_flag, szMethod
		)
		select
			@lAppraisalYear,
			@szMethod,
			t1.szQualityCode,
			t2.szQualityCode,
			t1.fRangeAdjPrice - t2.fRangeAdjPrice,
			t1.fRangeAdjPrice - t2.fRangeAdjPrice,
			'T',
			'Subject quality adj factor (' + cast(t1.fRangeAdjPrice as varchar(24)) + ') minus ' +
			'Comp quality adj factor (' + cast(t2.fRangeAdjPrice as varchar(24)) + ')'
		from #tmp_quality as t1
		cross join #tmp_quality as t2
		where
			t1.szQualityCode <> t2.szQualityCode and
			not exists (
				select
					imprv_yr
				from imprv_sched_detail_quality_comp
				where
					imprv_yr = @lAppraisalYear and
					szImprovMethod = @szMethod and
					subject_quality_cd = t1.szQualityCode and
					comp_quality_cd = t2.szQualityCode
			)
		order by
			t1.szQualityCode, t2.szQualityCode
	end

	/* We don't need this anymore */
	drop table #tmp_quality

	commit transaction

set nocount off

GO

