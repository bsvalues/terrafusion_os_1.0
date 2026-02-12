
/******************************************************************************************
 Procedure: LevyCertificationAcceptRun
 Synopsis:	Performs validation checks, then accepts a Levy Certification Run and set the
			levy_Rate and certification date of all levies included in the run.
 Call From:	App Server
 ******************************************************************************************/
CREATE PROCEDURE LevyCertificationAcceptRun
	@levy_cert_run_id	int,
	@year				numeric(4,0),
	@pacs_user_id		int
AS
	set nocount on
	declare @return_message varchar(255)
	declare @levies varchar(4000)

	-- make sure the Levy Certification Run specifed exists and has a 'Coding' status.
	if not exists
	(
		select * from levy_cert_run with (nolock) 
		where	levy_cert_run_id	= @levy_cert_run_id 
			and [year]				= @year
			and [status]			= 'Coding'
	)
	begin
		set @return_message = 'No Levy Certification Run exists for the id and year specified with a "Coding" status.'
		goto quit
	end
	
	-- make sure the Captured Value Run used was created from certified values
	declare @captured_value_run_id int
	select @captured_value_run_id = captured_value_run_id
	from levy_cert_run where [year] = @year and levy_cert_run_id = @levy_cert_run_id
	
	if not exists
	(
		select * from captured_value_run 
		where captured_value_run_id = @captured_value_run_id and is_certified_value = 1
	)
	begin
		set @return_message = 'The Captured Value Run associated with the Levy Certification Run was not created from certified property values.'
		goto quit
	end



	-- make sure the Levy Certification Run specifed has no outstanding items or nulled final levy rates
	if exists
	(
		select * from levy_cert_run_detail with (nolock) 
		where	levy_cert_run_id		= @levy_cert_run_id 
			and [year]					= @year
			and isnull(outstanding_item_cnt, 0) > 0
	)
	begin
		set @return_message = 'One or more levies exist that have outstanding items.'
		goto quit
	end

	if exists
	(
		select * from levy_cert_hl_limit with (nolock)
		where	isnull(status, 0) = 0 
			and levy_cert_run_id = @levy_cert_run_id 
			and [year] = @year 
	)
	begin
		set @return_message =  'One or more levies in the Levy Certification Run do not have a calculated Highest Lawful Levy rate.'
		goto quit
	end
	
	if exists
	(
		select * from levy_cert_agg_limit with (nolock)
		where	isnull(status, 0) = 0 
			and levy_cert_run_id = @levy_cert_run_id 
			and [year] = @year 
	)
	begin
		set @return_message =  'One or more levies in the Levy Certification Run do not have a calculated Aggregate Limit rate.'
		goto quit
	end

	if exists
	(
		select * from levy_cert_const_limit with (nolock)
		where	isnull(status, 0) = 0 
			and levy_cert_run_id = @levy_cert_run_id 
			and [year] = @year 
	)
	begin
		set @return_message =  'One or more levies in the Levy Certification Run do not have a calculated Constitutional Limit rate.'
		goto quit
	end

	if exists
	(
		select * from levy_cert_run_detail with (nolock) 
		where	levy_cert_run_id = @levy_cert_run_id 
			and [year] = @year 
			and final_levy_rate is null
	)
	begin
		set @return_message =  'One or more levies in the Levy Certification Run do not have a calculated final levy rate.'
		goto quit
	end

	if exists
	(
		select * from levy_cert_stat_limit_detail with (nolock) 
		where	levy_cert_run_id = @levy_cert_run_id 
			and [year] = @year 
			and proration_occurred = 1
	)
	begin
		set @levies = (select	dbo.commalistconcatenate(levy_cd) from levy_cert_stat_limit_detail with (nolock) 
						where	levy_cert_run_id = @levy_cert_run_id 
						and		[year] = @year 
						and		proration_occurred = 1)
		set @return_message =  
		'The following levies in the Levy Certification Run have been affected by levy proration: ' + @levies + 
		'.   Please recalculate their Statutory Limits.'
		goto quit
	end

	declare @now datetime
	set @now = getdate()

	-- update the levy rates and certification date
	update levy set 
		levy_rate = lcrd.final_levy_rate,
		senior_levy_rate = lcrd.final_senior_levy_rate,
		certification_date = @now
	from levy 
	join levy_cert_run_detail as lcrd on
			levy.[year]				= lcrd.[year]
		and levy.tax_district_id	= lcrd.tax_district_id
		and levy.levy_cd			= lcrd.levy_cd
	where 
			lcrd.levy_cert_run_id	= @levy_cert_run_id
		and lcrd.[year]				= @year
		
	--10747: Copy final levy rates up to next year's uncertified levies
	update levy set 
		levy_rate = lcrd.final_levy_rate,
		senior_levy_rate = lcrd.final_senior_levy_rate
	from levy 
	join levy_cert_run_detail as lcrd on
			levy.[year] - 1			= lcrd.[year] 
		and levy.tax_district_id	= lcrd.tax_district_id
		and levy.levy_cd			= lcrd.levy_cd
	where 
			lcrd.levy_cert_run_id	= @levy_cert_run_id
		and lcrd.[year]				= @year
		and isNull(levy.certification_date, '') = ''

	-- update the levy_cert_run table
	update levy_cert_run set
		[status] = 'Accepted',
		accepted_date = @now,
		accepted_by_id = @pacs_user_id
	where levy_cert_run_id = @levy_cert_run_id and [year] = @year

	update levy_cert_run set
		[status] = 'Cancelled',
		accepted_date = null,
		accepted_by_id = null
	where [year] = @year and [status] = 'Coding'

quit:
	select @return_message as return_message
	set nocount off

GO

