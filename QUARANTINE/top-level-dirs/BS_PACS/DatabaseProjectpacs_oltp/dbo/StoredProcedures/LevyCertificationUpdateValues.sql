
CREATE PROCEDURE LevyCertificationUpdateValues
	@levy_cert_run_id		int,
	@captured_value_run_id	int,
	@pacs_user_id			int
AS
	set nocount on
	declare @return_message		varchar(255)
	declare @year				numeric(4, 0)

	select @year = [year] from captured_value_run where captured_value_run_id = @captured_value_run_id

	if @year is null
	begin
		set @return_message = 'No Captured Values Run exists for the ID specified.'
		goto quit
	end

	if not exists(select * from pacs_config_year with (nolock) where [year] = @year and szGroup = 'Levy Certification')
	begin
		set @return_message = 'No Levy Configuration data was found in the pacs_config_year table for year.'
		goto quit
	end

	if exists(select * from levy_cert_run with (nolock) where [year] = @year and [status] = 'Accepted')
	begin
		set @return_message = 'A Levy Certification Run has already been accepted for the year.'
		goto quit
	end

	if not exists(select * from levy_cert_run with (nolock) where levy_cert_run_id = @levy_cert_run_id)
	begin
		set @return_message = 'No Levy Certification Run exists for the ID specified.'
		goto quit
	end

	if not exists(select * from levy_cert_run with (nolock) where levy_cert_run_id = @levy_cert_run_id and [year] = @year)
	begin
		set @return_message = 'The year of the selected Captured Value Run must match the year of the Levy Certification Run being updated.'
		goto quit
	end

	if not exists(select * from levy_cert_run with (nolock) 
	where levy_cert_run_id = @levy_cert_run_id and [year] = @year and [status] = 'Coding')
	begin
		set @return_message = 'Only a Levy Certification Run with a "Coding" status may be updated.'
		goto quit
	end


	-- update the Levy Certification Run with the new Captured Value Run ID
	update levy_cert_run set
		captured_value_run_id = @captured_value_run_id,
		updated_date = getdate(),
		updated_by_id = @pacs_user_id
	where levy_cert_run_id = @levy_cert_run_id and [year] = @year

	
	-- remove any records from levy certification tables that no longer belong there

	-- levy_cert_hl_limit
	delete from levy_cert_hl_limit 
	where	levy_cert_run_id	= @levy_cert_run_id
		and [year]				= @year
		and not exists (
			select * from captured_value_summary_vw as cvs_vw with (nolock)
			where 	cvs_vw.captured_value_run_id	= @captured_value_run_id
				and cvs_vw.[year]					= @year
				and cvs_vw.tax_district_id			= levy_cert_hl_limit.tax_district_id
				and cvs_vw.levy_cd					= levy_cert_hl_limit.levy_cd
		)

	delete from levy_cert_hl_limit 
	where	levy_cert_run_id	= @levy_cert_run_id
		and [year]				= @year
		and not exists 
			(
				select * from levy_limit with (nolock)
				where	[year]				= @year
					and tax_district_id		= levy_cert_hl_limit.tax_district_id
					and levy_cd				= levy_cert_hl_limit.levy_cd
					and levy_limit_type_cd	= 'HLL'
			)

	delete from levy_cert_hl_limit 
	from levy_cert_hl_limit limit_table
	join levy with (nolock) on 
			levy.[year]				= limit_table.[year]
		and levy.tax_district_id	= limit_table.tax_district_id
		and levy.levy_cd			= limit_table.levy_cd
	where	limit_table.levy_cert_run_id	= @levy_cert_run_id
		and limit_table.[year]				= @year
		and isnull(levy.include_in_levy_certification, 0) = 0
		

	-- levy_cert_stat_limit_reduction_assoc
	delete from levy_cert_stat_limit_reduction_assoc
	where	levy_cert_run_id	= @levy_cert_run_id
		and [year]				= @year
		and not exists (
			select * from captured_value_summary_vw as cvs_vw with (nolock)
			where 	cvs_vw.captured_value_run_id	= @captured_value_run_id
				and cvs_vw.[year]					= @year
				and cvs_vw.tax_district_id			= levy_cert_stat_limit_reduction_assoc.tax_district_id
				and cvs_vw.levy_cd					= levy_cert_stat_limit_reduction_assoc.levy_cd
		)
		
	delete from levy_cert_stat_limit_reduction_assoc 
	where	levy_cert_run_id	= @levy_cert_run_id
		and [year]				= @year
		and not exists 
			(
				select * from levy_limit with (nolock)
				where	[year]				= @year
					and tax_district_id		= levy_cert_stat_limit_reduction_assoc.tax_district_id
					and levy_cd				= levy_cert_stat_limit_reduction_assoc.levy_cd
					and levy_limit_type_cd	= 'STATUTORY'
			)

	delete from levy_cert_stat_limit_reduction_assoc 
	from levy_cert_stat_limit_reduction_assoc limit_table
	join levy with (nolock) on 
			levy.[year]				= limit_table.[year]
		and levy.tax_district_id	= limit_table.tax_district_id
		and levy.levy_cd			= limit_table.levy_cd
	where	limit_table.levy_cert_run_id	= @levy_cert_run_id
		and limit_table.[year]				= @year
		and isnull(levy.include_in_levy_certification, 0) = 0
	
	
	-- levy_cert_stat_limit_detail
	delete from levy_cert_stat_limit_detail
	where	levy_cert_run_id	= @levy_cert_run_id
		and [year]				= @year
		and not exists (
			select * from captured_value_summary_vw as cvs_vw with (nolock)
			where 	cvs_vw.captured_value_run_id	= @captured_value_run_id
				and cvs_vw.[year]					= @year
				and cvs_vw.tax_district_id			= levy_cert_stat_limit_detail.tax_district_id
				and cvs_vw.levy_cd					= levy_cert_stat_limit_detail.levy_cd
		)

	delete from levy_cert_stat_limit_detail 
	where	levy_cert_run_id	= @levy_cert_run_id
		and [year]				= @year
		and not exists 
			(
				select * from levy_limit with (nolock)
				where	[year]				= @year
					and tax_district_id		= levy_cert_stat_limit_detail.tax_district_id
					and levy_cd				= levy_cert_stat_limit_detail.levy_cd
					and levy_limit_type_cd	= 'STATUTORY'
			)

	delete from levy_cert_stat_limit_detail 
	from levy_cert_stat_limit_detail limit_table
	join levy with (nolock) on 
			levy.[year]				= limit_table.[year]
		and levy.tax_district_id	= limit_table.tax_district_id
		and levy.levy_cd			= limit_table.levy_cd
	where	limit_table.levy_cert_run_id	= @levy_cert_run_id
		and limit_table.[year]				= @year
		and isnull(levy.include_in_levy_certification, 0) = 0


	-- levy_cert_stat_limit
	delete from levy_cert_stat_limit
	where	levy_cert_run_id	= @levy_cert_run_id
		and [year]				= @year
		and not exists (
			select * from captured_value_summary_vw as cvs_vw with (nolock)
			where 	cvs_vw.captured_value_run_id	= @captured_value_run_id
				and cvs_vw.[year]					= @year
				and cvs_vw.tax_district_id			= levy_cert_stat_limit.tax_district_id
		)

	delete from levy_cert_stat_limit
	where	levy_cert_run_id	= @levy_cert_run_id
		and [year]				= @year
		and not exists (
				select * from levy_cert_stat_limit_detail with (nolock)
				where	levy_cert_run_id	= @levy_cert_run_id
					and [year]				= @year
					and tax_district_id		= levy_cert_stat_limit.tax_district_id
			)


	-- levy_cert_agg_limit
	delete from levy_cert_agg_limit 
	where	levy_cert_run_id	= @levy_cert_run_id
		and [year]				= @year
		and not exists (
			select * from captured_value_summary_vw as cvs_vw with (nolock)
			where 	cvs_vw.captured_value_run_id	= @captured_value_run_id
				and cvs_vw.[year]					= @year
				and cvs_vw.tax_district_id			= levy_cert_agg_limit.tax_district_id
				and cvs_vw.levy_cd					= levy_cert_agg_limit.levy_cd
		)

	delete from levy_cert_agg_limit 
	where	levy_cert_run_id	= @levy_cert_run_id
		and [year]				= @year
		and not exists 
			(
				select * from levy_limit with (nolock)
				where	[year]				= @year
					and tax_district_id		= levy_cert_agg_limit.tax_district_id
					and levy_cd				= levy_cert_agg_limit.levy_cd
					and levy_limit_type_cd	= 'AGGREGATE'
			)

	delete from levy_cert_agg_limit 
	from levy_cert_agg_limit limit_table
	join levy with (nolock) on 
			levy.[year]				= limit_table.[year]
		and levy.tax_district_id	= limit_table.tax_district_id
		and levy.levy_cd			= limit_table.levy_cd
	where	limit_table.levy_cert_run_id	= @levy_cert_run_id
		and limit_table.[year]				= @year
		and isnull(levy.include_in_levy_certification, 0) = 0


	-- levy_cert_const_limit
	delete from levy_cert_const_limit 
	where	levy_cert_run_id	= @levy_cert_run_id
		and [year]				= @year
		and not exists (
			select * from captured_value_summary_vw as cvs_vw with (nolock)
			where 	cvs_vw.captured_value_run_id	= @captured_value_run_id
				and cvs_vw.[year]					= @year
				and cvs_vw.tax_district_id			= levy_cert_const_limit.tax_district_id
				and cvs_vw.levy_cd					= levy_cert_const_limit.levy_cd
		)

	delete from levy_cert_const_limit 
	where	levy_cert_run_id	= @levy_cert_run_id
		and [year]				= @year
		and not exists 
			(
				select * from levy_limit with (nolock)
				where	[year]				= @year
					and tax_district_id		= levy_cert_const_limit.tax_district_id
					and levy_cd				= levy_cert_const_limit.levy_cd
					and levy_limit_type_cd	= 'CONST'
			)

	delete from levy_cert_const_limit 
	from levy_cert_const_limit limit_table
	join levy with (nolock) on 
			levy.[year]				= limit_table.[year]
		and levy.tax_district_id	= limit_table.tax_district_id
		and levy.levy_cd			= limit_table.levy_cd
	where	limit_table.levy_cert_run_id	= @levy_cert_run_id
		and limit_table.[year]				= @year
		and isnull(levy.include_in_levy_certification, 0) = 0


	-- levy_cert_tif
	delete from levy_cert_tif
	where levy_cert_run_id = @levy_cert_run_id
	and year = @year
	and not exists(
		select 1 from captured_value_tif cvt with(nolock)
		where cvt.captured_value_run_id = @captured_value_run_id
		and cvt.year = @year
		and cvt.tax_district_id = levy_cert_tif.tax_district_id
		and cvt.levy_cd = levy_cert_tif.levy_cd
		and cvt.tif_area_id = levy_cert_tif.tif_area_id
	)

	delete from lct
	from levy_cert_tif lct
	join levy l with(nolock)
		on l.year = lct.year
		and l.tax_district_id = lct.tax_district_id
		and l.levy_cd = lct.levy_cd
	where lct.levy_cert_run_id = @levy_cert_run_id
		and lct.year = @year
		and isnull(l.include_in_levy_certification, 0) = 0


	-- levy_cert_run_detail
	delete from levy_cert_run_detail 
	where	levy_cert_run_id	= @levy_cert_run_id
		and [year]				= @year
		and not exists (
			select * from captured_value_summary_vw as cvs_vw with (nolock)
			where 	cvs_vw.captured_value_run_id	= @captured_value_run_id
				and cvs_vw.[year]					= @year
				and cvs_vw.tax_district_id			= levy_cert_run_detail.tax_district_id
				and cvs_vw.levy_cd					= levy_cert_run_detail.levy_cd
		)

	delete from levy_cert_run_detail 
	from levy_cert_run_detail limit_table
	join levy with (nolock) on 
			levy.[year]				= limit_table.[year]
		and levy.tax_district_id	= limit_table.tax_district_id
		and levy.levy_cd			= limit_table.levy_cd
	where	limit_table.levy_cert_run_id	= @levy_cert_run_id
		and limit_table.[year]				= @year
		and isnull(levy.include_in_levy_certification, 0) = 0
		


	-- add any new records to levy certification due to the addition of a new tax district or levies
	insert into levy_cert_run_detail
	(
		levy_cert_run_id,
		[year],
		tax_district_id,
		levy_cd,
		tax_base
	)
	select
		@levy_cert_run_id,
		@year,
		cvs_vw.tax_district_id,
		cvs_vw.levy_cd,
		case when levy.voted = 1 then
			-- include timber assessed value in voted levies based on the timber assessed code
			case when levy.timber_assessed_cd = 'FULL' then
					cvs_vw.taxable_value + isnull(levy.timber_assessed_full, 0) - cvs_vw.senior_value
			else
				case when isnull(levy.timber_assessed_half, 0) > isnull(levy.timber_assessed_roll, 0) then
					cvs_vw.taxable_value + isnull(levy.timber_assessed_half, 0) - cvs_vw.senior_value
				else
					cvs_vw.taxable_value + isnull(levy.timber_assessed_roll, 0) - cvs_vw.senior_value
				end
			end
		else 
			cvs_vw.taxable_value -- do not include timber assessed value in non-voted levies
		end
	from captured_value_summary_vw as cvs_vw with (nolock)
	join levy with (nolock) on
			levy.[year] = cvs_vw.[year] 
		and levy.tax_district_id = cvs_vw.tax_district_id
		and levy.levy_cd = cvs_vw.levy_cd
		and levy.include_in_levy_certification = 1	-- only inlude these levies
	where 
			cvs_vw.captured_value_run_id = @captured_value_run_id 
		and cvs_vw.[year] = @year
		and not exists 
			(
				select * from levy_cert_run_detail as lcrd with (nolock)
				where	lcrd.levy_cert_run_id	= @levy_cert_run_id
					and lcrd.[year]				= @year
					and lcrd.tax_district_id	= cvs_vw.tax_district_id
					and lcrd.levy_cd			= cvs_vw.levy_cd
			)
		


	-- insert statutory limit records for all levies included
	-- in the levy certification that aren't already there
	declare @district_statutory_limit numeric(13, 10)

	select @district_statutory_limit = szConfigValue from pacs_config_year with (nolock) 
	where 	[year] = @year and szGroup = 'Levy Certification' and szConfigName = 'statutory_limit'

	insert into levy_cert_stat_limit 
	(
		levy_cert_run_id, 
		[year], 
		tax_district_id, 
		statutory_limit
	)
	select distinct 
		lcrd.levy_cert_run_id,
		lcrd.[year],
		lcrd.tax_district_id,
		convert(numeric(13, 10), isnull(pcy.szConfigValue, @district_statutory_limit))
	from levy_cert_run_detail as lcrd with (nolock)
	join levy_limit as ll with(nolock) on
			ll.[year]				= lcrd.[year]
		and ll.tax_district_id		= lcrd.tax_district_id
		and ll.levy_cd				= lcrd.levy_cd
		and ll.levy_limit_type_cd	= 'STATUTORY'
	join tax_district as td with (nolock) on
			td.tax_district_id		= lcrd.tax_district_id
	left join pacs_config_year as pcy with (nolock) on
			pcy.[year]				= lcrd.[year]
		and pcy.szGroup = 'StatutoryLimit'
		and pcy.szConfigName		= td.tax_district_type_cd
	where	lcrd.levy_cert_run_id	= @levy_cert_run_id
		and lcrd.[year]				= @year
		and not exists
		(
			select * 
			from levy_cert_stat_limit as lcsl with (nolock)
			where	lcsl.levy_cert_run_id	= @levy_cert_run_id
				and lcsl.[year]				= @year
				and lcsl.tax_district_id	= lcrd.tax_district_id
		)


	insert into levy_cert_stat_limit_detail
	(
		levy_cert_run_id,
		[year],
		tax_district_id,
		levy_cd,
		statutory_limit
	)
	select
		lcrd.levy_cert_run_id,
		lcrd.[year],
		lcrd.tax_district_id,
		lcrd.levy_cd,
		0
	from levy_cert_run_detail as lcrd with (nolock)
	join levy_cert_stat_limit as lcsl with (nolock) on
			lcsl.levy_cert_run_id		= lcrd.levy_cert_run_id
		and lcsl.[year]					= lcrd.[year]
		and lcsl.tax_district_id		= lcrd.tax_district_id
	where	lcrd.levy_cert_run_id		= @levy_cert_run_id
		and lcrd.[year]					= @year
		and not exists
		(
			select * 
			from levy_cert_stat_limit_detail as lcsld with (nolock)
			where	lcsld.levy_cert_run_id	= @levy_cert_run_id
				and lcsld.[year]			= @year
				and lcsld.tax_district_id	= lcrd.tax_district_id
				and lcsld.levy_cd			= lcrd.levy_cd
		)
		and exists 
		(
			select * from levy_limit with (nolock)
			where	[year]				= @year
				and tax_district_id		= lcrd.tax_district_id
				and levy_cd				= lcrd.levy_cd
				and levy_limit_type_cd	= 'STATUTORY'
		)

			
	-- insert highest lawful levy limit records for levies included in the levy
	-- certification run that have a levy_limit with a type code of 'HLL'
	-- and do not currently exist
	insert into levy_cert_hl_limit
	(
		levy_cert_run_id,
		[year],
		tax_district_id,
		levy_cd,
		[status]
	)
	select
		lcrd.levy_cert_run_id,
		lcrd.[year],
		lcrd.tax_district_id,
		lcrd.levy_cd,
		0
	from levy_cert_run_detail as lcrd with (nolock)
	join levy_limit as ll with(nolock) on
			ll.[year]				= lcrd.[year]
		and ll.tax_district_id		= lcrd.tax_district_id
		and ll.levy_cd				= lcrd.levy_cd
		and ll.levy_limit_type_cd	= 'HLL'
	where	lcrd.levy_cert_run_id	= @levy_cert_run_id
		and lcrd.[year]				= @year
		and not exists
		(
			select * 
			from levy_cert_hl_limit as lchl with (nolock)
			where	lchl.levy_cert_run_id	= @levy_cert_run_id
				and lchl.[year]				= @year
				and lchl.tax_district_id	= lcrd.tax_district_id
				and lchl.levy_cd			= lcrd.levy_cd
		)


	-- insert aggregate limit records for levies included in the levy
	-- certification run that have a levy_limit record with a type code of 'AGGREGATE'
	-- and do not currently exist
	insert into levy_cert_agg_limit
	(
		levy_cert_run_id,
		[year],
		tax_district_id,
		levy_cd,
		[status]
	)
	select
		lcrd.levy_cert_run_id,
		lcrd.[year],
		lcrd.tax_district_id,
		lcrd.levy_cd,
		0
	from levy_cert_run_detail as lcrd with (nolock)
	join levy_limit as ll with(nolock) on
			ll.[year]				= lcrd.[year]
		and ll.tax_district_id		= lcrd.tax_district_id
		and ll.levy_cd				= lcrd.levy_cd
		and ll.levy_limit_type_cd	= 'AGGREGATE'
	where	lcrd.levy_cert_run_id	= @levy_cert_run_id
		and lcrd.[year]				= @year
		and not exists
		(
			select * 
			from levy_cert_agg_limit as lcal with (nolock)
			where	lcal.levy_cert_run_id	= @levy_cert_run_id
				and lcal.[year]				= @year
				and lcal.tax_district_id	= lcrd.tax_district_id
				and lcal.levy_cd			= lcrd.levy_cd
		)



	-- insert constitutional limit records for levies included in the levy
	-- certification run that have a levy_limit record with a type code of 'CONST'
	-- and do not currently exist
	insert into levy_cert_const_limit
	(
		levy_cert_run_id,
		[year],
		tax_district_id,
		levy_cd,
		[status]
	)
	select
		lcrd.levy_cert_run_id,
		lcrd.[year],
		lcrd.tax_district_id,
		lcrd.levy_cd,
		0
	from levy_cert_run_detail as lcrd with (nolock)
	join levy_limit as ll with(nolock) on
			ll.[year]				= lcrd.[year]
		and ll.tax_district_id		= lcrd.tax_district_id
		and ll.levy_cd				= lcrd.levy_cd
		and ll.levy_limit_type_cd	= 'CONST'
	where	lcrd.levy_cert_run_id	= @levy_cert_run_id
		and lcrd.[year]				= @year
		and not exists
		(
			select * 
			from levy_cert_const_limit as lccl with (nolock)
			where	lccl.levy_cert_run_id	= @levy_cert_run_id
				and lccl.[year]				= @year
				and lccl.tax_district_id	= lcrd.tax_district_id
				and lccl.levy_cd			= lcrd.levy_cd
		)


	-- insert LTIF records for levies included in the levy certification run
	-- which which have LTIF value and currently do not exist
	insert levy_cert_tif
	(levy_cert_run_id, year, tax_district_id, levy_cd, tif_area_id)

	select lcrd.levy_cert_run_id,
		lcrd.year,
		lcrd.tax_district_id,
		lcrd.levy_cd,
		cvt.tif_area_id
	from levy_cert_run_detail lcrd with(nolock)
	join (
		select distinct tax_district_id, levy_cd, tif_area_id
		from captured_value_tif
		where captured_value_run_id = @captured_value_run_id
		and year = @year
	) cvt
	on cvt.tax_district_id = lcrd.tax_district_id 
	and cvt.levy_cd = lcrd.levy_cd
	
	where lcrd.levy_cert_run_id = @levy_cert_run_id
	and lcrd.year = @year
	and not exists(
		select 1 from levy_cert_tif lct with(nolock)
		where lct.levy_cert_run_id = @levy_cert_run_id
		and lct.year = @year
		and lct.tax_district_id = lcrd.tax_district_id
		and lct.levy_cd = lcrd.levy_cd
		and lct.tif_area_id = cvt.tif_area_id 
	)


	-- call the recalculate stored procedure to recalculate all initial levy rates
	-- and statutory_limits
	exec LevyCertificationRecalculate @levy_cert_run_id, @year, 0, 0, 1, @return_message output
	
quit:
	select @return_message as return_message
	set nocount off

GO

