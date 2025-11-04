
/******************************************************************************************
 Procedure: LevyCertificationRecalculate
 Synopsis:	Calculates the Tax Base, Levy Rate, and Outstanding Item Count for each levy
			within a Levy Certification Run.  If different from existing values, the record
			is updated and status flags in limit tables are reset

			If @recalc_limits is 1, the procedure also performs all initial calculations 
			for statutory limits.
 Call From:	LevyCertificationCreateRun, 
			LevyCertificationUpdateValues, 
			LevyCertificationAcceptRun
			App Server
 ******************************************************************************************/
CREATE PROCEDURE [LevyCertificationRecalculate]
	@levy_cert_run_id	int,
	@year				numeric(4, 0),
	@recalc_limits		bit = 0,
	@pacs_user_id		int = 0,
	@use_output			bit = 0,
	@output_message		varchar(255) = '' output 
AS
    SET NOCOUNT ON
    SET ANSI_WARNINGS  OFF
	declare @return_message varchar(255)

	if not exists(select * from levy_cert_run with (nolock) where levy_cert_run_id = @levy_cert_run_id and [year] = @year)
	begin
		set @return_message =  'No Levy Certification Run exists for the ID specified.' 
		goto quit
	end

	if not exists(select * from levy_cert_run with (nolock) where levy_cert_run_id = @levy_cert_run_id and [year] = @year and [status] = 'Coding')
	begin
		set @return_message =  'Only a Levy Certification Run with a "Coding" status may be modified.'
		goto quit
	end

	set nocount on

	-- update the levy_cert_run table with the latest user
	if @pacs_user_id > 0
	begin
		update levy_cert_run set
			updated_by_id = @pacs_user_id,
			updated_date = getdate()
		where levy_cert_run_id = @levy_cert_run_id and [year] = @year
	end

	-- we need to know the captured_value_run_id being used
	declare @captured_value_run_id int

	select @captured_value_run_id = captured_value_run_id
	from levy_cert_run with (nolock)
	where levy_cert_run_id = @levy_cert_run_id and [year] = @year


	-- make a table of values for active TIF levies in this levy certification
	select
		tal.tif_area_id, tal.year, tal.tax_district_id, tal.levy_cd, tal.linked_tax_district_id, tal.linked_levy_cd, cv.tif_taxable_value, 
		cv.tif_taxable_value - cv.tif_base_value - cv.tif_new_const_value
			- (case when cv.tif_state_value > cv.tif_prev_state_value then cv.tif_state_value - cv.tif_prev_state_value else 0 end) as tif_increment,
		cvs.taxable_value tif_sponsor_taxable_value,
		convert(bit, case when exists (
			select 1 from levy_limit ll
			where ll.year = tal.year
			and ll.tax_district_id = tal.tax_district_id
			and ll.levy_cd = tal.levy_cd
			and ll.levy_limit_type_cd = 'BUDGET'
		)
		and not exists (
			select 1 from levy_limit ll
			where ll.year = tal.year
			and ll.tax_district_id = tal.tax_district_id
			and ll.levy_cd = tal.levy_cd
			and ll.levy_limit_type_cd = 'HLL'
		)
		then 1 else 0 end) as is_originating_levy_budget_only
			
	into #active_tif_levies
	from levy_cert_tif lct

	join tif_area_levy tal with(nolock)
	on tal.tif_area_id = lct.tif_area_id
	and tal.year = lct.year
	and tal.tax_district_id = lct.tax_district_id
	and tal.levy_cd = lct.levy_cd

	cross apply (
		select  
			sum(tif_taxable_value) tif_taxable_value, sum(tif_base_value) tif_base_value, sum(tif_new_const_value) tif_new_const_value,
			sum(tif_state_value) tif_state_value, sum(tif_prev_state_value) tif_prev_state_value
		from captured_value_tif
		where captured_value_run_id = @captured_value_run_id
		and year = @year
		and lct.tax_district_id = captured_value_tif.tax_district_id
		and lct.levy_cd = captured_value_tif.levy_cd
		and lct.tif_area_id = captured_value_tif.tif_area_id
	) cv

	join captured_value_summary_vw cvs
	on cvs.captured_value_run_id = @captured_value_run_id
	and cvs.[year] = tal.[year]
	and cvs.tax_district_id = tal.linked_tax_district_id
	and cvs.levy_cd = tal.linked_levy_cd

	where lct.levy_cert_run_id = @levy_cert_run_id
	and lct.year = @year


	update atl
	set tif_increment = case when tif_increment < 0 then 0 
			when tif_increment > tif_taxable_value then tif_taxable_value 
			else tif_increment end
	from #active_tif_levies atl


	-- now step through all the levies in the levy certification run and perform the calculations needed for each
	declare 
		@tax_district_id int,
		@levy_cd varchar(10),
		@lcrd_levy_rate numeric(13,10),
		@lcrd_tax_base numeric(14,0),
		@lcrd_budget_amount numeric(14,2),
		@lcrd_outsanding_item_count int,
		@levy_voted bit,
		@levy_budget_received bit,
		@levy_budget_verified bit,
		@levy_1st_resolution_received bit,
		@levy_1st_resolution_verified bit,
		@levy_2nd_resolution_received bit,
		@levy_2nd_resolution_verified bit,
		@levy_budget_amount numeric(14,2),
		@levy_levy_rate numeric(13,10),
		@levy_voted_levy_amount numeric(14,0),
		@levy_voted_levy_rate numeric(13,10),
		@levy_timber_assessed_enable bit,
		@levy_timber_assessed_cd varchar(10),
		@levy_timber_assessed_full numeric(14,0),
		@levy_timber_assessed_half numeric(14,0),
		@levy_timber_assessed_roll numeric(14,0),
		@captured_value_taxable_value numeric(14,0),
		@captured_value_senior_value numeric(14,0),
		@calculated_tax_base numeric(14,0),
		@calculated_tav numeric(14,0),
		@calculated_levy_rate numeric(13,10),
		@calculated_budget_amount numeric(14,2),
		@calculated_outstanding_item_count int,
		@lid_lift bit

	declare LevyCertRunDetail cursor fast_forward for
		select 
			lcrd.tax_district_id, 
			lcrd.levy_cd, 
			isnull(lcrd.levy_rate, 0),
			isnull(lcrd.tax_base, 0), 
			isnull(lcrd.budget_amount, 0),
			isnull(lcrd.outstanding_item_cnt, 0),
			isnull(levy.voted, 0), 
			isnull(levy.budget_received_enable, 0),
			isnull(levy.budget_amount_enable, 0),
			isnull(first_resolution_enable, 0),
			isnull(first_percent_enable, 0),
			isnull(second_resolution_enable, 0),
			isnull(second_percent_enable, 0),
			isnull(levy.budget_amount, 0),
			isnull(levy.levy_rate, 0),
			isnull(levy.voted_levy_amt, 0),
			isnull(levy.voted_levy_rate, 0),
			isnull(levy.timber_assessed_enable,0),
			isnull(levy.timber_assessed_cd, 0),
			isnull(levy.timber_assessed_full, 0),
			isnull(levy.timber_assessed_half, 0),
			isnull(levy.timber_assessed_roll, 0),
			isnull(cvs_vw.taxable_value, 0),
			isnull(cvs_vw.exempted_senior_value, 0),
			isnull(lid_lift, 0)
	from levy_cert_run_detail as lcrd
	join levy on
			levy.[year]				= lcrd.[year]
		and levy.tax_district_id	= lcrd.tax_district_id
		and levy.levy_cd			= lcrd.levy_cd
	join captured_value_summary_vw as cvs_vw on
			cvs_vw.captured_value_run_id	= @captured_value_run_id
		and cvs_vw.[year]					= lcrd.[year]
		and cvs_vw.tax_district_id			= lcrd.tax_district_id
		and cvs_vw.levy_cd					= lcrd.levy_cd
	left join levy_cert_hl_limit as lchl on
			lchl.[year]				= lcrd.[year]
		and lchl.tax_district_id	= lcrd.tax_district_id
		and lchl.levy_cd			= lcrd.levy_cd
	where
		lcrd.levy_cert_run_id	= @levy_cert_run_id 
		and lcrd.[year]	= @year
		and not exists(
			select 1 from #active_tif_levies spon
			where spon.year = lcrd.year
			and spon.linked_tax_district_id = lcrd.tax_district_id
			and spon.linked_levy_cd = lcrd.levy_cd
		)


	open LevyCertRunDetail

	fetch next from LevyCertRunDetail into 
		@tax_district_id, 
		@levy_cd, 
		@lcrd_levy_rate, 
		@lcrd_tax_base, 
		@lcrd_budget_amount, 
		@lcrd_outsanding_item_count,
		@levy_voted, 
		@levy_budget_received, 
		@levy_budget_verified,
		@levy_1st_resolution_received, 
		@levy_1st_resolution_verified,
		@levy_2nd_resolution_received, 
		@levy_2nd_resolution_verified,
		@levy_budget_amount, 
		@levy_levy_rate, 
		@levy_voted_levy_amount, 
		@levy_voted_levy_rate,
		@levy_timber_assessed_enable,
		@levy_timber_assessed_cd, 
		@levy_timber_assessed_full, 
		@levy_timber_assessed_half, 
		@levy_timber_assessed_roll, 
		@captured_value_taxable_value, 
		@captured_value_senior_value,
		@lid_lift

	while @@fetch_status = 0
	begin
		set @calculated_tav = 0

		-- Determine the Lid Lift Limit to use for the tax base calculation
		if (@lid_lift = 1)
		begin
			set @calculated_tav = @levy_timber_assessed_full + @levy_timber_assessed_half;
		end
		else if (@levy_timber_assessed_enable = 1) begin
			-- Determine the Timber Assessed Value to use for the tax base calculation
			if @levy_timber_assessed_cd = 'FULL'
			begin
				set @calculated_tav = isNull(@levy_timber_assessed_full, 0) + isNull((select sum(isNull(timber_assessed_full, 0)) 
																from tax_district_joint 
																where tax_district_id = @tax_district_id
																and levy_cd = @levy_cd
																and [year] = @year), 0)
			end
			else if @levy_timber_assessed_cd = 'HALF/ROLL'
			begin
				if @levy_timber_assessed_half > @levy_timber_assessed_roll
				begin
					set @calculated_tav = isNull(@levy_timber_assessed_half, 0) + isNull((select sum(case when isNull(timber_assessed_half, 0) >= isNull(timber_assessed_roll, 0) 
																							then isNull(timber_assessed_half, 0)
																							else isNull(timber_assessed_roll, 0)
																						end)
																	from tax_district_joint 
																	where tax_district_id = @tax_district_id
																	and levy_cd = @levy_cd
																	and [year] = @year), 0)
				end
				else
				begin
					set @calculated_tav = isNull(@levy_timber_assessed_roll, 0) + isNull((select sum(case when isNull(timber_assessed_half, 0) >= isNull(timber_assessed_roll, 0)
																							then isNull(timber_assessed_half, 0)
																						else isNull(timber_assessed_roll, 0) 
																						end)
																	from tax_district_joint 
																	where tax_district_id = @tax_district_id
																	and levy_cd = @levy_cd
																	and [year] = @year), 0)															
				end
			end
		end

		-- calculate the tax base
		set @calculated_tax_base = @captured_value_taxable_value + isNull(@calculated_tav , 0)
		
		if @levy_voted = 0		-- Non-voted Levies
		begin
			if @levy_budget_received = 1
			begin
				-- for non-voted levies, if 'budget received' is checked, then standard values
				-- take precedence over voted values
				if @levy_budget_amount > 0
				begin
					set @calculated_budget_amount = @levy_budget_amount
					set @calculated_levy_rate = 
						case when isNull(@calculated_tax_base, 0) <> 0 
							-- Prevent arithmetic overflow error	
							and (@calculated_budget_amount / @calculated_tax_base) < 1
							then (@calculated_budget_amount / @calculated_tax_base) * 1000
							else 0 end
				end
				else if @levy_voted_levy_amount > 0
				begin
					set @calculated_budget_amount = @levy_voted_levy_amount
					set @calculated_levy_rate = case when isNull(@calculated_tax_base, 0) <> 0 
						-- Prevent arithmetic overflow error
						and (@calculated_budget_amount / @calculated_tax_base) < 1
						then (@calculated_budget_amount / @calculated_tax_base) * 1000
						else 0 end
				end
				else if @levy_voted_levy_rate > 0
				begin
					set @calculated_levy_rate = @levy_voted_levy_rate
					set @calculated_budget_amount = (@calculated_levy_rate * @calculated_tax_base) / 1000
				end
				else
				begin
					set @calculated_levy_rate = 0
					set @calculated_budget_amount = 0
				end
			end
			else 
			begin
				-- for non-voted levies, if 'budget received' is *not* checked, then 
				-- voted values take precedence over standard values
				if @levy_voted_levy_amount > 0
				begin
					set @calculated_budget_amount = @levy_voted_levy_amount
					set @calculated_levy_rate = case when isNull(@calculated_tax_base, 0) <> 0 
						-- Prevent arithmetic overflow error
						and (@calculated_budget_amount / @calculated_tax_base) < 1
						then (@calculated_budget_amount / @calculated_tax_base) * 1000
						else 0 end
				end
				else if @levy_voted_levy_rate > 0
				begin
					set @calculated_levy_rate = @levy_voted_levy_rate
					set @calculated_budget_amount = (@calculated_levy_rate * @calculated_tax_base) / 1000
				end
				else if @levy_budget_amount > 0
				begin
					set @calculated_budget_amount = @levy_budget_amount
					set @calculated_levy_rate = case when isNull(@calculated_tax_base, 0) <> 0 
						-- Prevent arithmetic overflow error
						and (@calculated_budget_amount / @calculated_tax_base) < 1
						then (@calculated_budget_amount / @calculated_tax_base) * 1000
						else 0 end
				end
				else 
				begin
					set @calculated_levy_rate = 0
					set @calculated_budget_amount = 0
				end
			end
		end
		else
		begin		-- Voted Levies
			-- for Voted levies, voted values take precedence over standard values
			if @levy_voted_levy_amount > 0
			begin
				set @calculated_budget_amount = @levy_voted_levy_amount
				set @calculated_levy_rate = case when isNull(@calculated_tax_base, 0) <> 0 
					-- Prevent arithmetic overflow error
					and (@calculated_budget_amount / @calculated_tax_base) < 1
					then (@calculated_budget_amount / @calculated_tax_base) * 1000
					else 0 end
			end
			else if @levy_voted_levy_rate > 0
			begin
				set @calculated_levy_rate = @levy_voted_levy_rate
				set @calculated_budget_amount = (@calculated_levy_rate * @calculated_tax_base) / 1000
			end
			else if @levy_budget_amount > 0
			begin
				set @calculated_budget_amount = @levy_budget_amount
				set @calculated_levy_rate = case when isNull(@calculated_tax_base, 0) <> 0 
					-- Prevent arithmetic overflow error
					and (@calculated_budget_amount / @calculated_tax_base) < 1
					then (@calculated_budget_amount / @calculated_tax_base) * 1000
					else 0 end
			end
			else 
			begin
				set @calculated_levy_rate = 0
				set @calculated_budget_amount = 0
			end
		end


		-- determine the number of outstanding items for the levy
		set @calculated_outstanding_item_count = 0
		if 	@levy_budget_received = 1 and @levy_budget_verified = 0
		begin
			set @calculated_outstanding_item_count = @calculated_outstanding_item_count + 1
		end
		if @levy_1st_resolution_received = 1 and @levy_1st_resolution_verified = 0
		begin
			set @calculated_outstanding_item_count = @calculated_outstanding_item_count + 1
		end
		if @levy_2nd_resolution_received = 1 and @levy_2nd_resolution_verified = 0
		begin
			set @calculated_outstanding_item_count = @calculated_outstanding_item_count + 1
		end


		-- compare the four calculated values to the values already stored in the levy_cert_run_detail
		-- and update the database if anything changed.
		if @calculated_levy_rate				<> @lcrd_levy_rate 
		or @calculated_budget_amount			<> @lcrd_budget_amount
		or @calculated_tax_base					<> @lcrd_tax_base
		or @calculated_outstanding_item_count	<> @lcrd_outsanding_item_count
		begin

--			print @levy_cd + ',' + cast(@calculated_levy_rate as varchar) + ' != ' + cast(@lcrd_levy_rate as varchar)
--				+ ',' + cast(@calculated_budget_amount as varchar) + ' != ' + cast(@lcrd_budget_amount as varchar)
--				+ ',' + cast(@calculated_tax_base as varchar) + ' != ' + cast(@lcrd_tax_base as varchar)
--				+ ',' + cast(@calculated_outstanding_item_count as varchar) + ' != ' + cast(@lcrd_outsanding_item_count as varchar)

			-- update the levy_cert_run_detail table

			update levy_cert_run_detail	set
				levy_rate				= @calculated_levy_rate,
				budget_amount			= @calculated_budget_amount,
				tax_base				= @calculated_tax_base,
				final_levy_rate			= 0,
				final_senior_levy_rate	= null,
				outstanding_item_cnt	= @calculated_outstanding_item_count
			where 
					levy_cert_run_id	= @levy_cert_run_id 
				and [year]				= @year
				and tax_district_id		= @tax_district_id
				and levy_cd				= @levy_cd				

			-- update flags for limit calculation tables if values changed
			update levy_cert_hl_limit set status = 0
			where	levy_cert_run_id	= @levy_cert_run_id
				and [year]				= @year
				and tax_district_id		= @tax_district_id
				and levy_cd				= @levy_cd

			update levy_cert_agg_limit set status = 0
			where	levy_cert_run_id	= @levy_cert_run_id
				and [year]				= @year
				and tax_district_id		= @tax_district_id
				and levy_cd				= @levy_cd

			update levy_cert_const_limit set status = 0
			where	levy_cert_run_id	= @levy_cert_run_id
				and [year]				= @year
				and tax_district_id		= @tax_district_id
				and levy_cd				= @levy_cd
		end


		fetch next from LevyCertRunDetail into 
			@tax_district_id, 
			@levy_cd, 
			@lcrd_levy_rate, 
			@lcrd_tax_base, 
			@lcrd_budget_amount, 
			@lcrd_outsanding_item_count,
			@levy_voted, 
			@levy_budget_received, 
			@levy_budget_verified,
			@levy_1st_resolution_received, 
			@levy_1st_resolution_verified,
			@levy_2nd_resolution_received, 
			@levy_2nd_resolution_verified,
			@levy_budget_amount, 
			@levy_levy_rate, 
			@levy_voted_levy_amount, 
			@levy_voted_levy_rate, 
			@levy_timber_assessed_enable,
			@levy_timber_assessed_cd, 
			@levy_timber_assessed_full, 
			@levy_timber_assessed_half, 
			@levy_timber_assessed_roll, 
			@captured_value_taxable_value, 
			@captured_value_senior_value,
			@lid_lift
	end

	close LevyCertRunDetail
	deallocate LevyCertRunDetail


	-- Update increments in [levy_cert_tif] for LTIF originating levies which are budget-only
	update lct
	set tif_non_senior_increment = atl.tif_increment, 
		tif_senior_increment = null,
		tif_non_senior_increment_override = 0,
		tif_senior_increment_override = 0
	from levy_cert_tif lct
	join #active_tif_levies atl
		on atl.tif_area_id = lct.tif_area_id
		and atl.year = lct.year
		and atl.tax_district_id = lct.tax_district_id
		and atl.levy_cd = lct.levy_cd
	where lct.levy_cert_run_id = @levy_cert_run_id
	and lct.year = @year
	and atl.is_originating_levy_budget_only = 1


	-- Update the LTIF sponsoring levies
	declare
		@sponsoring_tax_district_id int,
		@sponsoring_levy_cd varchar(10),
		@tif_increment numeric(14,0),
		@sponsoring_taxable_value numeric(14,0),
		@is_originating_levy_budget_only bit,
		@tif_increment_levy numeric(14,2),

		@sponsoring_budget_amount numeric(14,2),
		@sponsoring_levy_rate numeric(13,10)


		declare SponsoringLevies cursor fast_forward for
		select
			atl.year,
			atl.linked_tax_district_id,
			atl.linked_levy_cd,
			atl.is_originating_levy_budget_only,
			sum(atl.tif_increment) tif_increment,
			max(atl.tif_sponsor_taxable_value) tif_sponsor_taxable_value,
			sum(atl.tif_increment * lcrd.levy_rate * 0.001) tif_increment_levy
		from #active_tif_levies atl
		join levy_cert_run_detail lcrd with(nolock)
			on lcrd.levy_cert_run_id = @levy_cert_run_id
			and lcrd.year = atl.year
			and lcrd.tax_district_id = atl.tax_district_id
			and lcrd.levy_cd = atl.levy_cd
		group by atl.year, atl.linked_tax_district_id, atl.linked_levy_cd, atl.is_originating_levy_budget_only

		open SponsoringLevies

		fetch next from SponsoringLevies into 
			@year,
			@sponsoring_tax_district_id,
			@sponsoring_levy_cd,
			@is_originating_levy_budget_only,
			@tif_increment,
			@sponsoring_taxable_value,
			@tif_increment_levy

		while @@fetch_status = 0
		begin
			-- set the sponsoring levy to be budget only, if it isn't already
			delete levy_limit
			where year = @year
			and tax_district_id = @sponsoring_tax_district_id
			and levy_cd = @sponsoring_levy_cd
			and levy_limit_type_cd <> 'BUDGET'

			if not exists(
				select 1 from levy_limit
				where year = @year
				and tax_district_id = @sponsoring_tax_district_id
				and levy_cd = @sponsoring_levy_cd
				and levy_limit_type_cd = 'BUDGET'
			)
			begin
				insert levy_limit
				(year, tax_district_id, levy_cd, levy_limit_type_cd)
				values (@year, @sponsoring_tax_district_id, @sponsoring_levy_cd, 'BUDGET')
			end
		
			if @is_originating_levy_budget_only = 0
			begin
				-- always update the tax base
				update levy_cert_run_detail 
				set tax_base = @sponsoring_taxable_value
				where levy_cert_run_id = @levy_cert_run_id
					and year = @year
					and tax_district_id = @sponsoring_tax_district_id
					and levy_cd = @sponsoring_levy_cd
			end
			else begin
				-- the originating levy is budget only, so finish setting it up here
				-- calculate budget
				set @sponsoring_budget_amount = @tif_increment_levy
				set @sponsoring_levy_rate = 0
				if @sponsoring_taxable_value > 0
					set @sponsoring_levy_rate = @sponsoring_budget_amount * 1000.0 / @sponsoring_taxable_value

				-- update levy cert run detail
				update levy_cert_run_detail set
					tax_base = @sponsoring_taxable_value,
					budget_amount = @sponsoring_budget_amount,
					levy_rate = @sponsoring_levy_rate
				where levy_cert_run_id = @levy_cert_run_id
					and year = @year
					and tax_district_id = @sponsoring_tax_district_id
					and levy_cd = @sponsoring_levy_cd

				-- update levy
				update levy set
					budget_received_enable = 1,
					budget_received = getdate(),
					budget_amount = @sponsoring_budget_amount,
					budget_amount_enable = 1,
					levy_rate = @sponsoring_levy_rate,
					senior_levy_rate = null
				where year = @year
				and tax_district_id = @sponsoring_tax_district_id
				and levy_cd = @sponsoring_levy_cd
			end

			fetch next from SponsoringLevies into 
				@year,
				@sponsoring_tax_district_id,
				@sponsoring_levy_cd,
				@is_originating_levy_budget_only,
				@tif_increment,
				@sponsoring_taxable_value,
				@tif_increment_levy
		end

	close SponsoringLevies
	deallocate SponsoringLevies
		
	drop table #active_tif_levies


	-- update the final rate for levies that are not included in any limit calculations
	update lcrd
	set lcrd.final_levy_rate = l.levy_rate,
		lcrd.levy_rate = l.levy_rate,
		lcrd.final_senior_levy_rate = null
	from levy_cert_run_detail lcrd
	inner join levy l on 
		l.year = lcrd.year and
		l.tax_district_id = lcrd.tax_district_id and
		l.levy_cd = lcrd.levy_cd
	where	lcrd.levy_cert_run_id = @levy_cert_run_id
		and lcrd.[year] = @year
		and not exists 
		(
			select * from levy_limit with (nolock)
			where	levy_limit.[year] = lcrd.[year]
				and levy_limit.tax_district_id = lcrd.tax_district_id
				and levy_limit.levy_cd = lcrd.levy_cd
		)

	-- update the final rate using a straight budget calculation for levies with 
	-- a levy_limit = 'Budget'
	update lcrd
	set lcrd.final_levy_rate = case		when l.budget_amount = 0 or lcrd.tax_base = 0 
										-- Prevent arithmetic overflow error
										or isNull(Round(((1000 * l.budget_amount) / lcrd.tax_base), 10), 0) > 1000
										then 0 
										else isNull(Round(((1000 * l.budget_amount) / lcrd.tax_base), 10), 0) end,
		lcrd.levy_rate = case	when l.budget_amount = 0 or lcrd.tax_base = 0 
								-- Prevent arithmetic overflow error
								or isNull(Round(((1000 * l.budget_amount) / lcrd.tax_base), 10), 0) > 1000
								then 0 
								else isNull(Round(((1000 * l.budget_amount) / lcrd.tax_base), 10), 0) end,
		lcrd.final_senior_levy_rate = null
	from levy_cert_run_detail lcrd
	inner join levy l on 
		l.year = lcrd.year and
		l.tax_district_id = lcrd.tax_district_id and
		l.levy_cd = lcrd.levy_cd
	left join levy_link as ll on
			lcrd.[year]				= ll.[year] 
		and lcrd.tax_district_id	= ll.tax_district_id 
		and lcrd.levy_cd			= ll.levy_cd_linked
	where	lcrd.levy_cert_run_id = @levy_cert_run_id
		and	lcrd.[year] = @year
		and exists 
		(
			select * from levy_limit with (nolock)
			where	levy_limit.[year] = lcrd.[year]
				and levy_limit.tax_district_id = lcrd.tax_district_id
				and levy_limit.levy_cd = lcrd.levy_cd
				and levy_limit.levy_limit_type_cd  = 'Budget'
		)
		and not exists 
		(
			select * from levy_limit with (nolock)
			where	levy_limit.[year] = lcrd.[year]
				and levy_limit.tax_district_id = lcrd.tax_district_id
				and levy_limit.levy_cd = lcrd.levy_cd
				and levy_limit.levy_limit_type_cd  <> 'Budget'
		)

	-- update the beginning levy rates of other limit calculations that have 
	-- a budget calculation and an aggregrate/const limit calculation
	update lcal
	set lcal.original_levy_rate = lcrd.levy_rate, 
		lcal.original_senior_levy_rate = null,
		lcal.status = 0
	from levy_cert_agg_limit as lcal
	join levy_cert_run_detail as lcrd with (nolock) on
			lcrd.levy_cert_run_id	= lcal.levy_cert_run_id
		and lcrd.[year]				= lcal.[year]
		and lcrd.tax_district_id	= lcal.tax_district_id
		and lcrd.levy_cd			= lcal.levy_cd
	where	lcal.levy_cert_run_id = @levy_cert_run_id
		and	lcal.[year] = @year
		and exists 
		(
			select * from levy_limit with (nolock)
			where	levy_limit.[year] = lcal.[year]
				and levy_limit.tax_district_id = lcal.tax_district_id
				and levy_limit.levy_cd = lcal.levy_cd
				and levy_limit.levy_limit_type_cd  = 'Budget'
		)
		and exists 
		(
			select * from levy_limit with (nolock)
			where	levy_limit.[year] = lcal.[year]
				and levy_limit.tax_district_id = lcal.tax_district_id
				and levy_limit.levy_cd = lcal.levy_cd
				and levy_limit.levy_limit_type_cd  = 'AGGREGATE'
		)
		and not exists 
		(
			select * from levy_limit with (nolock)
			where	levy_limit.[year] = lcal.[year]
				and levy_limit.tax_district_id = lcal.tax_district_id
				and levy_limit.levy_cd = lcal.levy_cd
				and levy_limit.levy_limit_type_cd  in ('STATUTORY', 'HLL')
		)

	update lccl
	set lccl.original_levy_rate = lcrd.levy_rate, 
		lccl.original_senior_levy_rate = null,
		lccl.status = 0
	from levy_cert_const_limit as lccl
	join levy_cert_run_detail as lcrd with (nolock) on
			lcrd.levy_cert_run_id	= lccl.levy_cert_run_id
		and lcrd.[year]				= lccl.[year]
		and lcrd.tax_district_id	= lccl.tax_district_id
		and lcrd.levy_cd			= lccl.levy_cd
	where	lccl.levy_cert_run_id = @levy_cert_run_id
		and	lccl.[year] = @year
		and exists 
		(
			select * from levy_limit with (nolock)
			where	levy_limit.[year] = lccl.[year]
				and levy_limit.tax_district_id = lccl.tax_district_id
				and levy_limit.levy_cd = lccl.levy_cd
				and levy_limit.levy_limit_type_cd  = 'Budget'
		)
		and exists 
		(
			select * from levy_limit with (nolock)
			where	levy_limit.[year] = lccl.[year]
				and levy_limit.tax_district_id = lccl.tax_district_id
				and levy_limit.levy_cd = lccl.levy_cd
				and levy_limit.levy_limit_type_cd  = 'CONST'
		)
		and not exists 
		(
			select * from levy_limit with (nolock)
			where	levy_limit.[year] = lccl.[year]
				and levy_limit.tax_district_id = lccl.tax_district_id
				and levy_limit.levy_cd = lccl.levy_cd
				and levy_limit.levy_limit_type_cd  in ('STATUTORY', 'HLL', 'AGGREGATE')
		)


	-- ensure that the final levy rate for an HLL calculation is equal to the initial
	-- levy rate for subsequent calculations or set the status to zero.
	update lcal
	set lcal.original_levy_rate = lchll.highest_lawful_levy_rate, 
		lcal.original_senior_levy_rate = lchll.senior_highest_lawful_levy_rate,
		lcal.status = 0
	from levy_cert_agg_limit as lcal
	join levy_cert_hl_limit as lchll with (nolock) on
			lchll.levy_cert_run_id	= lcal.levy_cert_run_id
		and lchll.[year]				= lcal.[year]
		and lchll.tax_district_id	= lcal.tax_district_id
		and lchll.levy_cd			= lcal.levy_cd
	where	lcal.levy_cert_run_id = @levy_cert_run_id
		and	lcal.[year] = @year
		and lchll.status = 1
		and (isnull(lcal.original_levy_rate, -999) <> isnull(lchll.highest_lawful_levy_rate, -999) or
			 isnull(lcal.original_senior_levy_rate, -999) <> isnull(lchll.senior_highest_lawful_levy_rate, -999))

	update lccl
	set lccl.original_levy_rate = lchll.highest_lawful_levy_rate, 
		lccl.original_senior_levy_rate = lchll.senior_highest_lawful_levy_rate,
		lccl.status = 0
	from levy_cert_const_limit as lccl
	join levy_cert_hl_limit as lchll with (nolock) on
			lchll.levy_cert_run_id	= lccl.levy_cert_run_id
		and lchll.[year]				= lccl.[year]
		and lchll.tax_district_id	= lccl.tax_district_id
		and lchll.levy_cd			= lccl.levy_cd
	where	lccl.levy_cert_run_id = @levy_cert_run_id
		and	lccl.[year] = @year
		and lchll.status = 1
		and (isnull(lccl.original_levy_rate, -999) <> isnull(lchll.highest_lawful_levy_rate, -999) or
			 isnull(lccl.original_senior_levy_rate, -999) <> isnull(lchll.senior_highest_lawful_levy_rate, 999))
		and not exists 
		(
			select * from levy_limit with (nolock)
			where	levy_limit.[year] = lccl.[year]
				and levy_limit.tax_district_id = lccl.tax_district_id
				and levy_limit.levy_cd = lccl.levy_cd
				and levy_limit.levy_limit_type_cd  in ('AGGREGATE')
		)

	update lcrd
	set lcrd.final_levy_rate = lchll.highest_lawful_levy_rate,
		lcrd.final_senior_levy_rate = lchll.senior_highest_lawful_levy_rate
	from levy_cert_run_detail as lcrd with (nolock)
	join levy_cert_hl_limit as lchll with (nolock) on
			lchll.levy_cert_run_id	= lcrd.levy_cert_run_id
		and lchll.[year]				= lcrd.[year]
		and lchll.tax_district_id	= lcrd.tax_district_id
		and lchll.levy_cd			= lcrd.levy_cd
	where	lcrd.levy_cert_run_id = @levy_cert_run_id
		and	lcrd.[year] = @year
		and lchll.status = 1
		and (isnull(lcrd.final_levy_rate, 0) <> isnull(lchll.highest_lawful_levy_rate, 0) or
			 isnull(lcrd.final_senior_levy_rate, 0) <> isnull(lchll.senior_highest_lawful_levy_rate, 0))
		and not exists 
		(
			select * from levy_limit with (nolock)
			where	levy_limit.[year] = lcrd.[year]
				and levy_limit.tax_district_id = lcrd.tax_district_id
				and levy_limit.levy_cd = lcrd.levy_cd
				and levy_limit.levy_limit_type_cd  in ('AGGREGATE', 'CONST')
		)

	
	-- update the linked levy rate
	update levy_cert_stat_limit_detail set
			linked_levy_rate = tmp.levy_rate
	from levy_cert_stat_limit_detail 
	join (
		select 
			lcrd.levy_cert_run_id, lcrd.[year], lcrd.tax_district_id, lcrd.levy_cd, 
			sum(lcrd_linked.levy_rate) as levy_rate
		from levy_cert_run_detail as lcrd 
		join levy_link as ll on
				lcrd.[year]				= ll.[year] 
			and lcrd.tax_district_id	= ll.tax_district_id 
			and lcrd.levy_cd			= ll.levy_cd
		join levy_cert_run_detail as lcrd_linked on
				lcrd_linked.[year]				= ll.[year] 
			and lcrd_linked.levy_cert_run_id	= lcrd.levy_cert_run_id
			and lcrd_linked.tax_district_id		= ll.tax_district_id 
			and lcrd_linked.levy_cd				= ll.levy_cd_linked
		where	lcrd.levy_cert_run_id			= @levy_cert_run_id
			and lcrd.[year] = @year
		group by 
			lcrd.levy_cert_run_id, lcrd.[year], lcrd.tax_district_id, lcrd.levy_cd
	) as tmp on
				tmp.levy_cert_run_id	= levy_cert_stat_limit_detail.levy_cert_run_id
			and tmp.[year]				= levy_cert_stat_limit_detail.[year]
			and tmp.tax_district_id	= levy_cert_stat_limit_detail.tax_district_id
			and tmp.levy_cd			= levy_cert_stat_limit_detail.levy_cd

	-- The LevyCertificationCreateRun stored procedure calls this stored procedure with
	-- this value set to true.  The purpose is to update the initial statutory limit
	-- values based on each tax district's over-all statutory limit and the calculated
	-- levy rate for each levy individually.
	-- There can't be any separate senior rates yet, at this stage.

	if @recalc_limits = 1
	begin
		-- then create a temporary table that sums the levy rates of all levies per tax district
		select 
			lcsl.levy_cert_run_id,
			lcsl.[year],
			lcsl.tax_district_id,
			lcsl.statutory_limit,
			sum(isnull(lcrd.levy_rate, 0) + isnull(lcrd_linked.final_levy_rate, 0)) as tax_district_levy_rate
		into #summed_levy_rates
		from levy_cert_stat_limit as lcsl with (nolock)
		join levy_cert_stat_limit_detail as lcsld with (nolock) on
				lcsld.levy_cert_run_id	= lcsl.levy_cert_run_id
			and lcsld.[year]				= lcsl.[year]
			and lcsld.tax_district_id	= lcsl.tax_district_id
		join levy_cert_run_detail as lcrd with (nolock) on
				lcrd.levy_cert_run_id	= lcsld.levy_cert_run_id
			and lcrd.[year]				= lcsld.[year]
			and lcrd.tax_district_id	= lcsld.tax_district_id
			and lcrd.levy_cd			= lcsld.levy_cd
		left join levy_link as ll with (nolock) on
				lcrd.[year]				= ll.[year] 
			and lcrd.tax_district_id	= ll.tax_district_id 
			and lcrd.levy_cd			= ll.levy_cd
		left join levy_cert_run_detail as lcrd_linked with (nolock) on
				lcrd_linked.[year]				= lcsl.[year] 
			and lcrd_linked.levy_cert_run_id	= lcsl.levy_cert_run_id
			and lcrd_linked.tax_district_id		= lcsl.tax_district_id 
			and lcrd_linked.levy_cd				= ll.levy_cd_linked
		where
				lcsl.levy_cert_run_id	= @levy_cert_run_id
			and lcsl.[year]				= @year
		group by
			lcsl.levy_cert_run_id,
			lcsl.[year],
			lcsl.tax_district_id,
			lcsl.statutory_limit

		-- now update the statutory limit detail records
		update levy_cert_stat_limit_detail set
			statutory_limit = case when td.tax_district_levy_rate <> 0 then
				td.statutory_limit * ((isnull(lcrd.levy_rate, 0) + isnull(levy_cert_stat_limit_detail.linked_levy_rate, 0)) / td.tax_district_levy_rate)
				else 0 end
		from levy_cert_stat_limit_detail
		join levy_cert_run_detail as lcrd on
				lcrd.levy_cert_run_id	= levy_cert_stat_limit_detail.levy_cert_run_id
			and lcrd.[year]				= levy_cert_stat_limit_detail.[year]
			and lcrd.tax_district_id	= levy_cert_stat_limit_detail.tax_district_id
			and lcrd.levy_cd			= levy_cert_stat_limit_detail.levy_cd
		join #summed_levy_rates as td on
				td.levy_cert_run_id	= levy_cert_stat_limit_detail.levy_cert_run_id
			and td.[year]			= levy_cert_stat_limit_detail.[year]
			and td.tax_district_id	= levy_cert_stat_limit_detail.tax_district_id
		where td.tax_district_levy_rate <> 0
		drop table #summed_levy_rates
	end

	-- In cases where lcrd.levy_rate + lcsld.linked_levy_rate > statutory_limit,
	-- we have to prorate the difference off of the linked levies first, then 
	-- off the general levy if needed.
	-- NOTE:  If this calculation must change for any reason, then be sure to update the similar
	-- calculation that occurs for an individual levy in the LevyCertificationRecords class.
	-- Calculate only one statutory rate, based on the normal levy rates, not the senior rates.
	declare @linked_levy_rate numeric(13, 10),
			@statutory_limit numeric(13, 10),
			@calculated_limit numeric(13, 10),
			@linked_calculated_limit numeric(13, 10),
			@reduction_rate numeric(13, 10),
			@difference numeric(13, 10),
			@linked_levy_rate_sum numeric(13, 10)
				
	declare LevyCertStatLimitDetailCursor cursor fast_forward for
		select 
			lcsld.tax_district_id,
			lcsld.levy_cd,
			case 
				when lchll.lid_lift = 1 and lchll.status = 1 then
					case 
						when isnull(lchll.highest_lawful_levy_rate, 999) < lcrd.levy_rate then lchll.highest_lawful_levy_rate
						else lcrd.levy_rate
					end 
				else
					lcrd.levy_rate
			end as levy_rate, 
			lcsld.linked_levy_rate, 
			lcsld.statutory_limit,
			lcslra.reduction_levy_rate
		from levy_cert_run_detail as lcrd with (nolock)
		join levy_cert_stat_limit_detail as lcsld with (nolock) on
				lcsld.levy_cert_run_id	= lcrd.levy_cert_run_id
			and lcsld.[year]				= lcrd.[year]
			and lcsld.tax_district_id	= lcrd.tax_district_id
			and lcsld.levy_cd			= lcrd.levy_cd
		left join (
			select 
				lcslra.levy_cert_run_id, lcslra.[year], lcslra.tax_district_id, lcslra.levy_cd,
				sum(lcrd_reductions.final_levy_rate) as reduction_levy_rate
			from levy_cert_stat_limit_reduction_assoc as lcslra with (nolock)
			join levy_cert_run_detail as lcrd_reductions with (nolock) on
					lcrd_reductions.levy_cert_run_id	= lcslra.levy_cert_run_id
				and lcrd_reductions.[year]				= lcslra.[year]
				and lcrd_reductions.tax_district_id		= lcslra.reduction_tax_district_id
				and lcrd_reductions.levy_cd				= lcslra.reduction_levy_cd
			where	lcslra.levy_cert_run_id = @levy_cert_run_id
				and lcslra.[year] = @year
			group by 
				lcslra.levy_cert_run_id, lcslra.[year], lcslra.tax_district_id, lcslra.levy_cd
		) as lcslra on
				lcslra.levy_cert_run_id	= lcsld.levy_cert_run_id
			and lcslra.[year]			= lcsld.[year]
			and lcslra.tax_district_id	= lcsld.tax_district_id
			and lcslra.levy_cd			= lcsld.levy_cd
		left join levy_cert_hl_limit as lchll with (nolock) on
				lchll.levy_cert_run_id = lcrd.levy_cert_run_id
			and lchll.[year]				= lcrd.[year]
			and lchll.tax_district_id	= lcrd.tax_district_id
			and lchll.levy_cd			= lcrd.levy_cd
		where	lcrd.levy_cert_run_id = @levy_cert_run_id
			and lcrd.[year] = @year
			--and lcrd.levy_rate + lcsld.linked_levy_rate > lcsld.statutory_limit
--		group by 
--			lcsld.tax_district_id, lcsld.levy_cd, lcrd.levy_rate, lcsld.linked_levy_rate, lcsld.statutory_limit
	
	open LevyCertStatLimitDetailCursor

	fetch next from LevyCertStatLimitDetailCursor into 
		@tax_district_id, 
		@levy_cd, 
		@lcrd_levy_rate, 
		@linked_levy_rate,
		@statutory_limit,
		@reduction_rate
		
	while @@fetch_status = 0
	begin
		if @linked_levy_rate is null
		begin 
			set @linked_levy_rate = 0
		end

		if @reduction_rate is null
		begin
			set @reduction_rate = 0
		end
	
		set @statutory_limit = @statutory_limit - @reduction_rate
		if @statutory_limit < 0
		begin
			set @statutory_limit = 0
		end
		
		if @lcrd_levy_rate + @linked_levy_rate > @statutory_limit
		begin
			set @calculated_limit = @lcrd_levy_rate
			set @difference = @lcrd_levy_rate + @linked_levy_rate - @statutory_limit
			if @difference >= @linked_levy_rate
			begin
				set @difference = @difference - @linked_levy_rate
				set @linked_calculated_limit = 0
			end
			else
			begin
				set @linked_calculated_limit = @linked_levy_rate - @difference
				set @difference = 0
			end
			
			if @difference > 0
			begin
				set @calculated_limit = @calculated_limit - @difference
			end
		end
		else
		begin
			if @statutory_limit > @lcrd_levy_rate + @linked_levy_rate
			begin
				set @calculated_limit = @statutory_limit - @linked_levy_rate
			end
			else
			begin
				set @calculated_limit = @lcrd_levy_rate
			end
			set @linked_calculated_limit = @linked_levy_rate
		end
		
		if @calculated_limit < 0
		begin
			set @calculated_limit = 0
		end
				
		update levy_cert_stat_limit_detail set
			calculated_limit = @calculated_limit,
			linked_calculated_limit = @linked_calculated_limit
		where levy_cert_run_id = @levy_cert_run_id
			and [year] = @year
			and tax_district_id = @tax_district_id
			and levy_cd = @levy_cd

		select @linked_levy_rate_sum = sum(lcrd.levy_rate)
		from levy_link as ll with (nolock)
		join levy_cert_run_detail as lcrd with (nolock) on 
				lcrd.levy_cert_run_id = @levy_cert_run_id
			and lcrd.[year] = ll.[year]
			and lcrd.tax_district_id = ll.tax_district_id
			and lcrd.levy_cd = ll.levy_cd_linked
		where ll.[year] = @year
			and ll.tax_district_id = @tax_district_id
			and ll.levy_cd = @levy_cd
		
		if @linked_levy_rate_sum > 0  
		begin
			update levy_cert_run_detail set
				final_levy_rate = (levy_cert_run_detail.levy_rate / @linked_levy_rate_sum) * @linked_calculated_limit
			from levy_cert_run_detail 
			join levy_link as ll with (nolock) on
					ll.[year] = levy_cert_run_detail.[year]
				and ll.tax_district_id = levy_cert_run_detail.tax_district_id
				and ll.levy_cd_linked = levy_cert_run_detail.levy_cd
			where	levy_cert_run_detail.levy_cert_run_id = @levy_cert_run_id
				and levy_cert_run_detail.[year] = @year
				and ll.tax_district_id = @tax_district_id
				and ll.levy_cd = @levy_cd
		end
			
		fetch next from LevyCertStatLimitDetailCursor into 
			@tax_district_id, 
			@levy_cd, 
			@lcrd_levy_rate, 
			@linked_levy_rate,
			@statutory_limit,
			@reduction_rate
	end
	
	close LevyCertStatLimitDetailCursor
	deallocate LevyCertStatLimitDetailCursor

--	set nocount off
	SET ANSI_WARNINGS on	
quit:
	if @use_output = 1
		begin
			set @output_message = @return_message
		end
	else
		begin
			select @return_message as return_message
		end

GO

