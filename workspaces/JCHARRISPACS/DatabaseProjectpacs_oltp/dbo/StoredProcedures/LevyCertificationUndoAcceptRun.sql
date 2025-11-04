
CREATE PROCEDURE LevyCertificationUndoAcceptRun
	@levy_cert_run_id	int,
	@year				numeric(4,0),
	@pacs_user_id		int
AS
	set nocount on
	declare @return_message varchar(255)
	
	if not exists(select * from levy_cert_run with (nolock) where levy_cert_run_id = @levy_cert_run_id and [year] = @year)
	begin
		set @return_message = 'No Levy Certification Run exists for the ID specified.'
		goto quit
	end

	if exists(select * from levy_cert_run with (nolock) where levy_cert_run_id = @levy_cert_run_id and [year] = @year and [status] = 'Coding')
	begin
		set @return_message = 'Only a Levy Certification Run with an "Accepted" status may be set to unaccepted.'
		goto quit
	end

	declare @now datetime
	set @now = getdate()

	-- update the levy rates and certification date
	update levy set 
--		levy_rate = 0,
		certification_date = null
	from levy 
	join levy_cert_run_detail as lcrd on
			levy.[year]				= lcrd.[year]
		and levy.tax_district_id	= lcrd.tax_district_id
		and levy.levy_cd			= lcrd.levy_cd
	where 
			lcrd.levy_cert_run_id	= @levy_cert_run_id
		and lcrd.[year]				= @year

	-- update the levy_cert_run table
	update levy_cert_run set
		[status] = 'Coding',
		accepted_date = null,
		accepted_by_id = null,
		updated_date = @now,
		updated_by_id = @pacs_user_id
	where levy_cert_run_id = @levy_cert_run_id and [year] = @year

quit:
	select @return_message as return_message
	set nocount off

GO

