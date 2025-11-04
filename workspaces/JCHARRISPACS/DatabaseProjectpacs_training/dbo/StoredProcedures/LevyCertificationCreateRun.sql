
CREATE PROCEDURE LevyCertificationCreateRun
	@captured_value_run_id	int,
	@pacs_user_id			int,
	@description	varchar(50)
AS
	set nocount on
	declare @return_message varchar(255)
	declare @year				int
	declare @levy_cert_run_id	int

	select @year = [year] from captured_value_run where captured_value_run_id = @captured_value_run_id

	if @year is null
	begin
		set @return_message = 'No Captured Value Run exists for the ID specified.'
		goto quit
	end

	if not exists(select * from pacs_config_year with (nolock) where [year] = @year and szGroup = 'Levy Certification')
	begin
		set @return_message = 'No Levy Configuration data was found in the pacs_config_year table for the year.'
		goto quit
	end

	if exists(select * from levy_cert_run with (nolock) where [year] = @year and [status] = 'Accepted')
	begin
		set @return_message = 'A Levy Certification Run has already been accepted for the year.' 
		goto quit
	end

	-- get a new run id 
	set nocount on
	exec GetUniqueID 'levy_cert_run', @levy_cert_run_id output
	
	declare @implicit_price_deflator	numeric(13, 10)
	declare @general_limit_factor		numeric(8, 5)
	declare @aggregate_limit			numeric(6, 3)
	declare @real_prop_ratio			numeric(5, 4)
	declare @pers_prop_ratio			numeric(5, 4)
	declare @district_statutory_limit	numeric(13, 10)

	declare @reduce_banked_capacity_by_refund_amount bit
	set @reduce_banked_capacity_by_refund_amount = 1
	
	select @implicit_price_deflator = cast(szConfigValue as numeric(13,10)) from pacs_config_year with (nolock) 
	where 	[year] = @year and szGroup = 'Levy Certification' and szConfigName = 'implicit_price_deflator'

	select @general_limit_factor = cast(szConfigValue as numeric(8,5)) from pacs_config_year with (nolock) 
	where 	[year] = @year and szGroup = 'Levy Certification' and szConfigName = 'general_limit_factor'

	select @aggregate_limit = cast(szConfigValue as numeric(6,3)) from pacs_config_year with (nolock) 
	where 	[year] = @year and szGroup = 'Levy Certification' and szConfigName = 'aggregate_limit'

	select @real_prop_ratio = cast(szConfigValue as numeric(5,4)) from pacs_config_year with (nolock) 
	where 	[year] = @year and szGroup = 'Levy Certification' and szConfigName = 'real_prop_ratio'

	select @pers_prop_ratio = cast(szConfigValue as numeric(5,4)) from pacs_config_year with (nolock) 
	where 	[year] = @year and szGroup = 'Levy Certification' and szConfigName = 'pers_prop_ratio'

	select @district_statutory_limit = cast(szConfigValue as numeric(13,10)) from pacs_config_year with (nolock) 
	where 	[year] = @year and szGroup = 'Levy Certification' and szConfigName = 'statutory_limit'

	select @reduce_banked_capacity_by_refund_amount = case when lower(szConfigValue) in ('no','n','f','0') then 0 else 1 end from pacs_config_year with(nolock)
	where	[year] = @year and szGroup = 'Levy Certification' and szConfigName = 'reduce_banked_capacity_by_refund_amount'

	set nocount on
	insert into levy_cert_run
	(
		levy_cert_run_id,
		[year],
		[description],
		captured_value_run_id,
		implicit_price_deflator,
		general_limit_factor,
		aggregate_limit,
		real_prop_ratio,
		pers_prop_ratio,
		reduce_banked_capacity_by_refund_amount,
		[status],
		created_date,
		created_by_id
	)
	values
	(
		@levy_cert_run_id,
		@year,
		@description,
		@captured_value_run_id,
		@implicit_price_deflator,
		@general_limit_factor,
		@aggregate_limit,
		@real_prop_ratio,
		@pers_prop_ratio,
		@reduce_banked_capacity_by_refund_amount,
		'Coding',
		getdate(),
		@pacs_user_id
	)

	set nocount on
	insert into levy_cert_run_detail
	(
		levy_cert_run_id, 
		[year], 
		tax_district_id, 
		levy_cd, 
		levy_rate, 
		tax_base, 
		budget_amount, 
		outstanding_item_cnt
	)
	select
		@levy_cert_run_id, @year, levy.tax_district_id, levy.levy_cd, 0, 0, 0, 0
	from captured_value_summary_vw as cvs_vw with (nolock)
	join levy with (nolock) on
			levy.[year] = cvs_vw.[year] 
		and levy.tax_district_id = cvs_vw.tax_district_id
		and levy.levy_cd = cvs_vw.levy_cd
	where 
			cvs_vw.captured_value_run_id = @captured_value_run_id 
		and cvs_vw.[year] = @year
		and levy.include_in_levy_certification = 1


	-- insert statutory limit records for all levies included
	-- in the levy certification
	set nocount on
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
		isnull(cast(pcy.szConfigValue as numeric(13,10)), @district_statutory_limit)
	from levy_cert_run_detail as lcrd with (nolock)
	join levy_limit as ll with (nolock) on
			ll.[year]				= lcrd.[year]
		and ll.tax_district_id		= lcrd.tax_district_id
		and ll.levy_limit_type_cd	= 'STATUTORY'
	join tax_district as td with (nolock) on 
			td.tax_district_id = lcrd.tax_district_id
	left join pacs_config_year as pcy with (nolock) on 
			pcy.szGroup = 'StatutoryLimit'
		and pcy.[year] = lcrd.[year]
		and pcy.szConfigName = td.tax_district_type_cd
	where	lcrd.levy_cert_run_id	= @levy_cert_run_id
		and lcrd.[year]				= @year

	set nocount on
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
	join levy_limit as ll with (nolock) on
			ll.[year]				= lcrd.[year]
		and ll.tax_district_id		= lcrd.tax_district_id
		and ll.levy_cd				= lcrd.levy_cd
		and ll.levy_limit_type_cd	= 'STATUTORY'
	where	lcrd.levy_cert_run_id	= @levy_cert_run_id
		and lcrd.[year]				= @year


	-- insert highest lawful levy limit records for levies included in the levy
	-- certification run that have a levy_limit with a type code of 'HLL'
	set nocount on
	insert into levy_cert_hl_limit
	(
		levy_cert_run_id,
		[year],
		tax_district_id,
		levy_cd,
		[status],
		lid_lift
	)
	select
		lcrd.levy_cert_run_id,
		lcrd.[year],
		lcrd.tax_district_id,
		lcrd.levy_cd,
		0,
		case when lid_lift = 1 then 
			case when election_term is null or election_term = 0 then 1
			when lcrd.[year] <= isnull(end_year,0) then 1
			else 0
			end
		else 0
		end
	from levy_cert_run_detail as lcrd with (nolock)
	join levy_limit as ll with(nolock) on
			ll.[year]				= lcrd.[year]
		and ll.tax_district_id		= lcrd.tax_district_id
		and ll.levy_cd				= lcrd.levy_cd
		and ll.levy_limit_type_cd	= 'HLL'
	join ( 			
			select LEVY_RUN.* from (
				select max(levy_cert_run_id) levy_cert_run_id,  year, tax_district_id, levy_cd From levy_cert_hl_limit  with(nolock)  group by year, tax_district_id, levy_cd
			) LEVY_RUN
			inner join (
				select  max(year) year From levy_cert_hl_limit  with(nolock)
			) LEVY_YEAR
			on LEVY_RUN.year = LEVY_YEAR.year
	) MAX_CERT_RUN on -- retrieves our most recent and applicable settings (since they can change)
		 MAX_CERT_RUN.tax_district_id		= lcrd.tax_district_id
		and MAX_CERT_RUN.levy_cd				= lcrd.levy_cd
	join levy_cert_hl_limit lchl  with(nolock) on 
			lchl.levy_cert_run_id  = MAX_CERT_RUN.levy_cert_run_id
		and lchl.[year]				= MAX_CERT_RUN.[year]
		and lchl.tax_district_id		= lcrd.tax_district_id
		and lchl.levy_cd				= lcrd.levy_cd
	join levy l with(nolock) on
		l.[year] 				= MAX_CERT_RUN.[year]
		and l.tax_district_id		= lcrd.tax_district_id
		and l.levy_cd				= lcrd.levy_cd
	where	lcrd.levy_cert_run_id	= @levy_cert_run_id
		and lcrd.[year]				= @year

	--Now update the voted levy information for lid lifts
	update l 
	set l.voted_levy_rate = tdei.voted_rate, l.voted_levy_amt = tdei.voted_amount, l.voted_levy_is_senior_exempt = 1
	from levy l
	inner join levy_cert_hl_limit lchl on
	lchl.tax_district_id = l.tax_district_id and
	lchl.levy_cd = l.levy_cd and
	lchl.year = l.year 
	inner join tax_district_election_information tdei on
	tdei.tax_district_id = l.tax_district_id
	where  
	l.year = @year and
	lchl.lid_lift = 1 and
	lchl. levy_cert_run_id = @levy_cert_run_id	and 
	l.year <= tdei.year + isnull(term,999)

	--Now update the voted levy information for lid lifts
	update lchl
		set lchl.lid_lift_levy = tdei.voted_amount
	from levy_cert_hl_limit lchl 
	inner join tax_district_election_information tdei on
	tdei.tax_district_id = lchl.tax_district_id
	where  
	lchl.year = @year and
	lchl.lid_lift = 1 and
	lchl. levy_cert_run_id = @levy_cert_run_id	and 
	lchl.year <= tdei.year + isnull(term,999)



	-- insert aggregate limit records for levies included in the levy
	-- certification run that have a levy_limit record with a type code of 'AGGREGATE'
	set nocount on
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



	-- insert constitutional limit records for levies included in the levy
	-- certification run that have a levy_limit record with a type code of 'CONST'
	set nocount on
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


	-- call the recalculate stored procedure to recalculate all initial levy rates
	-- and statutory_limits
	set nocount on
	exec LevyCertificationRecalculate @levy_cert_run_id, @year, 1, 0, 1, @return_message
quit:
	set nocount off
	select cast(isnull(@return_message, '') as varchar(255)) as return_message

GO

