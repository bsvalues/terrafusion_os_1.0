
/******************************************************************************************
 Procedure: LevyCertificationDelete
 Synopsis:	Removes all records associated with a Levy Certification Run.
			
 Call From:	App Server
 ******************************************************************************************/
CREATE PROCEDURE LevyCertificationDelete
	@levy_cert_run_id	int,
	@year				numeric(4, 0)
AS
	declare @return_message varchar(255)
	set nocount on
	if exists(
		select * 
		from levy_cert_run as lcr with (nolock) 
		where	levy_cert_run_id	= @levy_cert_run_id
			and [year]				= @year
			and accepted_date		is not null
	)
	begin
		set @return_message = 'An "Accepted" Levy Certification Run may not be deleted.'
		goto quit
	end

	delete from levy_cert_stat_limit_reduction_assoc where levy_cert_run_id = @levy_cert_run_id and [year] = @year
	delete from levy_cert_agg_limit where levy_cert_run_id = @levy_cert_run_id and [year] = @year
	delete from levy_cert_const_limit where levy_cert_run_id = @levy_cert_run_id and [year] = @year
	delete from levy_cert_hl_limit where levy_cert_run_id = @levy_cert_run_id and [year] = @year
	delete from levy_cert_stat_limit_detail where levy_cert_run_id = @levy_cert_run_id and [year] = @year
	delete from levy_cert_stat_limit where levy_cert_run_id = @levy_cert_run_id and [year] = @year
	delete from levy_cert_run_detail where levy_cert_run_id = @levy_cert_run_id and [year] = @year
	delete from levy_cert_run where levy_cert_run_id = @levy_cert_run_id and [year] = @year

quit:
	select @return_message as return_message
	set nocount off

GO

