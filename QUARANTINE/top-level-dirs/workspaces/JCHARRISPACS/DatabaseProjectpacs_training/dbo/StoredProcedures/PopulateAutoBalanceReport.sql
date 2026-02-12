
/*
exec PopulateAutoBalanceReport 2006, 1, 0, 'P', '', 1, 0, 1, 1, 1, null, 10
exec PopulateAutoBalanceReport 0, 1, 0, 'P', '', 1, 0, 1, 1, 1
select * from appraisal_totals
select * from validation_totals


INSERT INTO appraisal_totals_criteria_entity (pacs_user_id, entity_id) 
SELECT 1, entity_id FROM entity, account WHERE entity_id = acct_id ORDER BY entity_cd
select * from appraisal_totals_criteria_entity
select * from appraisal_totals_criteria_proptype
delete from appraisal_totals_criteria_entity
delete from appraisal_totals_criteria_proptype
*/

create procedure PopulateAutoBalanceReport
	@input_report_type	char(10) = '',
	@input_validation_id	int = 0
as

SET NOCOUNT ON

declare @lImbalance int;
set @lImbalance = 0;

	--Global
	declare @prop_val_yr int;
	declare @sup_yr int;
	declare @sup_num int;
	declare @entity_id int;
	declare @entity_cd varchar(5);

	--exp_as
	declare @vt_taxable_val numeric(14,0);
	declare @ex_taxable_val numeric(14,0);
	declare @vt_market_val numeric(14,0);
	declare @ex_market_val numeric(14,0);
	declare @vt_ag_market numeric(14,0);
	declare @ex_ag_market numeric(14,0);
	declare @vt_ag_market_ex numeric(14,0);
	declare @ex_ag_market_ex numeric(14,0);
	declare @vt_timber_market numeric(14,0);
	declare @ex_timber_market numeric(14,0);
	declare @vt_timber_market_ex numeric(14,0);
	declare @ex_timber_market_ex numeric(14,0);
	declare @vt_land_hstd_val numeric(14,0);
	declare @ex_land_hstd_val numeric(14,0);
	declare @vt_land_non_hstd_val numeric(14,0);
	declare @ex_land_non_hstd_val numeric(14,0);
	declare @vt_imprv_hstd_val numeric(14,0);
	declare @ex_imprv_hstd_val numeric(14,0);
	declare @vt_imprv_non_hstd_val numeric(14,0);
	declare @ex_imprv_non_hstd_val numeric(14,0);
	declare @vt_personal_val numeric(14,0);
	declare @ex_personal_val numeric(14,0);
	declare @vt_mineral_val numeric(14,0);
	declare @ex_mineral_val numeric(14,0);
	declare @vt_auto_val numeric(14,0);
	declare @ex_auto_val numeric(14,0);
	declare @vt_total_exemption numeric(14,0);
	declare @ex_total_exemption numeric(14,0);

	--Export As Prop Info
	declare @prop_id int;	
	declare @poev_market_val numeric(14,0);
	declare @poev_appraised_val numeric(14,0);
	declare @ex_appraised_val numeric(14,0);
	declare @poev_assessed_val numeric(14,0);
	declare @ex_assessed_val numeric(14,0);
	declare @poev_taxable_val numeric(14,0);
	declare @poev_land_hstd_val numeric(14,0);
	declare @poev_land_non_hstd_val numeric(14,0);
	declare @poev_imprv_hstd_val numeric(14,0);
	declare @poev_imprv_non_hstd_val numeric(14,0);
	declare @poev_ag_use_val numeric(14,0);
	declare @ex_ag_use_val numeric(14,0);
	declare @poev_ag_market numeric(14,0);
	declare @poev_timber_use numeric(14,0);
	declare @ex_timber_use numeric(14,0);
	declare @poev_timber_market numeric(14,0);

	declare @pv_market_val numeric(14,0);
	declare @pv_appraised_val numeric(14,0);
	declare @pv_assessed_val numeric(14,0);
	declare @pv_land_hstd_val numeric(14,0);
	declare @pv_land_non_hstd_val numeric(14,0);
	declare @pv_imprv_hstd_val numeric(14,0);
	declare @pv_imprv_non_hstd_val numeric(14,0);
	declare @pv_ag_use_val numeric(14,0);
	declare @pv_ag_market numeric(14,0);
	declare @pv_timber_use numeric(14,0);
	declare @pv_timber_market numeric(14,0);

	--Export SN
	declare @sup_taxable numeric(14,0);
	declare @sup_market_val numeric(14,0);
	declare @sup_appraised_val numeric(14,0);
	declare @sup_assessed_val numeric(14,0);
	declare @sup_land_hstd_val numeric(14,0)
	declare @sup_land_non_hstd_val numeric(14,0);
	declare @sup_imprv_hstd_val numeric(14,0);
	declare @sup_imprv_non_hstd_val numeric(14,0);
	declare @sup_ag_use_val numeric(14,0);
	declare @sup_ag_market numeric(14,0);
	declare @sup_timber_use numeric(14,0);
	declare @sup_timber_market numeric(14,0);
	
	--sup_group
	declare @vt_cur_taxable_val numeric(14,0);
	declare @vt_prev_taxable_val numeric(14,0);
	declare @gl_taxable numeric(14,0);
	declare @vt_cur_assessed_val numeric(14,0);
	declare @vt_prev_assessed_val numeric(14,0);
	declare @gl_assessed numeric(14,0);
	declare @vt_cur_total_exemption numeric(14,0);
	declare @vt_prev_total_exemption numeric(14,0);
	declare @gl_exemptions numeric(14,0);
	
	--sup_group prop_info
	declare	@sup_group_id int;
	declare	@sup_action char(1);
	declare	@cur_sup_num int;
	declare	@cur_sup_yr int;
	declare	@prev_sup_num int;
	declare	@prev_sup_yr int;
	declare @sup_gl_taxable numeric(14,0);
	declare @poev_gl_taxable numeric(14,0);
	declare @sup_gl_assessed numeric(14,0);
	declare @poev_gl_assessed numeric(14,0);
	declare @pv_gl_taxable numeric(14,0);
	declare @pv_gl_assessed numeric(14,0);

	declare @sup_gl_market numeric(14,0);
	declare @sup_gl_imprv_non_hstd_val numeric(14,0);
	declare @sup_gl_imprv_hstd_val numeric(14,0);
	declare @sup_gl_land_hstd_val numeric(14,0);
	declare @sup_gl_appraised_val numeric(14,0);
	declare @sup_gl_land_non_hstd_val numeric(14,0);
	declare @sup_gl_assessed_val numeric(14,0);
	declare @sup_gl_ag_market numeric(14,0);
	declare @sup_gl_ag_use_val numeric(14,0);
	declare @sup_gl_timber_market numeric(14,0);
	declare @sup_gl_timber_use numeric(14,0);

	declare @pv_gl_land_hstd_val numeric(14,0);
	declare @pv_gl_land_non_hstd_val numeric(14,0);
	declare @pv_gl_imprv_hstd_val numeric(14,0);
	declare @pv_gl_imprv_non_hstd_val numeric(14,0);
	declare @pv_gl_appraised_val numeric(14,0);
	declare @pv_gl_assessed_val numeric(14,0);
	declare @pv_gl_market numeric(14,0);
	declare @pv_gl_ag_use_val numeric(14,0);
	declare @pv_gl_ag_market numeric(14,0);
	declare @pv_gl_timber_market numeric(14,0);
	declare @pv_gl_timber_use numeric(14,0);


if @input_report_type = 'exp_as' 
begin
	delete from auto_balance_ex_as_report where validation_id = @input_validation_id

	declare cursor_totals cursor fast_forward
	for 	select 
			prop_val_yr,
			sup_num,
			entity_id,
			entity_cd,
			vt_taxable_val,
			ex_taxable_val,
			vt_market_val,
			ex_market_val,
			vt_ag_market,
			ex_ag_market,
			vt_ag_market_ex,
			ex_ag_market_ex,
			vt_timber_market,
			ex_timber_market,
			vt_timber_market_ex,
			ex_timber_market_ex,
			vt_land_hstd_val,
			ex_land_hstd_val,
			vt_land_non_hstd_val,
			ex_land_non_hstd_val,
			vt_imprv_hstd_val,
			ex_imprv_hstd_val,
			vt_imprv_non_hstd_val,
			ex_imprv_non_hstd_val,
			vt_personal_val,
			ex_personal_val,
			vt_mineral_val,
			ex_mineral_val,
			vt_auto_val,
			ex_auto_val,
			vt_total_exemption,
			ex_total_exemption
		from
			auto_balance_exp_as_totals_vw as abvw
		where
			abvw.validation_id = @input_validation_id
	
	open cursor_totals
	
	fetch next from cursor_totals into
		@prop_val_yr,
		@sup_num,
		@entity_id,
		@entity_cd,
		@vt_taxable_val,
		@ex_taxable_val,
		@vt_market_val,
		@ex_market_val,
		@vt_ag_market,
		@ex_ag_market,
		@vt_ag_market_ex,
		@ex_ag_market_ex,
		@vt_timber_market,
		@ex_timber_market,
		@vt_timber_market_ex,
		@ex_timber_market_ex,
		@vt_land_hstd_val,
		@ex_land_hstd_val,
		@vt_land_non_hstd_val,
		@ex_land_non_hstd_val,
		@vt_imprv_hstd_val,
		@ex_imprv_hstd_val,
		@vt_imprv_non_hstd_val,
		@ex_imprv_non_hstd_val,
		@vt_personal_val,
		@ex_personal_val,
		@vt_mineral_val,
		@ex_mineral_val,
		@vt_auto_val,
		@ex_auto_val,
		@vt_total_exemption,
		@ex_total_exemption

	while @@FETCH_STATUS = 0
	begin

		if @vt_taxable_val <> @ex_taxable_val 
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_as_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				vt_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'taxable_val',
				@ex_taxable_val,
				@vt_taxable_val
			)
		end

		if @vt_market_val <> @ex_market_val
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_as_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				vt_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'market_val',
				@ex_market_val,
				@vt_market_val
			)
		end

		if @vt_ag_market <> @ex_ag_market
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_as_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				vt_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'ag_market',
				@ex_ag_market,
				@vt_ag_market
			)
		end

		if @vt_ag_market_ex <> @ex_ag_market_ex 
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_as_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				vt_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'ag_market_ex',
				@ex_ag_market_ex,
				@vt_ag_market_ex
			)
		end

		if @vt_timber_market <> @ex_timber_market 
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_as_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				vt_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'timber_market',
				@ex_timber_market,
				@vt_timber_market
			)
		end

		if @vt_timber_market_ex <> @ex_timber_market_ex 
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_as_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				vt_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'timber_market_ex',
				@ex_timber_market_ex,
				@vt_timber_market_ex
			)
		end

		if @vt_land_hstd_val <> @ex_land_hstd_val 
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_as_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				vt_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'land_hstd_val',
				@ex_land_hstd_val,
				@vt_land_hstd_val
			)
		end

		if @vt_land_non_hstd_val <> @ex_land_non_hstd_val 
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_as_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				vt_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'land_non_hstd_val',
				@ex_land_non_hstd_val,
				@vt_land_non_hstd_val
			)
		end

		if @vt_imprv_hstd_val <> @ex_imprv_hstd_val 
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_as_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				vt_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'imprv_hstd_val',
				@ex_imprv_hstd_val,
				@vt_imprv_hstd_val
			)
		end

		if @vt_imprv_non_hstd_val <> @ex_imprv_non_hstd_val 
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_as_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				vt_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'imprv_non_hstd_val',
				@ex_imprv_non_hstd_val,
				@vt_imprv_non_hstd_val
			)
		end

		if @vt_personal_val <> @ex_personal_val 
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_as_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				vt_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'personal_val',
				@ex_personal_val,
				@vt_personal_val
			)
		end

		if @vt_mineral_val <> @ex_mineral_val 
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_as_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				vt_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'mineral_val',
				@ex_mineral_val,
				@vt_mineral_val
			)
		end

		if @vt_auto_val <> @ex_auto_val 
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_as_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				vt_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'auto_val',
				@ex_auto_val,
				@vt_auto_val
			)
		end

		fetch next from cursor_totals into
			@prop_val_yr,
			@sup_num,
			@entity_id,
			@entity_cd,
			@vt_taxable_val,
			@ex_taxable_val,
			@vt_market_val,
			@ex_market_val,
			@vt_ag_market,
			@ex_ag_market,
			@vt_ag_market_ex,
			@ex_ag_market_ex,
			@vt_timber_market,
			@ex_timber_market,
			@vt_timber_market_ex,
			@ex_timber_market_ex,
			@vt_land_hstd_val,
			@ex_land_hstd_val,
			@vt_land_non_hstd_val,
			@ex_land_non_hstd_val,
			@vt_imprv_hstd_val,
			@ex_imprv_hstd_val,
			@vt_imprv_non_hstd_val,
			@ex_imprv_non_hstd_val,
			@vt_personal_val,
			@ex_personal_val,
			@vt_mineral_val,
			@ex_mineral_val,
			@vt_auto_val,
			@ex_auto_val,
			@vt_total_exemption,
			@ex_total_exemption
	end
	
	close cursor_totals
	deallocate cursor_totals

-------------------------------------------------------------
--If there was a totals imbalance then populate the property by property report tables
-------------------------------------------------------------

	if @lImbalance = 1
	begin

-------------------------------------------------------------
--Export AS poev info
-------------------------------------------------------------

		delete from auto_balance_ex_as_poev_report where validation_id = @input_validation_id
	
		declare cursor_totals cursor fast_forward
		for 	select 
				sup_yr,
				sup_num,
				prop_id,
				entity_id,
				entity_cd,
				poev_market_val,
				ex_market_val,
				poev_appraised_val,
				ex_appraised_val,
				poev_assessed_val,
				ex_assessed_val,
				poev_taxable_val,
				ex_taxable_val,
				poev_land_hstd_val,
				ex_land_hstd_val,
				poev_land_non_hstd_val,
				ex_land_non_hstd_val,
				poev_imprv_hstd_val,
				ex_imprv_hstd_val,
				poev_imprv_non_hstd_val,
				ex_imprv_non_hstd_val,
				poev_ag_use_val,
				ex_ag_use_val,
				poev_ag_market,
				ex_ag_market,
				poev_timber_use,
				ex_timber_use,
				poev_timber_market,
				ex_timber_market
			from
				auto_balance_exp_as_poev_vw as abvw
			where
				abvw.validation_id = @input_validation_id
		
		open cursor_totals
		
		fetch next from cursor_totals into
			@sup_yr,
			@sup_num,
			@prop_id,
			@entity_id,
			@entity_cd,
			@poev_market_val,
			@ex_market_val,
			@poev_appraised_val,
			@ex_appraised_val,
			@poev_assessed_val,
			@ex_assessed_val,
			@poev_taxable_val,
			@ex_taxable_val,
			@poev_land_hstd_val,
			@ex_land_hstd_val,
			@poev_land_non_hstd_val,
			@ex_land_non_hstd_val,
			@poev_imprv_hstd_val,
			@ex_imprv_hstd_val,
			@poev_imprv_non_hstd_val,
			@ex_imprv_non_hstd_val,
			@poev_ag_use_val,
			@ex_ag_use_val,
			@poev_ag_market,
			@ex_ag_market,
			@poev_timber_use,
			@ex_timber_use,
			@poev_timber_market,
			@ex_timber_market
	
		while @@FETCH_STATUS = 0
		begin
	
			if @poev_market_val <> @ex_market_val
			begin
				INSERT INTO auto_balance_ex_as_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					poev_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'market_val',
					@poev_market_val,
					@ex_market_val
				)
			end

			if @poev_appraised_val <> @ex_appraised_val
			begin
				INSERT INTO auto_balance_ex_as_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					poev_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'appraised_val',
					@poev_appraised_val,
					@ex_appraised_val
				)
			end

			if @poev_assessed_val <> @ex_assessed_val
			begin
				INSERT INTO auto_balance_ex_as_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					poev_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'assessed_val',
					@poev_assessed_val,
					@ex_assessed_val
				)
			end

			if @poev_taxable_val <> @ex_taxable_val
			begin
				INSERT INTO auto_balance_ex_as_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					poev_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'taxable_val',
					@poev_taxable_val,
					@ex_taxable_val
				)
			end

			if @poev_land_hstd_val <> @ex_land_hstd_val
			begin
				INSERT INTO auto_balance_ex_as_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					poev_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'land_hstd_val',
					@poev_land_hstd_val,
					@ex_land_hstd_val
				)
			end

			if @poev_land_non_hstd_val <> @ex_land_non_hstd_val
			begin
				INSERT INTO auto_balance_ex_as_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					poev_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'land_non_hstd_val',
					@poev_land_non_hstd_val,
					@ex_land_non_hstd_val
				)
			end

			if @poev_imprv_hstd_val <> @ex_imprv_hstd_val
			begin
				INSERT INTO auto_balance_ex_as_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					poev_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'imprv_hstd_val',
					@poev_imprv_hstd_val,
					@ex_imprv_hstd_val
				)
			end

			if @poev_imprv_non_hstd_val <> @ex_imprv_non_hstd_val
			begin
				INSERT INTO auto_balance_ex_as_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					poev_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'imprv_non_hstd_val',
					@poev_imprv_non_hstd_val,
					@ex_imprv_non_hstd_val
				)
			end

			if @poev_ag_use_val <> @ex_ag_use_val
			begin
				INSERT INTO auto_balance_ex_as_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					poev_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'ag_use_val',
					@poev_ag_use_val,
					@ex_ag_use_val
				)
			end

			if @poev_ag_market <> @ex_ag_market
			begin
				INSERT INTO auto_balance_ex_as_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					poev_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'ag_market',
					@poev_ag_market,
					@ex_ag_market
				)
			end

			if @poev_timber_use <> @ex_timber_use
			begin
				INSERT INTO auto_balance_ex_as_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					poev_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'timber_use',
					@poev_timber_use,
					@ex_timber_use
				)
			end

			if @poev_timber_market <> @ex_timber_market
			begin
				INSERT INTO auto_balance_ex_as_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					poev_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'timber_market',
					@poev_timber_market,
					@ex_timber_market
				)
			end

			fetch next from cursor_totals into
				@sup_yr,
				@sup_num,
				@prop_id,
				@entity_id,
				@entity_cd,
				@poev_market_val,
				@ex_market_val,
				@poev_appraised_val,
				@ex_appraised_val,
				@poev_assessed_val,
				@ex_assessed_val,
				@poev_taxable_val,
				@ex_taxable_val,
				@poev_land_hstd_val,
				@ex_land_hstd_val,
				@poev_land_non_hstd_val,
				@ex_land_non_hstd_val,
				@poev_imprv_hstd_val,
				@ex_imprv_hstd_val,
				@poev_imprv_non_hstd_val,
				@ex_imprv_non_hstd_val,
				@poev_ag_use_val,
				@ex_ag_use_val,
				@poev_ag_market,
				@ex_ag_market,
				@poev_timber_use,
				@ex_timber_use,
				@poev_timber_market,
				@ex_timber_market
		end
		
		close cursor_totals
		deallocate cursor_totals

-------------------------------------------------------------
--Export AS property_val info
-------------------------------------------------------------

		delete from auto_balance_ex_as_pv_report where validation_id = @input_validation_id
	
		declare cursor_totals cursor fast_forward
		for 	select 
				prop_val_yr,
				sup_num,
				prop_id,
				pv_market_val,
				ex_market_val,
				pv_appraised_val,
				ex_appraised_val,
				pv_assessed_val,
				ex_assessed_val,
				pv_land_hstd_val,
				ex_land_hstd_val,
				pv_land_non_hstd_val,
				ex_land_non_hstd_val,
				pv_imprv_hstd_val,
				ex_imprv_hstd_val,
				pv_imprv_non_hstd_val,
				ex_imprv_non_hstd_val,
				pv_ag_use_val,
				ex_ag_use_val,
				pv_ag_market,
				ex_ag_market,
				pv_timber_use,
				ex_timber_use,
				pv_timber_market,
				ex_timber_market
			from
				auto_balance_exp_as_pv_vw as abvw
			where
				abvw.validation_id = @input_validation_id
		
		open cursor_totals
		
		fetch next from cursor_totals into
			@prop_val_yr,
			@sup_num,
			@prop_id,
			@pv_market_val,
			@ex_market_val,
			@pv_appraised_val,
			@ex_appraised_val,
			@pv_assessed_val,
			@ex_assessed_val,
			@pv_land_hstd_val,
			@ex_land_hstd_val,
			@pv_land_non_hstd_val,
			@ex_land_non_hstd_val,
			@pv_imprv_hstd_val,
			@ex_imprv_hstd_val,
			@pv_imprv_non_hstd_val,
			@ex_imprv_non_hstd_val,
			@pv_ag_use_val,
			@ex_ag_use_val,
			@pv_ag_market,
			@ex_ag_market,
			@pv_timber_use,
			@ex_timber_use,
			@pv_timber_market,
			@ex_timber_market
	
		while @@FETCH_STATUS = 0
		begin
	
			if @pv_market_val <> @ex_market_val
			begin
				INSERT INTO auto_balance_ex_as_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					pv_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'market_val',
					@pv_market_val,
					@ex_market_val
				)
			end

			if @pv_appraised_val <> @ex_appraised_val
			begin
				INSERT INTO auto_balance_ex_as_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					pv_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'appraised_val',
					@pv_appraised_val,
					@ex_appraised_val
				)
			end

			if @pv_assessed_val <> @ex_assessed_val
			begin
				INSERT INTO auto_balance_ex_as_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					pv_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'assessed_val',
					@pv_assessed_val,
					@ex_assessed_val
				)
			end

			if @pv_land_hstd_val <> @ex_land_hstd_val
			begin
				INSERT INTO auto_balance_ex_as_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					pv_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'land_hstd_val',
					@pv_land_hstd_val,
					@ex_land_hstd_val
				)
			end

			if @pv_land_non_hstd_val <> @ex_land_non_hstd_val
			begin
				INSERT INTO auto_balance_ex_as_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					pv_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'land_non_hstd_val',
					@pv_land_non_hstd_val,
					@ex_land_non_hstd_val
				)
			end

			if @pv_imprv_hstd_val <> @ex_imprv_hstd_val
			begin
				INSERT INTO auto_balance_ex_as_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					pv_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'imprv_hstd_val',
					@pv_imprv_hstd_val,
					@ex_imprv_hstd_val
				)
			end

			if @pv_imprv_non_hstd_val <> @ex_imprv_non_hstd_val
			begin
				INSERT INTO auto_balance_ex_as_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					pv_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'imprv_non_hstd_val',
					@pv_imprv_non_hstd_val,
					@ex_imprv_non_hstd_val
				)
			end

			if @pv_ag_use_val <> @ex_ag_use_val
			begin
				INSERT INTO auto_balance_ex_as_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					pv_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'ag_use_val',
					@pv_ag_use_val,
					@ex_ag_use_val
				)
			end

			if @pv_ag_market <> @ex_ag_market
			begin
				INSERT INTO auto_balance_ex_as_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					pv_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'ag_market',
					@pv_ag_market,
					@ex_ag_market
				)
			end

			if @pv_timber_use <> @ex_timber_use
			begin
				INSERT INTO auto_balance_ex_as_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					pv_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'timber_use',
					@pv_timber_use,
					@ex_timber_use
				)
			end

			if @pv_timber_market <> @ex_timber_market
			begin
				INSERT INTO auto_balance_ex_as_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					pv_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'timber_market',
					@pv_timber_market,
					@ex_timber_market
				)
			end

			fetch next from cursor_totals into
				@prop_val_yr,
				@sup_num,
				@prop_id,
				@pv_market_val,
				@ex_market_val,
				@pv_appraised_val,
				@ex_appraised_val,
				@pv_assessed_val,
				@ex_assessed_val,
				@pv_land_hstd_val,
				@ex_land_hstd_val,
				@pv_land_non_hstd_val,
				@ex_land_non_hstd_val,
				@pv_imprv_hstd_val,
				@ex_imprv_hstd_val,
				@pv_imprv_non_hstd_val,
				@ex_imprv_non_hstd_val,
				@pv_ag_use_val,
				@ex_ag_use_val,
				@pv_ag_market,
				@ex_ag_market,
				@pv_timber_use,
				@ex_timber_use,
				@pv_timber_market,
				@ex_timber_market
		end
		
		close cursor_totals
		deallocate cursor_totals
	end
end

-------------------------------------------------------------
--Export Sup Num
-------------------------------------------------------------

else if @input_report_type = 'exp_sn'
begin
	delete from auto_balance_ex_sn_report where validation_id = @input_validation_id

	declare cursor_sup_num cursor fast_forward
	for 	select 
			sup_yr,
			sup_num,
			entity_id,
			sup_taxable,
			ex_taxable_val
		from
			auto_balance_exp_sn_totals_vw as abvw
		where
			abvw.validation_id = @input_validation_id
	
	open cursor_sup_num
	
	fetch next from cursor_sup_num into
		@sup_yr,
		@sup_num,
		@entity_id,
		@sup_taxable,
		@ex_taxable_val


	while @@FETCH_STATUS = 0
	begin

		if @sup_taxable <> @ex_taxable_val 
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_sn_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				sup_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@sup_yr,
				@sup_num,
				'taxable_val',
				@ex_taxable_val,
				@sup_taxable
			)
		end

		fetch next from cursor_sup_num into
			@sup_yr,
			@sup_num,
			@entity_id,
			@sup_taxable,
			@ex_taxable_val
	end		

	close cursor_sup_num
	deallocate cursor_sup_num


-------------------------------------------------------------
--If there was a totals imbalance then populate the property by property report tables
-------------------------------------------------------------

	if @lImbalance = 1
	begin

-------------------------------------------------------------
--Export SN property_val info
-------------------------------------------------------------

		delete from auto_balance_ex_sn_pv_report where validation_id = @input_validation_id
	
		declare cursor_totals cursor fast_forward
		for 	select 
				prop_val_yr,
				sup_num,
				prop_id,
				sup_market_val,
				ex_market_val,
				sup_appraised_val,
				ex_appraised_val,
				sup_assessed_val,
				ex_assessed_val,
				sup_land_hstd_val,
				ex_land_hstd_val,
				sup_land_non_hstd_val,
				ex_land_non_hstd_val,
				sup_imprv_hstd_val,
				ex_imprv_hstd_val,
				sup_imprv_non_hstd_val,
				ex_imprv_non_hstd_val,
				sup_ag_use_val,
				ex_ag_use_val,
				sup_ag_market,
				ex_ag_market,
				sup_timber_use,
				ex_timber_use,
				sup_timber_market,
				ex_timber_market
			from
				auto_balance_exp_sn_pv_vw as abvw
			where
				abvw.validation_id = @input_validation_id
		
		open cursor_totals
		
		fetch next from cursor_totals into
			@prop_val_yr,
			@sup_num,
			@prop_id,
			@sup_market_val,
			@ex_market_val,
			@sup_appraised_val,
			@ex_appraised_val,
			@sup_assessed_val,
			@ex_assessed_val,
			@sup_land_hstd_val,
			@ex_land_hstd_val,
			@sup_land_non_hstd_val,
			@ex_land_non_hstd_val,
			@sup_imprv_hstd_val,
			@ex_imprv_hstd_val,
			@sup_imprv_non_hstd_val,
			@ex_imprv_non_hstd_val,
			@sup_ag_use_val,
			@ex_ag_use_val,
			@sup_ag_market,
			@ex_ag_market,
			@sup_timber_use,
			@ex_timber_use,
			@sup_timber_market,
			@ex_timber_market
	
		while @@FETCH_STATUS = 0
		begin
	
			if @sup_market_val <> @ex_market_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'market_val',
					@sup_market_val,
					@ex_market_val
				)
			end

			if @sup_appraised_val <> @ex_appraised_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'appraised_val',
					@sup_appraised_val,
					@ex_appraised_val
				)
			end

			if @sup_assessed_val <> @ex_assessed_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'assessed_val',
					@sup_assessed_val,
					@ex_assessed_val
				)
			end

			if @sup_land_hstd_val <> @ex_land_hstd_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'land_hstd_val',
					@sup_land_hstd_val,
					@ex_land_hstd_val
				)
			end

			if @sup_land_non_hstd_val <> @ex_land_non_hstd_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'land_non_hstd_val',
					@sup_land_non_hstd_val,
					@ex_land_non_hstd_val
				)
			end

			if @sup_imprv_hstd_val <> @ex_imprv_hstd_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'imprv_hstd_val',
					@sup_imprv_hstd_val,
					@ex_imprv_hstd_val
				)
			end

			if @sup_imprv_non_hstd_val <> @ex_imprv_non_hstd_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'imprv_non_hstd_val',
					@sup_imprv_non_hstd_val,
					@ex_imprv_non_hstd_val
				)
			end

			if @sup_ag_use_val <> @ex_ag_use_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'ag_use_val',
					@sup_ag_use_val,
					@ex_ag_use_val
				)
			end

			if @sup_ag_market <> @ex_ag_market
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'ag_market',
					@sup_ag_market,
					@ex_ag_market
				)
			end

			if @sup_timber_use <> @ex_timber_use
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'timber_use',
					@sup_timber_use,
					@ex_timber_use
				)
			end

			if @sup_timber_market <> @ex_timber_market
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'timber_market',
					@sup_timber_market,
					@ex_timber_market
				)
			end

			fetch next from cursor_totals into
				@prop_val_yr,
				@sup_num,
				@prop_id,
				@sup_market_val,
				@ex_market_val,
				@sup_appraised_val,
				@ex_appraised_val,
				@sup_assessed_val,
				@ex_assessed_val,
				@sup_land_hstd_val,
				@ex_land_hstd_val,
				@sup_land_non_hstd_val,
				@ex_land_non_hstd_val,
				@sup_imprv_hstd_val,
				@ex_imprv_hstd_val,
				@sup_imprv_non_hstd_val,
				@ex_imprv_non_hstd_val,
				@sup_ag_use_val,
				@ex_ag_use_val,
				@sup_ag_market,
				@ex_ag_market,
				@sup_timber_use,
				@ex_timber_use,
				@sup_timber_market,
				@ex_timber_market
		end
		
		close cursor_totals
		deallocate cursor_totals

-------------------------------------------------------------
--Export SN taxable info
-------------------------------------------------------------

		delete from auto_balance_ex_sn_poev_report where validation_id = @input_validation_id
	
		declare cursor_totals cursor fast_forward
		for 	select 
				sup_yr,
				sup_num,
				prop_id,
				entity_id,
				entity_cd,
				sup_assessed_val,
				ex_assessed_val,
				sup_taxable,
				ex_taxable_val
			from
				auto_balance_exp_sn_poev_vw as abvw
			where
				abvw.validation_id = @input_validation_id
		
		open cursor_totals
		
		fetch next from cursor_totals into
			@sup_yr,
			@sup_num,
			@prop_id,
			@entity_id,
			@entity_cd,
			@sup_assessed_val,
			@ex_assessed_val,
			@sup_taxable,
			@ex_taxable_val
	
		while @@FETCH_STATUS = 0
		begin
	
			if @sup_assessed_val <> @ex_assessed_val
			begin
				INSERT INTO auto_balance_ex_sn_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'assessed_val',
					@sup_assessed_val,
					@ex_assessed_val
				)
			end
			
			if @sup_taxable <> @ex_taxable_val
			begin
				INSERT INTO auto_balance_ex_sn_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'taxable_val',
					@sup_taxable,
					@ex_taxable_val
				)
			end
			
			fetch next from cursor_totals into
				@sup_yr,
				@sup_num,
				@prop_id,
				@entity_id,
				@entity_cd,
				@sup_assessed_val,
				@ex_assessed_val,
				@sup_taxable,
				@ex_taxable_val
		end

		close cursor_totals
		deallocate cursor_totals
	end
end

else if @input_report_type = 'exp_sg'
begin
	delete from auto_balance_ex_sn_report where validation_id = @input_validation_id

	declare cursor_sup_num cursor fast_forward
	for 	select 
			sup_yr,
			sup_num,
			entity_id,
			sup_taxable,
			ex_taxable_val
		from
			auto_balance_exp_sg_totals_vw as abvw
		where
			abvw.validation_id = @input_validation_id
	
	open cursor_sup_num
	
	fetch next from cursor_sup_num into
		@sup_yr,
		@sup_num,
		@entity_id,
		@sup_taxable,
		@ex_taxable_val


	while @@FETCH_STATUS = 0
	begin

		if @sup_taxable <> @ex_taxable_val 
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_ex_sn_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				ex_val,
				sup_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@sup_yr,
				@sup_num,
				'taxable_val',
				@ex_taxable_val,
				@sup_taxable
			)
		end

		fetch next from cursor_sup_num into
			@sup_yr,
			@sup_num,
			@entity_id,
			@sup_taxable,
			@ex_taxable_val
	end		

	close cursor_sup_num
	deallocate cursor_sup_num


-------------------------------------------------------------
--If there was a totals imbalance then populate the property by property report tables
-------------------------------------------------------------

	if @lImbalance = 1
	begin

-------------------------------------------------------------
--Export SN property_val info
-------------------------------------------------------------

		delete from auto_balance_ex_sn_pv_report where validation_id = @input_validation_id
	
		declare cursor_totals cursor fast_forward
		for 	select 
				prop_val_yr,
				sup_num,
				prop_id,
				sup_market_val,
				ex_market_val,
				sup_appraised_val,
				ex_appraised_val,
				sup_assessed_val,
				ex_assessed_val,
				sup_land_hstd_val,
				ex_land_hstd_val,
				sup_land_non_hstd_val,
				ex_land_non_hstd_val,
				sup_imprv_hstd_val,
				ex_imprv_hstd_val,
				sup_imprv_non_hstd_val,
				ex_imprv_non_hstd_val,
				sup_ag_use_val,
				ex_ag_use_val,
				sup_ag_market,
				ex_ag_market,
				sup_timber_use,
				ex_timber_use,
				sup_timber_market,
				ex_timber_market
			from
				auto_balance_exp_sg_pv_vw as abvw
			where
				abvw.validation_id = @input_validation_id
		
		open cursor_totals
		
		fetch next from cursor_totals into
			@prop_val_yr,
			@sup_num,
			@prop_id,
			@sup_market_val,
			@ex_market_val,
			@sup_appraised_val,
			@ex_appraised_val,
			@sup_assessed_val,
			@ex_assessed_val,
			@sup_land_hstd_val,
			@ex_land_hstd_val,
			@sup_land_non_hstd_val,
			@ex_land_non_hstd_val,
			@sup_imprv_hstd_val,
			@ex_imprv_hstd_val,
			@sup_imprv_non_hstd_val,
			@ex_imprv_non_hstd_val,
			@sup_ag_use_val,
			@ex_ag_use_val,
			@sup_ag_market,
			@ex_ag_market,
			@sup_timber_use,
			@ex_timber_use,
			@sup_timber_market,
			@ex_timber_market
	
		while @@FETCH_STATUS = 0
		begin
	
			if @sup_market_val <> @ex_market_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'market_val',
					@sup_market_val,
					@ex_market_val
				)
			end

			if @sup_appraised_val <> @ex_appraised_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'appraised_val',
					@sup_appraised_val,
					@ex_appraised_val
				)
			end

			if @sup_assessed_val <> @ex_assessed_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'assessed_val',
					@sup_assessed_val,
					@ex_assessed_val
				)
			end

			if @sup_land_hstd_val <> @ex_land_hstd_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'land_hstd_val',
					@sup_land_hstd_val,
					@ex_land_hstd_val
				)
			end

			if @sup_land_non_hstd_val <> @ex_land_non_hstd_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'land_non_hstd_val',
					@sup_land_non_hstd_val,
					@ex_land_non_hstd_val
				)
			end

			if @sup_imprv_hstd_val <> @ex_imprv_hstd_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'imprv_hstd_val',
					@sup_imprv_hstd_val,
					@ex_imprv_hstd_val
				)
			end

			if @sup_imprv_non_hstd_val <> @ex_imprv_non_hstd_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'imprv_non_hstd_val',
					@sup_imprv_non_hstd_val,
					@ex_imprv_non_hstd_val
				)
			end

			if @sup_ag_use_val <> @ex_ag_use_val
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'ag_use_val',
					@sup_ag_use_val,
					@ex_ag_use_val
				)
			end

			if @sup_ag_market <> @ex_ag_market
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'ag_market',
					@sup_ag_market,
					@ex_ag_market
				)
			end

			if @sup_timber_use <> @ex_timber_use
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'timber_use',
					@sup_timber_use,
					@ex_timber_use
				)
			end

			if @sup_timber_market <> @ex_timber_market
			begin
				INSERT INTO auto_balance_ex_sn_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'timber_market',
					@sup_timber_market,
					@ex_timber_market
				)
			end

			fetch next from cursor_totals into
				@prop_val_yr,
				@sup_num,
				@prop_id,
				@sup_market_val,
				@ex_market_val,
				@sup_appraised_val,
				@ex_appraised_val,
				@sup_assessed_val,
				@ex_assessed_val,
				@sup_land_hstd_val,
				@ex_land_hstd_val,
				@sup_land_non_hstd_val,
				@ex_land_non_hstd_val,
				@sup_imprv_hstd_val,
				@ex_imprv_hstd_val,
				@sup_imprv_non_hstd_val,
				@ex_imprv_non_hstd_val,
				@sup_ag_use_val,
				@ex_ag_use_val,
				@sup_ag_market,
				@ex_ag_market,
				@sup_timber_use,
				@ex_timber_use,
				@sup_timber_market,
				@ex_timber_market
		end
		
		close cursor_totals
		deallocate cursor_totals

-------------------------------------------------------------
--Export SN taxable info
-------------------------------------------------------------

		delete from auto_balance_ex_sn_poev_report where validation_id = @input_validation_id
	
		declare cursor_totals cursor fast_forward
		for 	select 
				sup_yr,
				sup_num,
				prop_id,
				entity_id,
				entity_cd,
				sup_assessed_val,
				ex_assessed_val,
				sup_taxable,
				ex_taxable_val
			from
				auto_balance_exp_sg_poev_vw as abvw
			where
				abvw.validation_id = @input_validation_id
		
		open cursor_totals
		
		fetch next from cursor_totals into
			@sup_yr,
			@sup_num,
			@prop_id,
			@entity_id,
			@entity_cd,
			@sup_assessed_val,
			@ex_assessed_val,
			@sup_taxable,
			@ex_taxable_val
	
		while @@FETCH_STATUS = 0
		begin
	
			if @sup_assessed_val <> @ex_assessed_val
			begin
				INSERT INTO auto_balance_ex_sn_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'assessed_val',
					@sup_assessed_val,
					@ex_assessed_val
				)
			end
			
			if @sup_taxable <> @ex_taxable_val
			begin
				INSERT INTO auto_balance_ex_sn_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					column_name,
					sup_val,
					ex_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					'taxable_val',
					@sup_taxable,
					@ex_taxable_val
				)
			end
			
			fetch next from cursor_totals into
				@sup_yr,
				@sup_num,
				@prop_id,
				@entity_id,
				@entity_cd,
				@sup_assessed_val,
				@ex_assessed_val,
				@sup_taxable,
				@ex_taxable_val
		end

		close cursor_totals
		deallocate cursor_totals
	end
end

-------------------------------------------------------------
--Sup Group Auto Balance
-------------------------------------------------------------

else if @input_report_type = 'sup_group' 
begin

	delete from auto_balance_sup_group_report where validation_id = @input_validation_id

	declare cursor_totals cursor fast_forward
	for 	select 
			prop_val_yr,
			sup_num,
			entity_id,
			entity_cd,
			vt_cur_taxable_val,
			vt_prev_taxable_val,
			gl_taxable,
			vt_cur_assessed_val,
			vt_prev_assessed_val,
			gl_assessed,
			vt_cur_total_exemption,
			vt_prev_total_exemption,
			gl_exemptions
		from
			auto_balance_sup_vw as absvw
		where
			absvw.validation_id = @input_validation_id
	
	open cursor_totals
	
	fetch next from cursor_totals into
		@prop_val_yr,
		@sup_num,
		@entity_id,
		@entity_cd,
		@vt_cur_taxable_val,
		@vt_prev_taxable_val,
		@gl_taxable,
		@vt_cur_assessed_val,
		@vt_prev_assessed_val,
		@gl_assessed,
		@vt_cur_total_exemption,
		@vt_prev_total_exemption,
		@gl_exemptions

	while @@FETCH_STATUS = 0
	begin
		if @vt_cur_taxable_val <> @gl_taxable + @vt_prev_taxable_val
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_sup_group_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				vt_cur_val,
				vt_prev_val,
				sup_group_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'taxable_val',
				@vt_cur_taxable_val,
				@vt_prev_taxable_val,
				@gl_taxable
			)
		end


		if @vt_cur_assessed_val <> @gl_assessed + @vt_prev_assessed_val
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_sup_group_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				vt_cur_val,
				vt_prev_val,
				sup_group_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'assessed_val',
				@vt_cur_assessed_val,
				@vt_prev_assessed_val,
				@gl_assessed
			)
		end


		if @vt_cur_total_exemption <> @gl_exemptions + @vt_prev_total_exemption
		begin
			set @lImbalance = 1;
			INSERT INTO auto_balance_sup_group_report (
				validation_id,
				entity_id,
				prop_val_yr,
				sup_num,
				column_name,
				vt_cur_val,
				vt_prev_val,
				sup_group_val
			)
			VALUES (
				@input_validation_id,
				@entity_id,
				@prop_val_yr,
				@sup_num,
				'total_exemption',
				@vt_cur_total_exemption,
				@vt_prev_total_exemption,
				@gl_exemptions
			)
		end

		fetch next from cursor_totals into
			@prop_val_yr,
			@sup_num,
			@entity_id,
			@entity_cd,
			@vt_cur_taxable_val,
			@vt_prev_taxable_val,
			@gl_taxable,
			@vt_cur_assessed_val,
			@vt_prev_assessed_val,
			@gl_assessed,
			@vt_cur_total_exemption,
			@vt_prev_total_exemption,
			@gl_exemptions
	end
	
	close cursor_totals
	deallocate cursor_totals

-------------------------------------------------------------
--Sup Group Auto Balance - If imbalance do property-by-property evaluation
-------------------------------------------------------------
	if @lImbalance = 1
	begin

-------------------------------------------------------------
--Sup Group Auto Balance POEV info
-------------------------------------------------------------

		delete from auto_balance_sup_group_poev_report where validation_id = @input_validation_id
	
		declare cursor_totals cursor fast_forward
		for 	select 
			sup_group_id,
			sup_action,
			cur_sup_num,
			cur_sup_yr,
			prev_sup_num,
			prev_sup_yr,
			prop_id,
			entity_id,
			sup_gl_taxable,
			poev_gl_taxable,
			sup_gl_assessed,
			poev_gl_assessed
			from
				auto_balance_sup_poev_vw as abvw
			where
				abvw.sup_group_id = -@input_validation_id
		
		open cursor_totals
		
		fetch next from cursor_totals into
			@sup_group_id,
			@sup_action,
			@cur_sup_num,
			@cur_sup_yr,
			@prev_sup_num,
			@prev_sup_yr,
			@prop_id,
			@entity_id,
			@sup_gl_taxable,
			@poev_gl_taxable,
			@sup_gl_assessed,
			@poev_gl_assessed
			
	
		while @@FETCH_STATUS = 0
		begin
	
			if @sup_gl_taxable <> @poev_gl_taxable
			begin
				INSERT INTO auto_balance_sup_group_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					sup_action,
					column_name,
					poev_gl_val,
					sup_gl_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@cur_sup_yr,
					@cur_sup_num,
					@prop_id,
					@sup_action,
					'taxable_val',
					@poev_gl_taxable,
					@sup_gl_taxable
				)
			end

			if @sup_gl_assessed <> @poev_gl_assessed
			begin
				INSERT INTO auto_balance_sup_group_poev_report (
					validation_id,
					entity_id,
					prop_val_yr,
					sup_num,
					prop_id,
					sup_action,
					column_name,
					poev_gl_val,
					sup_gl_val
				)
				VALUES (
					@input_validation_id,
					@entity_id,
					@cur_sup_yr,
					@cur_sup_num,
					@prop_id,
					@sup_action,
					'assessed_val',
					@poev_gl_assessed,
					@sup_gl_assessed
				)
			end

			fetch next from cursor_totals into
				@sup_group_id,
				@sup_action,
				@cur_sup_num,
				@cur_sup_yr,
				@prev_sup_num,
				@prev_sup_yr,
				@prop_id,
				@entity_id,
				@sup_gl_taxable,
				@poev_gl_taxable,
				@sup_gl_assessed,
				@poev_gl_assessed
		end
		
		close cursor_totals
		deallocate cursor_totals

-------------------------------------------------------------
--Sup Group Auto Balance PV info
-------------------------------------------------------------
		delete from auto_balance_sup_group_pv_report where validation_id = @input_validation_id
	
		declare cursor_totals cursor fast_forward
		for 	select 
			sup_group_id,
			sup_action,
			cur_sup_num,
			cur_sup_yr,
			prev_sup_num,
			prev_sup_yr,
			prop_id,
			sup_gl_market,
			sup_gl_imprv_non_hstd_val,
			sup_gl_imprv_hstd_val,
			sup_gl_land_hstd_val,
			sup_gl_appraised_val,
			sup_gl_land_non_hstd_val,
			sup_gl_assessed_val,
			sup_gl_ag_market,
			sup_gl_ag_use_val,
			sup_gl_timber_market,
			sup_gl_timber_use,
			pv_gl_land_hstd_val,
			pv_gl_land_non_hstd_val,
			pv_gl_imprv_hstd_val,
			pv_gl_imprv_non_hstd_val,
			pv_gl_appraised_val,
			pv_gl_assessed_val,
			pv_gl_market,
			pv_gl_ag_use_val,
			pv_gl_ag_market,
			pv_gl_timber_market,
			pv_gl_timber_use
			from
				auto_balance_sup_pv_vw as abvw
			where
				abvw.sup_group_id = -@input_validation_id
		
		open cursor_totals
		
		fetch next from cursor_totals into
			@sup_group_id,
			@sup_action,
			@cur_sup_num,
			@cur_sup_yr,
			@prev_sup_num,
			@prev_sup_yr,
			@prop_id,
			@sup_gl_market,
			@sup_gl_imprv_non_hstd_val,
			@sup_gl_imprv_hstd_val,
			@sup_gl_land_hstd_val,
			@sup_gl_appraised_val,
			@sup_gl_land_non_hstd_val,
			@sup_gl_assessed_val,
			@sup_gl_ag_market,
			@sup_gl_ag_use_val,
			@sup_gl_timber_market,
			@sup_gl_timber_use,
			@pv_gl_land_hstd_val,
			@pv_gl_land_non_hstd_val,
			@pv_gl_imprv_hstd_val,
			@pv_gl_imprv_non_hstd_val,
			@pv_gl_appraised_val,
			@pv_gl_assessed_val,
			@pv_gl_market,
			@pv_gl_ag_use_val,
			@pv_gl_ag_market,
			@pv_gl_timber_market,
			@pv_gl_timber_use
	
		while @@FETCH_STATUS = 0
		begin
	
			if @sup_gl_land_hstd_val <> @pv_gl_land_hstd_val
			begin
				INSERT INTO auto_balance_sup_group_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					sup_action,
					column_name,
					pv_gl_val,
					sup_gl_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					@sup_action,
					'land_hstd_val',
					@pv_gl_land_hstd_val,
					@sup_gl_land_hstd_val
				)
			end

			if @sup_gl_land_non_hstd_val <> @pv_gl_land_non_hstd_val
			begin
				INSERT INTO auto_balance_sup_group_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					sup_action,
					column_name,
					pv_gl_val,
					sup_gl_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					@sup_action,
					'land_non_hstd_val',
					@pv_gl_land_non_hstd_val,
					@sup_gl_land_non_hstd_val
				)
			end

			if @sup_gl_imprv_hstd_val <> @pv_gl_imprv_hstd_val
			begin
				INSERT INTO auto_balance_sup_group_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					sup_action,
					column_name,
					pv_gl_val,
					sup_gl_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					@sup_action,
					'imprv_hstd_val',
					@pv_gl_imprv_hstd_val,
					@sup_gl_imprv_hstd_val
				)
			end

			if @sup_gl_imprv_non_hstd_val <> @pv_gl_imprv_non_hstd_val
			begin
				INSERT INTO auto_balance_sup_group_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					sup_action,
					column_name,
					pv_gl_val,
					sup_gl_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					@sup_action,
					'imprv_non_hstd_val',
					@pv_gl_imprv_non_hstd_val,
					@sup_gl_imprv_non_hstd_val
				)
			end

			if @sup_gl_appraised_val <> @pv_gl_appraised_val
			begin
				INSERT INTO auto_balance_sup_group_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					sup_action,
					column_name,
					pv_gl_val,
					sup_gl_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					@sup_action,
					'appraised_val',
					@pv_gl_appraised_val,
					@sup_gl_appraised_val
				)
			end

			if @sup_gl_assessed_val <> @pv_gl_assessed_val
			begin
				INSERT INTO auto_balance_sup_group_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					sup_action,
					column_name,
					pv_gl_val,
					sup_gl_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					@sup_action,
					'assessed_val',
					@pv_gl_assessed_val,
					@sup_gl_assessed_val
				)
			end

			if @sup_gl_market <> @pv_gl_market
			begin
				INSERT INTO auto_balance_sup_group_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					sup_action,
					column_name,
					pv_gl_val,
					sup_gl_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					@sup_action,
					'market',
					@pv_gl_market,
					@sup_gl_market
				)
			end

			if @sup_gl_ag_use_val <> @pv_gl_ag_use_val
			begin
				INSERT INTO auto_balance_sup_group_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					sup_action,
					column_name,
					pv_gl_val,
					sup_gl_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					@sup_action,
					'ag_use_val',
					@pv_gl_ag_use_val,
					@sup_gl_ag_use_val
				)
			end

			if @sup_gl_ag_market <> @pv_gl_ag_market
			begin
				INSERT INTO auto_balance_sup_group_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					sup_action,
					column_name,
					pv_gl_val,
					sup_gl_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					@sup_action,
					'ag_market',
					@pv_gl_ag_market,
					@sup_gl_ag_market
				)
			end

			if @sup_gl_timber_market <> @pv_gl_timber_market
			begin
				INSERT INTO auto_balance_sup_group_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					sup_action,
					column_name,
					pv_gl_val,
					sup_gl_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					@sup_action,
					'timber_market',
					@pv_gl_timber_market,
					@sup_gl_timber_market
				)
			end

			if @sup_gl_timber_use <> @pv_gl_timber_use
			begin
				INSERT INTO auto_balance_sup_group_pv_report (
					validation_id,
					prop_val_yr,
					sup_num,
					prop_id,
					sup_action,
					column_name,
					pv_gl_val,
					sup_gl_val
				)
				VALUES (
					@input_validation_id,
					@prop_val_yr,
					@sup_num,
					@prop_id,
					@sup_action,
					'timber_use',
					@pv_gl_timber_use,
					@sup_gl_timber_use
				)
			end

			fetch next from cursor_totals into
				@sup_group_id,
				@sup_action,
				@cur_sup_num,
				@cur_sup_yr,
				@prev_sup_num,
				@prev_sup_yr,
				@prop_id,
				@sup_gl_market,
				@sup_gl_imprv_non_hstd_val,
				@sup_gl_imprv_hstd_val,
				@sup_gl_land_hstd_val,
				@sup_gl_appraised_val,
				@sup_gl_land_non_hstd_val,
				@sup_gl_assessed_val,
				@sup_gl_ag_market,
				@sup_gl_ag_use_val,
				@sup_gl_timber_market,
				@sup_gl_timber_use,
				@pv_gl_land_hstd_val,
				@pv_gl_land_non_hstd_val,
				@pv_gl_imprv_hstd_val,
				@pv_gl_imprv_non_hstd_val,
				@pv_gl_appraised_val,
				@pv_gl_assessed_val,
				@pv_gl_market,
				@pv_gl_ag_use_val,
				@pv_gl_ag_market,
				@pv_gl_timber_market,
				@pv_gl_timber_use		
		end
		
		close cursor_totals
		deallocate cursor_totals

	end

end

select @lImbalance

GO

