





CREATE PROCEDURE CreateFutureYearTaxRateLayer
 @lInputFromYear	numeric(4),
 @lInputToYear		numeric(4)

AS

declare @lNumYears int
declare @lFutureYear numeric(4)

set @lNumYears = @lInputToYear - @lInputFromYear
set @lFutureYear = 0

--tax_rate
insert into tax_rate
(
	entity_id,
	tax_rate_yr,
	discount_dt,
	late_dt,
	attorney_fee_dt,
	bills_created_dt,
	m_n_o_tax_pct,
	i_n_s_tax_pct,
	prot_i_n_s_tax_pct,
	sales_tax_pct,
	levy_start_rct_num,
	supp_start_rct_num,
	stmnt_dt,
	collect_for,
	appraise_for,
	ready_to_certify,
	special_inv_entity,
	ready_to_create_bill,
	PLUS_1_INT_PCT,
	PLUS_1_PENALTY_PCT,
	PLUS_2_INT_PCT,
	PLUS_2_PENALTY_PCT,
	PLUS_3_INT_PCT,
	PLUS_3_PENALTY_PCT,
	PLUS_4_INT_PCT,
	PLUS_4_PENALTY_PCT,
	PLUS_5_INT_PCT,
	PLUS_5_PENALTY_PCT,
	PLUS_6_INT_PCT,
	PLUS_6_PENALTY_PCT,
	PLUS_7_INT_PCT,
	PLUS_7_PENALTY_PCT,
	PLUS_8_INT_PCT,
	PLUS_8_PENALTY_PCT,
	PLUS_9_INT_PCT,
	PLUS_9_PENALTY_PCT,
	attorney_fee_pct,
	effective_due_dt,
	collect_option,
	weed_control_pct,
	ptd_option,
	enable_freeze_ceiling_calculation
)
select
	entity_id,
	@lFutureYear, --tax_rate_yr
	case when discount_dt is not null then dateadd(year, @lNumYears, discount_dt) else null end, --discount_dt
	case when late_dt is not null then dateadd(year, @lNumYears, late_dt) else null end, --late_dt
	case when attorney_fee_dt is not null then dateadd(year, @lNumYears, attorney_fee_dt) else null end, --attorney_fee_dt
	null, --bills_created_dt
	m_n_o_tax_pct,
	i_n_s_tax_pct,
	prot_i_n_s_tax_pct,
	sales_tax_pct,
	levy_start_rct_num,
	supp_start_rct_num,
	case when stmnt_dt is not null then dateadd(year, @lNumYears, stmnt_dt) else null end, --stmnt_dt
	collect_for,
	appraise_for,
	'F', --ready_to_certify
	special_inv_entity,
	'F', --ready_to_create_bill
	PLUS_1_INT_PCT,
	PLUS_1_PENALTY_PCT,
	PLUS_2_INT_PCT,
	PLUS_2_PENALTY_PCT,
	PLUS_3_INT_PCT,
	PLUS_3_PENALTY_PCT,
	PLUS_4_INT_PCT,
	PLUS_4_PENALTY_PCT,
	PLUS_5_INT_PCT,
	PLUS_5_PENALTY_PCT,
	PLUS_6_INT_PCT,
	PLUS_6_PENALTY_PCT,
	PLUS_7_INT_PCT,
	PLUS_7_PENALTY_PCT,
	PLUS_8_INT_PCT,
	PLUS_8_PENALTY_PCT,
	PLUS_9_INT_PCT,
	PLUS_9_PENALTY_PCT,
	null, --attorney_fee_pct
	case when effective_due_dt is not null then dateadd(year, @lNumYears, effective_due_dt) else null end, --effective_due_dt
	collect_option,
	null, --weed_control_pct
	ptd_option,
	enable_freeze_ceiling_calculation
from tax_rate
where tax_rate_yr = @lInputFromYear
and not exists (
			select * from tax_rate as tr1
			where tr1.entity_id = entity_id
			and tr1.tax_rate_yr = @lFutureYear
		)

--entity_exmpt
insert into entity_exmpt
(
	entity_id,
	exmpt_type_cd,
	exmpt_tax_yr,
	entity_exmpt_desc,
	special_exmpt,
	local_option_pct,
	state_mandate_amt,
	local_option_min_amt,
	local_option_amt,
	apply_pct_ownrship,
	freeze_flag,
	transfer_flag,
	set_initial_freeze_date,
	set_initial_freeze_user_id
)
select
	entity_id,
	exmpt_type_cd,
	@lFutureYear, --exmpt_tax_yr
	entity_exmpt_desc,
	special_exmpt,
	local_option_pct,
	state_mandate_amt,
	local_option_min_amt,
	local_option_amt,
	apply_pct_ownrship,
	freeze_flag,
	transfer_flag,
	set_initial_freeze_date,
	set_initial_freeze_user_id
from entity_exmpt
where exmpt_tax_yr = @lInputFromYear
and not exists (
			select * from entity_exmpt as ee1
			where ee1.entity_id = entity_id
			and ee1.exmpt_type_cd = exmpt_type_cd
			and ee1.exmpt_tax_yr = @lFutureYear
		)

GO

