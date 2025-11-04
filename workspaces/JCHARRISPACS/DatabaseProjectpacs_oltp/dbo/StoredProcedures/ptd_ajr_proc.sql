

/****** History:
	Date		Who		Reason
	==========	====		=======================================
	07/29/2000	RAA		Put edit in for AJR23 + AJR24 <> AJR21
	08/09/2000	RAA		Check total exempt amount as well as exempt type code for X
					If ag_val > 0 set state_cd = 'D1'
	08/11/2000	RAA		Don't do the force to 'D1'.  PopulatePropertyOwnerEntityStateCd
					has been changed to handle that.
	08/16/2000	RAA		Modified to use ptd_multi_unit and check front_foot for zero.
	08/23/2000	RAA		Make account taxable = 0 for CAD entity.
	08/31/2000	RAA		Added in Hale change and EX366 as EX and timber logic for Lamar
	09/06/2000	RAA		Allow HS exemptions on School and County entities.
	09/07/2000	RAA		Fixed Account Taxable calculation
	09/11/2000	RAA		Fixed problem with abatements not having effective date.
	09/12/2000	RAA		Fixed problem with DV exemptions not splitting correctly.
	09/14/2000	RAA		Fixed problem with AB exemptions not setting indicator.
					Also deducted productivity loss from temp_market for exemptions.
	09/15/2000	RAA		Set local option percentage indicator when necessary.
	09/20/2000	RAA		Fix bogus setting of state mandated HS exemption indicator
	09/26/2000	RAA		Made fix for prorated EX exemptions.
	10/02/2000	RAA		Made change for MN and state_cd <> G = Personal.
	10/04/2000	RAA		Fixed problem with HS being distributed.
	10/25/2000	RAA		Fixed problem with EX exemptions terminated previously.
	05/37/2003	JMC		Added additional checks for certified indicator
	09/17/2003	RAA		Check for multiple exemptions on a totally exempt property
	10/08/2003	JMC		Added CH Exemption support
	03/23/2004	ELZ		Enhanced stored proc for performance by adding temp tables for exemptions, protests, and multi-owners
					Also changed all occurances of 'select' to 'set' where applicable; formatting enhanced as well
*/

CREATE PROCEDURE ptd_ajr_proc
	@input_yr		numeric(4),
	@input_cad_id_code	char(3)

WITH RECOMPILE

AS

SET NOCOUNT ON

--PTD Variables
declare @ptd_record_type										char(3)
declare @ptd_cad_id_code										char(3)
declare @ptd_account_number										varchar(25)
declare @ptd_taxing_unit_number										varchar(10)
declare @ptd_county_fund_type_ind									char(1)
declare @ptd_local_optional_percentage_homestead_exemption_amount					numeric(9)
declare @ptd_state_mandated_homestead_exemption_amount							numeric(9)
declare @ptd_state_mandated_over65_homeowner_exemption_amount						numeric(9)
declare @ptd_state_mandated_disabled_homeowner_exemption_amount						numeric(9)
declare @ptd_local_optional_over65_homeowner_exemption_amount						numeric(9)
declare @ptd_local_optional_disabled_homeowner_exemption_amount						numeric(9)
declare @ptd_total_exemption_amount									numeric(9)
declare @ptd_local_optional_historical_exemption_amount							numeric(9)
declare @ptd_solar_wind_powered_exemption_amount							numeric(9)
declare @ptd_state_mandated_disabled_deceased_veteran_exemption_amount					numeric(9)
declare @ptd_other_exemption_loss_amount								numeric(9)
declare @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements					numeric(9)
declare @ptd_total_payments_into_tax_increment_financing_funds						numeric(9)
declare @ptd_comptrollers_category_code									varchar(2)
declare @ptd_category_market_value_land_before_any_cap							numeric(11)
declare @ptd_total_acres_for_category									numeric(11,3)
declare @ptd_productivity_value										numeric(11)
declare @ptd_productivity_value_loss									numeric(11)
declare @ptd_category_market_value_improvement_before_any_cap						numeric(11)
declare @ptd_account_taxable_value									numeric(11)
declare @ptd_tax_ceiling										numeric(11,2)
declare @ptd_freeport_exemption_loss									numeric(11)
declare @ptd_pollution_control_exemption_loss								numeric(9)
declare @ptd_personal_property_value									numeric(11)
declare @ptd_proration_loss_to_property									numeric(9)
declare @ptd_levy_lost_to_tax_deferral_of_over65_or_increasing_home_taxes				numeric(9)
declare @ptd_capped_value_of_residential_homesteads							numeric(9)
declare @ptd_value_loss_to_the_hscap_on_residential_homesteads						numeric(9)
declare @ptd_water_conservation_initiatives_exemption_amount						numeric(9)
declare @ptd_local_optional_homestead_exemption_percentage						numeric(13,10)
declare @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993	numeric(9)
declare @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993		numeric(9)
declare @ptd_tax_increment_financing_captured_appraised_value_loss					numeric(9)
declare @ptd_mineral_value										numeric(11)
declare @ptd_last_reappraisal_year									numeric(4)
declare @ptd_state_mandated_homestead_exemption_indicator						char(1)
declare @ptd_state_mandated_over6555_surviving_spouse_exemption_indicator				char(1)
declare @ptd_state_mandated_disabled_homeowner_exemption_indicator					char(1)
declare @ptd_local_optional_percentage_homestead_indicator						char(1)
declare @ptd_local_optional_over6555_surviving_spouse_exemption_indicator				char(1)
declare @ptd_local_optional_disabled_homeowner_exemption_indicator					char(1)
declare @ptd_state_mandated_disabled_or_deceased_veteran_exemption_indicator				char(1)
declare @ptd_abatements_indicator									char(1)
declare @ptd_tax_increment_financing_indicator								char(1)
declare @ptd_certified_value_indicator									char(1)
declare @ptd_pollution_control_exemption_indicator							char(1)
declare @ptd_freeport_exemption_indicator								char(1)
declare @ptd_tax_ceiling_indicator									char(1)
declare @ptd_hscap_on_residential_homesteads_indicator							char(1)
declare @ptd_water_conservation_initiatives_indicator							char(1)
declare @ptd_multiple_owner_indicator									char(1)
declare @ptd_payments_into_tax_increment_financing_funds_eligible_for_deduction				numeric(11)
declare @ptd_land_units											numeric(5)
declare @ptd_abatement_granted_before_may311993_indicator						char(1)
declare @certified_year											char(1)
declare @new_arb_type											char(1)


if exists (select * from pacs_year where tax_yr = @input_yr and certification_dt is not null) 
begin
	set @certified_year = 'T'
end
else
begin	
	set @certified_year = 'F'
end


set @new_arb_type = 'T'


--Database Variables for PTD_AJR_VW
declare @prop_id		int
declare @year			int
declare @sup_num		int
declare @owner_id		int
declare @entity_id		int
declare @state_cd		char(5)
declare @acres			numeric(18,4)
declare @front_foot		numeric(18,2)
declare @ag_acres		numeric(18,4)
declare @ag_use_val		numeric(14,0)
declare @ag_market		numeric(14,0)
declare @market			numeric(14,0)
declare @imprv_hstd_val		numeric(14,0)
declare @imprv_non_hstd_val	numeric(14,0)
declare @land_hstd_val		numeric(14,0)
declare @land_non_hstd_val	numeric(14,0)
declare @timber_use		numeric(14,0)
declare @timber_market		numeric(14,0)
declare @appraised_val		numeric(14,0)
declare @ten_percent_cap	numeric(14,0)
declare @assessed_val		numeric(14,0)
declare @taxable_val		numeric(14,0)
declare @homestead_val		numeric(14,0)
declare @pct_ownership		numeric(13,10)
declare @entity_pct		numeric(13,10)
declare @state_cd_pct		numeric(13,10)
declare @hs_pct			numeric(13,10)
declare @taxing_unit_num	varchar(8)
declare @county_taxing_unit_ind	varchar(1)
declare @prop_type_cd		varchar(5)
declare @temp_homestead_val	numeric(14,0)
declare @temp_state_amt		numeric(14,0)
declare @temp_local_amt		numeric(14,0)
declare @ag_loss		numeric(14,0)
declare @tif_land_val		numeric(14,0)
declare @tif_imprv_val		numeric(14,0)
declare @last_appraisal_yr	int
declare @owner_count		int
declare @message		varchar(150)
declare @temp_value		varchar(20)
declare @temp_number		numeric(14,0)
declare @temp_market_val	numeric(14,0)
declare @prev_entity_id		int
declare @applied_hs		int
declare @prev_account_number	varchar(25)
declare @beginning_of_year	varchar(10)
declare @ending_of_year		varchar(10)

/* temporary variable that stores the dv amount for a property owner combination */
declare	@dv_exempt_amt	numeric(14, 0)


--Database Variables for PTD_AJR_EXEMPT_VW
declare @FS_PTD_AJR_EXEMPT_VW		int
declare @pae_exempt_type_cd		varchar(10)
declare @pae_state_amt			numeric(9)
declare @pae_local_amt			numeric(9)
declare @pae_taxable_val		numeric(9)
declare @pae_entity_type_cd		varchar(10)
declare @pae_taxing_unit_num		varchar(10)
declare @pae_entity_id			int
declare @pae_prev_entity_id		int
declare @pae_effective_dt		datetime
declare @pae_termination_dt		datetime
declare @pae_freeze_yr			numeric(4)
declare @pae_freeze_ceiling		numeric(9)
declare @pae_entity_cd			varchar(5)
declare @pae_county_taxing_unit		varchar(1)
declare @pae_use_freeze			varchar(1)
declare @pae_local_option_pct		numeric(13,10)

/* tax rate field, to calculate tiff payment */
declare @tax_rate			numeric(13,10)

--Database Variables for OWNER_CNT
declare @oc_owner_count		int

--Stored Procedure Variables
declare @max_val			numeric(9)
declare @curr_state_cd			varchar(2)
declare @temp_message			varchar(50)

--Initialize Variables
set @ptd_record_type 	= 'AJR'
set @ptd_cad_id_code	= @input_cad_id_code

--Delete everything in the ptd_apl table
truncate table ptd_ajr

set @prev_entity_id = 0
set @prev_account_number = ''

/* Make a temp table from ptd_ajr_exempt_vw with only the data we'll need, and indexed to our purposes */
if object_id('tempdb..#ptd_ajr_exempt_vw') is not null
begin
	drop table #ptd_ajr_exempt_vw
end

if object_id('tempdb..#tmp__arb_protest') is not null
begin
	drop table #tmp__arb_protest
end

if object_id('tempdb..#tmp_arb_protest') is not null
begin
	drop table #tmp_arb_protest
end

if object_id('tempdb..#tmp_multi_owner') is not null
begin
	drop table #tmp_multi_owner
end

--EXEMPTIONS
create table #ptd_ajr_exempt_vw
(
	prop_id int not null,
	exmpt_type_cd char(5) not null,
	state_amt numeric(14,0) null,
	local_amt numeric(14,0) null,
	effective_dt datetime null,
	termination_dt datetime null,
	freeze_yr numeric(4,0) null,
	freeze_ceiling numeric(14,2) null,
	owner_id int not null,
	sup_num int not null,
	local_option_pct numeric(13,10) null,
	use_freeze char(1) null,
	sp_date_approved datetime null,
	entity_id int not null,
	entity_type_cd char(5) not null
)

insert #ptd_ajr_exempt_vw
(
	prop_id,
	exmpt_type_cd,
	state_amt,
	local_amt,
	effective_dt,
	termination_dt,
	freeze_yr,
	freeze_ceiling,
	owner_id,
	sup_num,
	local_option_pct,
	use_freeze,
	sp_date_approved,
	entity_id,
	entity_type_cd
)
select
	prop_id,
	exmpt_type_cd,
	state_amt,
	local_amt,
	effective_dt,
	termination_dt,
	freeze_yr,
	freeze_ceiling,
	owner_id,
	sup_num,
	local_option_pct,
	use_freeze,
	sp_date_approved,
	entity_id,
	entity_type_cd
from ptd_ajr_exempt_vw
where 	exmpt_tax_yr = @input_yr

create clustered index idx_temp on #ptd_ajr_exempt_vw (prop_id, entity_id, owner_id, exmpt_type_cd)
with fillfactor = 100

--ARB PROTEST RECORDS
select distinct prop_id as prop_id
into #tmp__arb_protest
from _arb_protest with (nolock)
where prop_val_yr = @input_yr
	and prot_complete_dt is null
order by prop_id

create clustered index idx__arb_protest on #tmp__arb_protest (prop_id) with fillfactor = 100

select distinct prop_id as prop_id
into #tmp_arb_protest
from arb_protest with (nolock)
where appr_year = @input_yr
	and protest_record = 'T'
	and close_date is null
order by prop_id

create clustered index idx_arb_protest on #tmp_arb_protest (prop_id) with fillfactor = 100

--MULTIPLE OWNERS
select owner.prop_id
into #tmp_multi_owner
from owner with (nolock),
	ptd_supp_assoc with (nolock)
where owner.prop_id = ptd_supp_assoc.prop_id
	and owner.sup_num = ptd_supp_assoc.sup_num
	and owner.owner_tax_yr = ptd_supp_assoc.sup_yr
group by owner.prop_id
having count(owner.prop_id) > 1
order by owner.prop_id

create clustered index idx_multi_owner on #tmp_multi_owner (prop_id) with fillfactor = 100


--START CURSOR
DECLARE PTD_AJR_VW CURSOR FAST_FORWARD
FOR SELECT 	prop_id,
		owner_id,
		sup_num,
		year,
		entity_id,
		state_cd,
		acres,
		front_foot,
		ag_acres,
		ag_use_val,
		ag_market,
		market,
		imprv_hstd_val,
		imprv_non_hstd_val,
		land_hstd_val,
		land_non_hstd_val,
		timber_use,
		timber_market,
		appraised_val,
		ten_percent_cap,
		assessed_val,
		taxable_val,
		homestead_val,
		pct_ownership,	
		entity_pct,
		state_cd_pct,
		replace(taxing_unit_num,'-',''),
		ptd_multi_unit,
		prop_type_cd,
		ag_loss,
		tif_land_val,
		tif_imprv_val,
		last_appraisal_yr,
		hs_pct,
		tax_rate
	from PTD_AJR_VW with (nolock)
	where year = @input_yr
	order by prop_id, owner_id, entity_id, state_cd

OPEN PTD_AJR_VW

FETCH NEXT FROM PTD_AJR_VW into	@prop_id,
					@owner_id,
					@sup_num,
					@year,
					@entity_id,
					@state_cd,
					@acres,
					@front_foot,
					@ag_acres,
					@ag_use_val,
					@ag_market,
					@market,
					@imprv_hstd_val,
					@imprv_non_hstd_val,
					@land_hstd_val,
					@land_non_hstd_val,
					@timber_use,
					@timber_market,
					@appraised_val,
					@ten_percent_cap,
					@assessed_val,
					@taxable_val,
					@homestead_val,
					@pct_ownership,	
					@entity_pct,
					@state_cd_pct,
					@taxing_unit_num,
					@county_taxing_unit_ind,
					@prop_type_cd,
					@ag_loss,
					@tif_land_val,
					@tif_imprv_val,
					@last_appraisal_yr,
					@hs_pct,
					@tax_rate


WHILE (@@FETCH_STATUS = 0)
BEGIN
	set @ptd_other_exemption_loss_amount = 0
	set @ptd_total_payments_into_tax_increment_financing_funds = 0
	set @ptd_total_acres_for_category = 0
	set @ptd_proration_loss_to_property = 0
	set @ptd_local_optional_homestead_exemption_percentage = 0
	set @ptd_payments_into_tax_increment_financing_funds_eligible_for_deduction = 0
	set @ptd_state_mandated_homestead_exemption_amount = 0
	set @ptd_state_mandated_over65_homeowner_exemption_amount = 0
	set @ptd_state_mandated_disabled_homeowner_exemption_amount = 0
	set @ptd_local_optional_over65_homeowner_exemption_amount = 0
	set @ptd_local_optional_disabled_homeowner_exemption_amount = 0
	set @ptd_total_exemption_amount = 0
	set @ptd_local_optional_historical_exemption_amount = 0
	set @ptd_solar_wind_powered_exemption_amount = 0
	set @ptd_state_mandated_disabled_deceased_veteran_exemption_amount = 0
	set @ptd_other_exemption_loss_amount = 0
	set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements = 0
	set @ptd_total_payments_into_tax_increment_financing_funds = 0
	set @ptd_tax_ceiling = 0
	set @ptd_freeport_exemption_loss = 0
	set @ptd_personal_property_value = 0
	set @ptd_proration_loss_to_property = 0
	set @ptd_levy_lost_to_tax_deferral_of_over65_or_increasing_home_taxes = 0
	set @ptd_water_conservation_initiatives_exemption_amount = 0
	set @ptd_local_optional_homestead_exemption_percentage = 0
	set @ptd_local_optional_percentage_homestead_exemption_amount = 0
	set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993 = 0
	set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993 = 0
	set @ptd_tax_increment_financing_captured_appraised_value_loss = 0
	set @ptd_mineral_value = 0
	set @ptd_state_mandated_homestead_exemption_indicator = 'N'
	set @ptd_state_mandated_over6555_surviving_spouse_exemption_indicator = 'N'
	set @ptd_state_mandated_disabled_homeowner_exemption_indicator = 'N'
	set @ptd_local_optional_percentage_homestead_indicator = 'N'
	set @ptd_local_optional_over6555_surviving_spouse_exemption_indicator = 'N'
	set @ptd_local_optional_disabled_homeowner_exemption_indicator = 'N'
	set @ptd_state_mandated_disabled_or_deceased_veteran_exemption_indicator = 'N'
	set @ptd_abatements_indicator = 'N'
	set @ptd_tax_increment_financing_indicator = 'N'
	set @ptd_certified_value_indicator = 'N'
	set @ptd_pollution_control_exemption_indicator = 'N'
	set @ptd_freeport_exemption_indicator = 'N'
	set @ptd_tax_ceiling_indicator = '3'
	set @ptd_hscap_on_residential_homesteads_indicator = 'N'
	set @ptd_multiple_owner_indicator = 'N'
	set @ptd_payments_into_tax_increment_financing_funds_eligible_for_deduction = 0
	set @ptd_abatement_granted_before_may311993_indicator = 'N'
	set @ptd_account_number = cast(@prop_id as varchar(20)) + '-' + cast(@owner_id as varchar(20))
	set @ptd_taxing_unit_number = @taxing_unit_num
	set @ptd_county_fund_type_ind = isnull(@county_taxing_unit_ind,'')
	set @ptd_comptrollers_category_code = @state_cd
	set @temp_homestead_val = @homestead_val - @ten_percent_cap
	set @temp_market_val = @market - @ten_percent_cap
	set @ptd_category_market_value_land_before_any_cap = @land_hstd_val+@land_non_hstd_val+@ag_market+@timber_market
	set @ptd_productivity_value = isnull(@ag_use_val,0) + isnull(@timber_use,0)
	set @ptd_category_market_value_improvement_before_any_cap = @imprv_hstd_val+@imprv_non_hstd_val
	set @ptd_account_taxable_value = @taxable_val
	set @ptd_value_loss_to_the_hscap_on_residential_homesteads = @ten_percent_cap
	set @ptd_capped_value_of_residential_homesteads = 0
	set @ptd_water_conservation_initiatives_indicator = 'N'
	set @ptd_productivity_value_loss = (isnull(@ag_market,0) - isnull(@ag_use_val,0)) + (isnull(@timber_market,0) - isnull(@timber_use,0))
	set @ptd_last_reappraisal_year = isnull(@last_appraisal_yr,0)
	set @temp_market_val = @temp_market_val - @ptd_productivity_value_loss
	set @ptd_land_units = 4

	if (@certified_year = 'F')
	begin
		set @ptd_certified_value_indicator = 'B'
	end
	else
	begin
		set @ptd_certified_value_indicator = 'A'

		if ((@new_arb_type = 'T') and exists (select * from #tmp__arb_protest 
							where prop_id = @prop_id))
		begin
			set @ptd_certified_value_indicator = 'C'
		end
		else if exists (select * from #tmp_arb_protest 
				where prop_id = @prop_id)
		begin
			set @ptd_certified_value_indicator = 'C'
		end
	end

	if (@prev_entity_id <> @entity_id or @prev_account_number <> @ptd_account_number)
	begin
		set @applied_hs = 0

		set @dv_exempt_amt = 0

		select @dv_exempt_amt = sum(state_amt + local_amt)
		from #PTD_AJR_EXEMPT_VW
		where prop_id = @prop_id
			and entity_id = @entity_id
			and owner_id = @owner_id
			and exmpt_type_cd like 'DV%'

		if (@dv_exempt_amt is null)
		begin
			set @dv_exempt_amt = 0
		end
	end

	if (@ptd_value_loss_to_the_hscap_on_residential_homesteads <> 0)
	begin
		set @ptd_capped_value_of_residential_homesteads = @assessed_val
	end

	if (@ag_acres <> 0)
	begin
		set @ptd_total_acres_for_category = @ag_acres
		set @ptd_land_units = 1
	end
	else
	begin
		if (@acres <> 0)
		begin
			set @ptd_total_acres_for_category = @acres
			set @ptd_land_units = 1
		end
		else
		begin
			if (@front_foot <> 0)
			begin
				set @ptd_total_acres_for_category = @front_foot
				set @ptd_land_units = 3
			end
		end
	end

	if ((@ptd_capped_value_of_residential_homesteads > 0) or (@ptd_value_loss_to_the_hscap_on_residential_homesteads > 0))
	begin
		set @ptd_hscap_on_residential_homesteads_indicator = 'Y'
	end

	if (@ptd_productivity_value > 0 and @ptd_productivity_value_loss = 0)
	begin
		set @message = 'Property with productivity value must have a productivity loss > 0'
		exec ptd_insert_error 'AJR', @prop_id, '0', @message
	end

	if (@ptd_capped_value_of_residential_homesteads > 0 and @ptd_value_loss_to_the_hscap_on_residential_homesteads = 0)
	begin
		set @message = 'Reported capped value, but 10% cap loss is 0'
		exec ptd_insert_error 'AJR', @prop_id, '0', @message
	end

	if (@ptd_value_loss_to_the_hscap_on_residential_homesteads > 0 and @ptd_capped_value_of_residential_homesteads = 0)
	begin
		set @message = 'Reported 10% cap value loss, but capped value is 0'
		exec ptd_insert_error 'AJR', @prop_id, '0', @message
	end

	if (@prop_type_cd = 'P' or @prop_type_cd = 'A')
	begin
		set @ptd_personal_property_value = @appraised_val
	end

	if (@prop_type_cd = 'MN' and left(@ptd_comptrollers_category_code, 1) = 'G')
	begin
		set @ptd_mineral_value = @appraised_val
	end
	else
	begin
		if (@prop_type_cd = 'MN')
		begin
			set @ptd_personal_property_value = @appraised_val
		end
	end

	if exists (select prop_id
			from #tmp_multi_owner
			where prop_id = @prop_id)
	begin
		select @ptd_multiple_owner_indicator = 'Y'
	end


	--
	-- Now do the exemptions
	--

	--
	-- If this is not a Real property, do the HS first
	--

/*******************************************************************************************/
/************** process exemptions that come out of homesite value only ********/
/*******************************************************************************************/

	if (@prop_type_cd <> 'R' and @prop_type_cd <> 'MH' and @applied_hs = 0)
	begin
		select	@pae_state_amt         = state_amt,
			@pae_local_amt         = local_amt,
			@pae_entity_type_cd    = entity_type_cd,
			@pae_local_option_pct  = local_option_pct

		from #PTD_AJR_EXEMPT_VW
		where prop_id = @prop_id
			and entity_id = @entity_id
			and owner_id = @owner_id
			and exmpt_type_cd = 'HS' 

		if (@@ROWCOUNT = 1)
		begin
				if (@pae_entity_type_cd = 'S' or 
				    @pae_entity_type_cd = 'G' or
				    @pae_entity_type_cd = 'R')
				begin
					set @temp_state_amt = @pae_state_amt * @hs_pct

					if (@temp_state_amt <= @temp_homestead_val)
					begin
						set @ptd_state_mandated_homestead_exemption_amount = @temp_state_amt
						set @temp_homestead_val = @temp_homestead_val - @temp_state_amt
						set @temp_market_val = @temp_market_val - @temp_state_amt
					end
					else
					begin
						set @ptd_state_mandated_homestead_exemption_amount = @ptd_state_mandated_homestead_exemption_amount + @temp_homestead_val
						set @temp_market_val = @temp_market_val - @temp_homestead_val
						set @temp_homestead_val = 0
					end

					if (@ptd_state_mandated_homestead_exemption_amount > 0)
					begin
						set @ptd_state_mandated_homestead_exemption_indicator = 'Y'
					end

					if (@pae_local_option_pct > 0)
					begin
						set @ptd_local_optional_homestead_exemption_percentage = @pae_local_option_pct
					end

					set @temp_local_amt = isnull(@pae_local_amt,0) * @hs_pct
--					select @temp_local_amt = isnull(@pae_local_amt,0)

					if (@temp_local_amt <= @temp_homestead_val)
					begin
						set @temp_homestead_val = @temp_homestead_val - @temp_local_amt
						set @temp_market_val = @temp_market_val - @temp_local_amt
					end
					else
					begin
						set @temp_local_amt  = @temp_homestead_val
						set @temp_market_val = @temp_market_val - @temp_homestead_val
						set @temp_homestead_val = 0
					end

					if (@temp_local_amt > 0)
					begin
						set @ptd_local_optional_percentage_homestead_indicator = 'Y'
						set @ptd_local_optional_percentage_homestead_exemption_amount = @temp_local_amt
					end

					if (@state_cd <> 'A' and @state_cd <> 'B' and 
					    @state_cd <> 'E' and @state_cd <> 'F1' and @state_cd <> 'M1' and
					   ( @ptd_state_mandated_homestead_exemption_amount+ @ptd_local_optional_percentage_homestead_exemption_amount) <> 0 )
					begin
						set @message = 'The state code has homesite value and exemption amounts are being applied to it, but it is not A, B, E, F1, or M1.'
						set @temp_value = @state_cd
						exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
					end
				end
		end

	end

	--
	-- Now process the Over65 exemptions
	--

	if (@applied_hs = 0)
	begin
		select	@pae_state_amt      = state_amt,
			@pae_local_amt      = local_amt,
			@pae_entity_type_cd = entity_type_cd,
			@pae_freeze_ceiling = freeze_ceiling,
			@pae_use_freeze     = use_freeze,
			@pae_freeze_yr      = freeze_yr
		from #PTD_AJR_EXEMPT_VW
		where prop_id = @prop_id
			and entity_id = @entity_id
			and owner_id = @owner_id
			and exmpt_type_cd = 'OV65'

		if (@@ROWCOUNT = 1)
		begin
				if (@pae_entity_type_cd = 'S' )
				begin
					set @temp_state_amt = @pae_state_amt * @hs_pct
--					select @temp_state_amt = @pae_state_amt

					if (@temp_state_amt <= @temp_homestead_val)
					begin
						set @ptd_state_mandated_over65_homeowner_exemption_amount = @temp_state_amt
						set @temp_homestead_val = @temp_homestead_val - @temp_state_amt
						set @temp_market_val = @temp_market_val - @temp_state_amt
					end
					else
					begin
						set @ptd_state_mandated_over65_homeowner_exemption_amount = @temp_homestead_val
						set @temp_market_val = @temp_market_val - @temp_homestead_val	
						set @temp_homestead_val = 0
					end

					if (@ptd_state_mandated_over65_homeowner_exemption_amount > 0)
					begin
						set @ptd_state_mandated_over6555_surviving_spouse_exemption_indicator = 'Y'
					end

					if (@pae_use_freeze = 'T')
					begin
						if (@pae_freeze_yr <= @input_yr)
						begin
							set @ptd_tax_ceiling = isnull(@pae_freeze_ceiling,0)
							set @ptd_tax_ceiling_indicator = '1'
						end
					end
				end

				set @temp_local_amt = @pae_local_amt * @hs_pct
				
				if (@temp_local_amt <= @temp_homestead_val)
				begin
					set @temp_homestead_val = @temp_homestead_val - @temp_local_amt
					set @temp_market_val = @temp_market_val - @temp_local_amt
				end
				else
				begin
					set @temp_local_amt  = @temp_homestead_val
					set @temp_market_val = @temp_market_val - @temp_homestead_val
					set @temp_homestead_val = 0
				end

				set @ptd_local_optional_over65_homeowner_exemption_amount = @temp_local_amt

				if (@ptd_local_optional_over65_homeowner_exemption_amount > 0)
				begin
					set @ptd_local_optional_over6555_surviving_spouse_exemption_indicator = 'Y'
				end
	
				
				if (@state_cd <> 'A' and @state_cd <> 'B' and 
				    @state_cd <> 'E' and @state_cd <> 'F1' and @state_cd <> 'M1' and
				    (@ptd_state_mandated_over65_homeowner_exemption_amount + @ptd_local_optional_over65_homeowner_exemption_amount) <> 0 )
				begin

					set @message = 'The state code has homesite value and exemption amounts are being applied to it, but it is not A, B, E, F1, or M1.'
					set @temp_value = @state_cd
					exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
				end
		end
	end


	set @ptd_state_mandated_over65_homeowner_exemption_amount = isnull(@ptd_state_mandated_over65_homeowner_exemption_amount, 0)
	set @ptd_local_optional_over65_homeowner_exemption_amount = isnull(@ptd_local_optional_over65_homeowner_exemption_amount, 0)

	if (@ptd_county_fund_type_ind = 'B' and @ptd_state_mandated_over65_homeowner_exemption_amount >0 and @ptd_local_optional_over65_homeowner_exemption_amount > 0)
	begin
		set @message = 'Cannot have both state and local over65 exemption for county entity'
		set @temp_value = cast(@ptd_local_optional_over65_homeowner_exemption_amount as varchar(20))
		exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
	end

	--
	-- Now process the Over65 for spouse exemption
	--

	if (@applied_hs = 0)
	begin
		select	@pae_state_amt = state_amt,
			@pae_local_amt = local_amt,
			@pae_entity_type_cd = entity_type_cd,
			@pae_freeze_ceiling = freeze_ceiling,
			@pae_use_freeze     = IsNull(use_freeze, 'F'),
			@pae_freeze_yr      = freeze_yr

		from #PTD_AJR_EXEMPT_VW
		where prop_id = @prop_id
			and entity_id = @entity_id
			and owner_id = @owner_id
			and exmpt_type_cd = 'OV65S'

		if(@@ROWCOUNT = 1)
		begin
				if (@pae_entity_type_cd = 'S')
				begin
					set @temp_state_amt = @pae_state_amt * @hs_pct
--					select @temp_state_amt = @pae_state_amt

					if (@temp_state_amt <= @temp_homestead_val)
					begin
						set @ptd_state_mandated_over65_homeowner_exemption_amount = @ptd_state_mandated_over65_homeowner_exemption_amount + @temp_state_amt
						set @temp_homestead_val = @temp_homestead_val - @temp_state_amt
						set @temp_market_val = @temp_market_val - @temp_state_amt

					end


					else
					begin
						set @ptd_state_mandated_over65_homeowner_exemption_amount = @ptd_state_mandated_over65_homeowner_exemption_amount + @temp_homestead_val
						set @temp_market_val = @temp_market_val - @temp_homestead_val
						set @temp_homestead_val = 0
					end

					if (@ptd_state_mandated_over65_homeowner_exemption_amount > 0)
					begin
						set @ptd_state_mandated_over6555_surviving_spouse_exemption_indicator = 'Y'
					end

					-- added as part of the DP legislation : jcoco 03/24/2004
					-- previous did not capture the freeze for the ov65s but this seemed to be an ommission.
					if (@pae_use_freeze = 'T')
					begin
						if (@pae_freeze_yr <= @input_yr)
						begin
							set @ptd_tax_ceiling = isnull(@pae_freeze_ceiling,0)
							set @ptd_tax_ceiling_indicator = '1'
						end
					end

				end

				set @temp_local_amt = @pae_local_amt * @hs_pct

				if (@temp_local_amt <= @temp_homestead_val)
				begin
					set @temp_homestead_val = @temp_homestead_val - @temp_local_amt
					set @temp_market_val = @temp_market_val - @temp_local_amt
				end
				else
				begin
					set @temp_local_amt  = @temp_homestead_val
					set @temp_market_val = @temp_market_val - @temp_homestead_val
					set @temp_homestead_val = 0
				end

				set @ptd_local_optional_over65_homeowner_exemption_amount = @ptd_local_optional_over65_homeowner_exemption_amount + @temp_local_amt
				
				if (@ptd_local_optional_over65_homeowner_exemption_amount > 0)
				begin
					set @ptd_local_optional_over6555_surviving_spouse_exemption_indicator = 'Y'
				end

				if (@state_cd <> 'A' and @state_cd <> 'B' and 
				    @state_cd <> 'E' and @state_cd <> 'F1' and @state_cd <> 'M1' and
				    (@ptd_state_mandated_over65_homeowner_exemption_amount + @ptd_local_optional_over65_homeowner_exemption_amount ) <> 0 )
				begin
					set @message = 'The state code has homesite value and exemption amounts are being applied to it, but it is not A, B, E, F1, or M1.'
					set @temp_value = @state_cd
					exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
				end

		end
	end

	--
	-- Now do the Disabled Person exemption
	--

	if (@applied_hs = 0)
	begin
		select	@pae_state_amt      = state_amt,
			@pae_local_amt      = local_amt,
			@pae_entity_type_cd = entity_type_cd,
			@pae_freeze_ceiling = freeze_ceiling,
			@pae_use_freeze     = IsNull(use_freeze, 'F'),
			@pae_freeze_yr      = freeze_yr

		from #PTD_AJR_EXEMPT_VW
		where prop_id = @prop_id
			and entity_id = @entity_id
			and owner_id = @owner_id
			and exmpt_type_cd = 'DP'

		if (@@ROWCOUNT = 1)
		begin
				if (@pae_entity_type_cd = 'S')
				begin
					set @temp_state_amt = @pae_state_amt * @hs_pct
--					select @temp_state_amt = @pae_state_amt

					if (@temp_state_amt <= @temp_market_val)
					begin
						set @ptd_state_mandated_disabled_homeowner_exemption_amount = @temp_state_amt
						set @temp_market_val = @temp_market_val - @temp_state_amt
					end
					else
					begin
						set @ptd_state_mandated_disabled_homeowner_exemption_amount = @ptd_state_mandated_disabled_homeowner_exemption_amount + @temp_market_val
						set @temp_market_val = 0
					end

					if (@ptd_state_mandated_disabled_homeowner_exemption_amount > 0)
					begin
						set @ptd_state_mandated_disabled_homeowner_exemption_indicator = 'Y'
					end

					-- added as part of the DP legislation : jcoco 03/24/2004
					if (@pae_use_freeze = 'T')
					begin
						if (@pae_freeze_yr <= @input_yr)
						begin
							set @ptd_tax_ceiling = isnull(@pae_freeze_ceiling,0)
							set @ptd_tax_ceiling_indicator = '1'
						end
					end
				end

				set @temp_local_amt = @pae_local_amt * @hs_pct

				if (@temp_local_amt <= @temp_homestead_val)
				begin
					set @temp_homestead_val = @temp_homestead_val - @temp_local_amt
					set @temp_market_val = @temp_market_val - @temp_local_amt
				end
				else
				begin
					set @temp_local_amt  = @temp_homestead_val
					set @temp_market_val = @temp_market_val - @temp_homestead_val
					set @temp_homestead_val = 0
				end


				set @ptd_local_optional_disabled_homeowner_exemption_amount = @temp_local_amt
					
				if (@ptd_local_optional_disabled_homeowner_exemption_amount > 0)
				begin
					set @ptd_local_optional_disabled_homeowner_exemption_indicator = 'Y'
				end
				
		
				if (@state_cd <> 'A' and @state_cd <> 'B' and 
				    @state_cd <> 'E' and @state_cd <> 'F1' and @state_cd <> 'M1' and
				   (@ptd_state_mandated_disabled_homeowner_exemption_amount + @ptd_local_optional_disabled_homeowner_exemption_amount ) <> 0 )
				begin
					set @message = 'The state code has homesite value and exemption amounts are being applied to it, but it is not A, B, E, F1, or M1.'
					set @temp_value = @state_cd
					exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
				end

		end
	end



	--
	-- If this is a Real property, do the HS exemption at this time
	--

	if ((@prop_type_cd = 'R' or @prop_type_cd = 'MH') and @applied_hs = 0)
	begin
		select	@pae_state_amt 	      = state_amt,
			@pae_local_amt 	      = local_amt,
			@pae_entity_type_cd  = entity_type_cd,
			@pae_local_option_pct = local_option_pct

		from #PTD_AJR_EXEMPT_VW
		where prop_id = @prop_id
			and entity_id = @entity_id
			and owner_id = @owner_id
			and exmpt_type_cd = 'HS'

		if (@@ROWCOUNT = 1)
		begin
				if (@pae_entity_type_cd = 'S' or 
				    @pae_entity_type_cd = 'G' or
				    @pae_entity_type_cd = 'R')
				begin
					set @temp_state_amt = @pae_state_amt * @hs_pct
--					select @temp_state_amt = @pae_state_amt

					if (@temp_state_amt <= @temp_homestead_val)
					begin
						set @ptd_state_mandated_homestead_exemption_amount = @temp_state_amt
						set @temp_homestead_val = @temp_homestead_val - @temp_state_amt
						set @temp_market_val = @temp_market_val - @temp_state_amt
					end
					else
					begin
						set @ptd_state_mandated_homestead_exemption_amount = @ptd_state_mandated_homestead_exemption_amount + @temp_homestead_val
						set @temp_market_val = @temp_market_val - @temp_homestead_val
						set @temp_homestead_val = 0
					end
					
					if (@ptd_state_mandated_homestead_exemption_amount > 0)
					begin
						set @ptd_state_mandated_homestead_exemption_indicator = 'Y'
					end
				end

				if (@pae_local_option_pct > 0)
				begin
					set @ptd_local_optional_homestead_exemption_percentage = @pae_local_option_pct
				end

				set @temp_local_amt = isnull(@pae_local_amt,0) * @hs_pct
				
				if (@temp_local_amt <= @temp_homestead_val)
				begin
					set @temp_homestead_val = @temp_homestead_val - @temp_local_amt
					set @temp_market_val = @temp_market_val - @temp_local_amt
				end
				else
				begin
					set @temp_local_amt  = @temp_homestead_val
					set @temp_market_val = @temp_market_val - @temp_homestead_val
					set @temp_homestead_val = 0
				end


				if (@temp_local_amt > 0)
				begin
					set @ptd_local_optional_percentage_homestead_exemption_amount = @temp_local_amt
					set @ptd_local_optional_percentage_homestead_indicator = 'Y'
				end


				if (@state_cd <> 'A' and @state_cd <> 'B' and 
				    @state_cd <> 'E' and @state_cd <> 'F1' and @state_cd <> 'M1' and
				   (@ptd_state_mandated_homestead_exemption_amount + @ptd_local_optional_percentage_homestead_exemption_amount ) <> 0 )
				begin
					set @message = 'The state code has homesite value and exemption amounts are being applied to it, but it is not A, B, E, F1, or M1.'
					set @temp_value = @state_cd
					exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
				end

		end

	end


/*******************************************************************************************/
/***************************** end of  homesite value only exemptions ***************/
/*******************************************************************************************/



/**********************************************************************************************/
/* DV Exemptions, are special to say the least. DV Exemptions can come out of */
/* both homesite value & nonhomesite value and they are 9 times out of 10        */
/* accompanied by an hs exemptions, so we have to do special processing       */
/*********************************************************************************************/

	set @ptd_state_mandated_disabled_deceased_veteran_exemption_amount = 0

	if exists (select	*
		from #PTD_AJR_EXEMPT_VW
		where prop_id = @prop_id
			and entity_id = @entity_id
			and owner_id = @owner_id
			and exmpt_type_cd like 'DV%')
	begin
		if (@dv_exempt_amt <= @temp_market_val)
		begin
			set @ptd_state_mandated_disabled_deceased_veteran_exemption_amount = @ptd_state_mandated_disabled_deceased_veteran_exemption_amount + @dv_exempt_amt
			set @temp_market_val = @temp_market_val - @dv_exempt_amt
			set @dv_exempt_amt   = 0
		end
		else
		begin
			set @ptd_state_mandated_disabled_deceased_veteran_exemption_amount = @ptd_state_mandated_disabled_deceased_veteran_exemption_amount + @temp_market_val
			set @dv_exempt_amt = @dv_exempt_amt - @temp_market_val
			set @temp_market_val = 0

		end

		if (@ptd_state_mandated_disabled_deceased_veteran_exemption_amount > 0)
		begin
			set @ptd_state_mandated_disabled_or_deceased_veteran_exemption_indicator = 'Y'
		end
	end

	--
	-- Do all the Disabled Veteran exemptions
	--
/*
	DECLARE PTD_AJR_EXEMPT_VW CURSOR FORWARD_ONLY
	FOR	select	state_amt,
			local_amt,
			entity_type_cd

		from PTD_AJR_EXEMPT_VW
		where 	prop_id = @prop_id
		and	owner_id = @owner_id
		and 	exmpt_tax_yr = @input_yr
		and	entity_id = @entity_id
		and 	exmpt_type_cd like 'DV%'

	OPEN PTD_AJR_EXEMPT_VW

	FETCH NEXT FROM PTD_AJR_EXEMPT_VW into	@pae_state_amt,
								@pae_local_amt,
								@pae_entity_type_cd


	select @ptd_state_mandated_disabled_deceased_veteran_exemption_amount = 0

	while (@@FETCH_STATUS = 0)
	begin
--		if (@pae_entity_type_cd = 'S')
--		begin
			select @temp_state_amt = @pae_state_amt * @state_cd_pct
			--select @temp_state_amt = @pae_state_amt
			if (@temp_state_amt <= @temp_market_val)
			begin
				select @ptd_state_mandated_disabled_deceased_veteran_exemption_amount = @ptd_state_mandated_disabled_deceased_veteran_exemption_amount + @temp_state_amt
				select @temp_market_val = @temp_market_val - @temp_state_amt
			end
			else
			begin
				select @ptd_state_mandated_disabled_deceased_veteran_exemption_amount = @ptd_state_mandated_disabled_deceased_veteran_exemption_amount + @temp_market_val

				select @temp_market_val = 0
			end
			select @ptd_state_mandated_disabled_or_deceased_veteran_exemption_indicator = 'Y'
--		end

		FETCH NEXT FROM PTD_AJR_EXEMPT_VW into	@pae_state_amt,
									@pae_local_amt,
									@pae_entity_type_cd
	end

	CLOSE PTD_AJR_EXEMPT_VW
	DEALLOCATE PTD_AJR_EXEMPT_VW
*/

	--
	-- Now do the Abatements
	--


	set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements = 0
	set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993 = 0
	set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993 = 0
	

	select	@pae_state_amt = state_amt,
		@pae_local_amt = local_amt,
		@pae_entity_type_cd = entity_type_cd,
		@pae_effective_dt   = sp_date_approved

		from #PTD_AJR_EXEMPT_VW
		where prop_id = @prop_id
			and entity_id = @entity_id
			and owner_id = @owner_id
			and exmpt_type_cd = 'AB'

	if (@@ROWCOUNT = 1)
	begin
		set @temp_state_amt = @pae_state_amt * @state_cd_pct
		set @temp_local_amt = @pae_local_amt * @state_cd_pct

		if (@pae_entity_type_cd <> 'S')
		begin
			set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements = @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements + @temp_state_amt			

			set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements = @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements + @temp_local_amt
		end
		else
		begin

			if (@pae_effective_dt < '05/31/1993' and @pae_effective_dt is not null)
			begin
				set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993 = @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993 + @temp_state_amt
			end

			if (@pae_effective_dt >= '05/31/1993' or @pae_effective_dt is null)
			begin
				set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993 = @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993 + @temp_state_amt
			end

			if (@pae_effective_dt < '05/31/1993' and @pae_effective_dt is not null)
			begin
				set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993 = @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993 + @temp_local_amt
			end

			if (@pae_effective_dt >= '05/31/1993' or @pae_effective_dt is null)
			begin
				set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993 = @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993 + @temp_local_amt
			end
		end
	end

	if (@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements > 0 or @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993 > 0)
	begin
		set @ptd_abatements_indicator = 'Y'
	end

	if (@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993 > 0)
	begin
		set @ptd_abatement_granted_before_may311993_indicator = 'Y'
	end

	--
	-- Now do the Freeports
	--

	select @ptd_freeport_exemption_loss = 0
	
	select	@pae_state_amt = state_amt,
		@pae_local_amt = local_amt,
		@pae_entity_type_cd = entity_type_cd

	from #PTD_AJR_EXEMPT_VW
	where prop_id = @prop_id
		and entity_id = @entity_id
		and owner_id = @owner_id
		and exmpt_type_cd = 'FR'

	if (@@ROWCOUNT = 1)
	begin
		set @temp_state_amt = @pae_state_amt * @state_cd_pct
		set @ptd_freeport_exemption_loss = @ptd_freeport_exemption_loss + @temp_state_amt

		set @temp_local_amt = @pae_local_amt * @state_cd_pct
		set @ptd_freeport_exemption_loss = @ptd_freeport_exemption_loss + @temp_local_amt
	end

	if (@ptd_freeport_exemption_loss > 0)
	begin
		set @ptd_freeport_exemption_indicator = 'Y'
	end

		--
	-- Now do the Historical Exemption
	--

	select @ptd_local_optional_historical_exemption_amount = 0

	select	@pae_state_amt 	    = state_amt,
		@pae_local_amt 	    = local_amt,
		@pae_entity_type_cd = entity_type_cd

	from #PTD_AJR_EXEMPT_VW
	where prop_id = @prop_id
		and entity_id = @entity_id
		and owner_id = @owner_id
		and exmpt_type_cd = 'HT'

	if (@@ROWCOUNT = 1)
	begin
		set @temp_local_amt = @pae_local_amt * @state_cd_pct
		set @ptd_local_optional_historical_exemption_amount = @ptd_local_optional_historical_exemption_amount + @temp_local_amt
	end

	--
	-- Now do the Pollution Control exemption
	--
	set @ptd_pollution_control_exemption_loss = 0
	
	select	@pae_state_amt = state_amt,
		@pae_local_amt = local_amt,
		@pae_entity_type_cd = entity_type_cd

	from #PTD_AJR_EXEMPT_VW
	where prop_id = @prop_id
		and entity_id = @entity_id
		and owner_id = @owner_id
		and exmpt_type_cd = 'PC'

	if (@@ROWCOUNT = 1)
	begin
		set @temp_state_amt = @pae_state_amt * @state_cd_pct
		set @ptd_pollution_control_exemption_loss = @ptd_pollution_control_exemption_loss + @temp_state_amt

		set @temp_local_amt = @pae_local_amt * @state_cd_pct

		set @ptd_pollution_control_exemption_loss = @ptd_pollution_control_exemption_loss + @temp_local_amt
	end

	if (@ptd_pollution_control_exemption_loss > 0)
	begin
		set @ptd_pollution_control_exemption_indicator = 'Y'
	end
	--
	-- Now do the Solar exemption
	--
	set @ptd_solar_wind_powered_exemption_amount = 0

	select	@pae_state_amt = state_amt,
		@pae_local_amt = local_amt,
		@pae_entity_type_cd = entity_type_cd

		from #PTD_AJR_EXEMPT_VW
		where prop_id = @prop_id
			and entity_id = @entity_id
			and owner_id = @owner_id
			and exmpt_type_cd = 'SO'

	if (@@ROWCOUNT = 1)
	begin
		set @temp_state_amt = @pae_state_amt * @state_cd_pct
		set @ptd_solar_wind_powered_exemption_amount = @ptd_solar_wind_powered_exemption_amount + @temp_state_amt

		set @temp_local_amt = @pae_local_amt * @state_cd_pct
		set @ptd_solar_wind_powered_exemption_amount = @ptd_solar_wind_powered_exemption_amount + @temp_local_amt
	end


	--
	-- Now do the Total Exemption
	--

	set @ptd_total_exemption_amount = 0
	set @ptd_proration_loss_to_property = 0
	
	select	@pae_state_amt      = state_amt,
		@pae_local_amt      = local_amt,
		@pae_entity_type_cd = entity_type_cd,
		@pae_effective_dt   = effective_dt,
		@pae_termination_dt = termination_dt

		from #PTD_AJR_EXEMPT_VW
		where prop_id = @prop_id
			and entity_id = @entity_id
			and owner_id = @owner_id
			and exmpt_type_cd = 'EX'

	if (@@ROWCOUNT = 1)
	begin
		set @temp_state_amt = @pae_state_amt * @state_cd_pct

		/*select pae_effective_dt = @pae_effective_dt, pae_termination_dt = @pae_termination_dt, state_amt = @pae_state_amt, state_cd_pct = @state_cd_pct
		if (@pae_effective_dt is not null) and (year(@pae_effective_dt) = @input_yr)
		begin

			select @temp_state_amt = @pae_state_amt * @state_cd_pct
			select @ptd_proration_loss_to_property = @temp_state_amt
		end
		else
		begin
			if (@pae_termination_dt is not null) and (year(@pae_termination_dt) = @input_yr)
			begin
				select @temp_state_amt = @pae_state_amt * @state_cd_pct
				select @ptd_proration_loss_to_property = @temp_state_amt
			end
			else
			begin
			if (@pae_effective_dt is null and @pae_termination_dt is null)
				begin
					select @temp_state_amt = @pae_state_amt * @state_cd_pct
					select @ptd_total_exemption_amount = @ptd_total_exemption_amount + @temp_state_amt
				end
			end

		end*/

		if (@ptd_comptrollers_category_code = 'X')

		begin
			set @ptd_total_exemption_amount = @ptd_total_exemption_amount + @temp_state_amt
		end
		else
		begin
			set @ptd_proration_loss_to_property = @temp_state_amt	
		end
			

--select proration_loss = @ptd_proration_loss_to_property

	end

	if (@ptd_total_exemption_amount = 0 and (@prop_type_cd = 'P' or @prop_type_cd = 'MN' or @prop_type_cd = 'A'))
	begin
		set @ptd_total_exemption_amount = 0

		select	@pae_state_amt = state_amt,
			@pae_local_amt = local_amt,
			@pae_entity_type_cd = entity_type_cd

			from #PTD_AJR_EXEMPT_VW
			where prop_id = @prop_id
				and entity_id = @entity_id
				and owner_id = @owner_id
				and exmpt_type_cd = 'EX366'

		if (@@ROWCOUNT = 1)
		begin
			set @temp_state_amt = @pae_state_amt * @state_cd_pct
			set @ptd_total_exemption_amount = @ptd_total_exemption_amount + @temp_state_amt
			set @ptd_comptrollers_category_code = 'X'

		end
	end

	-- added by jcoco 10/08/2003 to support charitable exemptions. This was discovered @ bell cad
	if (@ptd_total_exemption_amount = 0)
	begin
		set @ptd_total_exemption_amount = 0

		select	@pae_state_amt = state_amt,
			@pae_local_amt = local_amt,
			@pae_entity_type_cd = entity_type_cd

			from #PTD_AJR_EXEMPT_VW
			where prop_id = @prop_id
				and entity_id = @entity_id
				and owner_id = @owner_id
				and exmpt_type_cd = 'CH'

		if (@@ROWCOUNT = 1)
		begin
			set @temp_state_amt = @pae_state_amt * @state_cd_pct
			set @ptd_total_exemption_amount = @ptd_total_exemption_amount + @temp_state_amt

			set @temp_local_amt = @pae_local_amt * @state_cd_pct
			set @ptd_total_exemption_amount = @ptd_total_exemption_amount + @temp_local_amt

			set @ptd_comptrollers_category_code = 'X'

		end
	end

	if (@ptd_total_exemption_amount > 0 or @ptd_comptrollers_category_code = 'X')
	begin

		set @ptd_category_market_value_land_before_any_cap = 0
		set @ptd_category_market_value_improvement_before_any_cap = 0
		set @ptd_personal_property_value = 0
		set @ptd_mineral_value = 0

		if @ptd_local_optional_disabled_homeowner_exemption_amount > 0 or
			@ptd_local_optional_historical_exemption_amount > 0 or
			@ptd_solar_wind_powered_exemption_amount > 0 or
			@ptd_state_mandated_disabled_deceased_veteran_exemption_amount > 0 or
			@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements > 0 or
			@ptd_freeport_exemption_loss > 0 or
			@ptd_pollution_control_exemption_loss > 0
		begin
			set @message = 'A totally exempt property cannot have other exemptions.'
			set @temp_value = @state_cd
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end

		if (@ptd_comptrollers_category_code = 'X')
		begin
			set @ptd_local_optional_percentage_homestead_exemption_amount = 0
			set @ptd_state_mandated_homestead_exemption_amount = 0
			set @ptd_state_mandated_over65_homeowner_exemption_amount = 0
			set @ptd_state_mandated_disabled_homeowner_exemption_amount = 0
			set @ptd_local_optional_over65_homeowner_exemption_amount = 0

			set @ptd_local_optional_disabled_homeowner_exemption_amount = 0
			set @ptd_local_optional_historical_exemption_amount = 0
			set @ptd_solar_wind_powered_exemption_amount = 0
			set @ptd_state_mandated_disabled_deceased_veteran_exemption_amount = 0
			set @ptd_other_exemption_loss_amount = 0
			set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements = 0
			set @ptd_productivity_value_loss = 0
			set @ptd_productivity_value = 0
			set @ptd_freeport_exemption_loss = 0
			set @ptd_pollution_control_exemption_loss = 0
			set @ptd_proration_loss_to_property = 0
			set @ptd_levy_lost_to_tax_deferral_of_over65_or_increasing_home_taxes = 0
			set @ptd_value_loss_to_the_hscap_on_residential_homesteads = 0
			set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993 = 0
			set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993 = 0

			set @ptd_state_mandated_homestead_exemption_indicator = 'N'
			set @ptd_state_mandated_over6555_surviving_spouse_exemption_indicator = 'N'
			set @ptd_state_mandated_disabled_homeowner_exemption_indicator = 'N'
			set @ptd_local_optional_percentage_homestead_indicator = 'N'
			set @ptd_local_optional_disabled_homeowner_exemption_indicator = 'N'

			set @ptd_state_mandated_disabled_or_deceased_veteran_exemption_indicator = 'N'
			set @ptd_abatements_indicator = 'N'
			set @ptd_pollution_control_exemption_indicator = 'N'
			set @ptd_freeport_exemption_indicator = 'N'
			set @ptd_abatement_granted_before_may311993_indicator = 'N'
		end

		if (@ptd_comptrollers_category_code <> 'X')
		begin
			set @message = 'State Code must be X for a property that has a total exemption'
			exec ptd_insert_error 'AJR', @prop_id, @ptd_comptrollers_category_code, @message
		end
		if (@ptd_category_market_value_land_before_any_cap > 0)
		begin
			set @message = 'Land market value must be 0 for a property that has a total exemption'
			select @temp_value = cast(@ptd_category_market_value_land_before_any_cap as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_category_market_value_improvement_before_any_cap > 0)
		begin
			set @message = 'Improvement market value must be 0 for a property that has a total exemption'
			select @temp_value = cast(@ptd_category_market_value_improvement_before_any_cap as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_personal_property_value > 0)
		begin
			set @message = 'Personal property value must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_personal_property_value as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_mineral_value > 0)
		begin
			set @message = 'Mineral value must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_mineral_value as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_local_optional_percentage_homestead_exemption_amount > 0)
		begin
			set @message = 'Local Optional Percentage Homestead must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_local_optional_percentage_homestead_exemption_amount as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_state_mandated_homestead_exemption_amount > 0)
		begin
			set @message = 'State Mandated Homestead Exemption must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_state_mandated_homestead_exemption_amount as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_state_mandated_over65_homeowner_exemption_amount > 0)
		begin
			set @message = 'State Mandated Over65 Homeowner Exemption must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_state_mandated_over65_homeowner_exemption_amount as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_state_mandated_disabled_homeowner_exemption_amount > 0)
		begin
			set @message = 'State Mandated Disabled Homeowner Exemption must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_state_mandated_disabled_homeowner_exemption_amount as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_local_optional_over65_homeowner_exemption_amount > 0)
		begin
			set @message = 'Local Optional Over65 Homeowner Exemption must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_local_optional_over65_homeowner_exemption_amount as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_local_optional_disabled_homeowner_exemption_amount > 0)
		begin
			set @message = 'Local Optional Disabled Homeowner Exemption must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_local_optional_disabled_homeowner_exemption_amount as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_local_optional_historical_exemption_amount > 0)
		begin
			set @message = 'Local Optional Historical Exemption must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_local_optional_historical_exemption_amount as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_solar_wind_powered_exemption_amount > 0)
		begin
			set @message = 'Local Optional Solar Exemption must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_solar_wind_powered_exemption_amount as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_state_mandated_disabled_deceased_veteran_exemption_amount > 0)
		begin
			set @message = 'State Mandated Disabled Veteran Exemption must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_state_mandated_disabled_deceased_veteran_exemption_amount as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end

		if (@ptd_other_exemption_loss_amount > 0)
		begin
			set @message = 'Other Exemption must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_other_exemption_loss_amount as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements > 0)
		begin
			set @message = 'Abatements must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_productivity_value_loss > 0)
		begin
			set @message = 'Productivity Loss must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_productivity_value_loss as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_freeport_exemption_loss > 0)
		begin
			set @message = 'Freeport Exemption must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_freeport_exemption_loss as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_pollution_control_exemption_loss > 0)
		begin
			set @message = 'Pollution Control Exemption must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_pollution_control_exemption_loss as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_proration_loss_to_property > 0)
		begin
			set @message = 'Proration Loss must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_proration_loss_to_property as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end

		if (@ptd_levy_lost_to_tax_deferral_of_over65_or_increasing_home_taxes > 0)
		begin
			set @message = 'Levy lost to tax deferral of over65 must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_levy_lost_to_tax_deferral_of_over65_or_increasing_home_taxes as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_value_loss_to_the_hscap_on_residential_homesteads > 0)
		begin	
			set @message = 'HS Cap Loss must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_value_loss_to_the_hscap_on_residential_homesteads as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993 > 0)
		begin
			set @message = 'Appraised Value lost to tax abatement agreements before May 31, 1993 must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993 as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
		if (@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993 > 0)
		begin
			set @message = 'Appraised Value lost to tax abatement agreements since May 31, 1993 must be 0 for a property that has a total exemption'
			set @temp_value = cast(@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993 as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
	end

	if (@ptd_category_market_value_land_before_any_cap > 0)
	begin
		if (@ptd_comptrollers_category_code <> 'A' and @ptd_comptrollers_category_code <> 'B' and @ptd_comptrollers_category_code <> 'C' and
		   @ptd_comptrollers_category_code <> 'D1' and @ptd_comptrollers_category_code <> 'D2' and @ptd_comptrollers_category_code <> 'E' and
		   @ptd_comptrollers_category_code <> 'F1' and @ptd_comptrollers_category_code <> 'F2' and left(@ptd_comptrollers_category_code, 1) <> 'J' and
		   @ptd_comptrollers_category_code <> 'N' and @ptd_comptrollers_category_code <> 'O')
		begin
			set @message = 'Property receiving Land Value must have a State Code of A,B,C,D1,D2,E,F1,F2,J1-J9,N, or O'
			exec ptd_insert_error 'AJR', @prop_id, @ptd_comptrollers_category_code, @message
		end
	end

	if (@ptd_comptrollers_category_code <> 'D1' and @ptd_productivity_value > 0)
	begin
		set @message = 'Productivity value for Ag land NOT categorized as D1'
		exec ptd_insert_error 'AJR', @prop_id, @ptd_comptrollers_category_code, @message
	end

	if (@ptd_comptrollers_category_code = 'D1' and (@ptd_productivity_value + @ptd_productivity_value_loss <> @ptd_category_market_value_land_before_any_cap))
	begin
		set @message = 'Productivity Value + Productivity Value Loss does not equal Market Value.  Possible NON-Ag land categorized as D1'
		exec ptd_insert_error 'AJR', @prop_id, @ptd_comptrollers_category_code, @message
	end

	if (@ptd_comptrollers_category_code = 'D1' and @ptd_productivity_value = 0)
	begin
		set @message = 'Zero productivity value for Ag land categorized as D1'
		exec ptd_insert_error 'AJR', @prop_id, '0', @message
	end

	if (@ptd_productivity_value > 0 and @ptd_comptrollers_category_code <> 'D1')
	begin
		set @message = 'Property receiving productivity value must have a State Code of D1'
		exec ptd_insert_error 'AJR', @prop_id, @ptd_comptrollers_category_code, @message
	end

	if (@ptd_productivity_value_loss > 0 and @ptd_comptrollers_category_code <> 'D1')
	begin
		set @message = 'Property receiving productivity loss must have a State Code of D1'
		exec ptd_insert_error 'AJR', @prop_id, @ptd_comptrollers_category_code, @message
	end

	if (@ptd_category_market_value_improvement_before_any_cap > 0)
	begin
		if (@ptd_comptrollers_category_code <> 'A' and @ptd_comptrollers_category_code <> 'B' and @ptd_comptrollers_category_code <> 'E' and

		   @ptd_comptrollers_category_code <> 'F1' and @ptd_comptrollers_category_code <> 'F2' and left(@ptd_comptrollers_category_code, 1) <> 'J' and
		   @ptd_comptrollers_category_code <> 'M1' and @ptd_comptrollers_category_code <> 'N' and @ptd_comptrollers_category_code <> 'O')
		begin
			set @message = 'Property receiving Improvement Value must have a State Code of A,B,C,D1,D2,E,F1,F2,J1-J9,M1,N, or O'
			exec ptd_insert_error 'AJR', @prop_id, @ptd_comptrollers_category_code, @message
		end
	end

	if (@ptd_personal_property_value > 0)
	begin
		if (@ptd_comptrollers_category_code <> 'H' and left(@ptd_comptrollers_category_code,1) <> 'J' and @ptd_comptrollers_category_code <> 'L1' and
		   @ptd_comptrollers_category_code <> 'L2' and @ptd_comptrollers_category_code <> 'M2' and @ptd_comptrollers_category_code <> 'N' and
		   @ptd_comptrollers_category_code <> 'S')
		begin
			set @message = 'Property receiving Personal Property Value must have a State Code of H,J1-J9,L1,L2,M2,N or S'
			exec ptd_insert_error 'AJR', @prop_id, @ptd_comptrollers_category_code, @message
		end
	end

	if (@ptd_mineral_value > 0)
	begin
		if (@ptd_comptrollers_category_code <> 'G1' and @ptd_comptrollers_category_code <> 'G2' and @ptd_comptrollers_category_code <> 'G3')
		begin
			set @message = 'Property receiving Mineral Value must have a State Code of G1,G2, or G3'
			exec ptd_insert_error 'AJR', @prop_id, @ptd_comptrollers_category_code, @message
		end
	end

	/*
	 * This is for Hale.  They have 1500 improvements with a $1 value which makes a small percentage and turns account_taxable = 0
	 */

	if (@ptd_comptrollers_category_code <> 'X' and @ptd_account_taxable_value = 0 and @ptd_category_market_value_improvement_before_any_cap = 1)
	begin
		set @ptd_account_taxable_value = 1
	end

	if ( @ptd_comptrollers_category_code <> 'X' )
	begin
		set @temp_number = @ptd_category_market_value_land_before_any_cap + @ptd_category_market_value_improvement_before_any_cap
		set @temp_number = @temp_number + @ptd_personal_property_value + @ptd_mineral_value

		set @temp_number = @temp_number - @ptd_local_optional_percentage_homestead_exemption_amount -
			@ptd_state_mandated_homestead_exemption_amount -
			@ptd_state_mandated_over65_homeowner_exemption_amount -
			@ptd_state_mandated_disabled_homeowner_exemption_amount -
			@ptd_local_optional_over65_homeowner_exemption_amount -
			@ptd_local_optional_disabled_homeowner_exemption_amount -
			@ptd_local_optional_historical_exemption_amount -
			@ptd_solar_wind_powered_exemption_amount -
			@ptd_state_mandated_disabled_deceased_veteran_exemption_amount -
			@ptd_other_exemption_loss_amount -
			@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements -
			@ptd_productivity_value_loss -
			@ptd_freeport_exemption_loss -
			@ptd_pollution_control_exemption_loss -
			@ptd_proration_loss_to_property -
--			@ptd_levy_lost_to_tax_deferral_of_over65_or_increasing_home_taxes -
			@ptd_value_loss_to_the_hscap_on_residential_homesteads -
			@ptd_water_conservation_initiatives_exemption_amount -
			@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993 -
			@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993 -
			@ptd_total_exemption_amount
		

		set @ptd_account_taxable_value = @temp_number

		if (@ptd_account_taxable_value < 0)
		begin
			set @ptd_account_taxable_value  = 0
		end

--		if (@ptd_account_taxable_value <> @temp_number)
--		begin
--			select @message = 'Account Taxable Value not equal to calculated value of Market minus Exemptions'
--			select @temp_value = cast(@temp_number as varchar(20))
--			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
--		end

		if (right(@ptd_taxing_unit_number, 2) = '01')
		begin
			set @ptd_account_taxable_value = 0
--			select @message = 'Account Taxable Value must be 0 for CAD entity'
--			select @temp_value = cast(@ptd_account_taxable_value as varchar(20))
--			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end

		set @temp_number = @ptd_category_market_value_land_before_any_cap + @ptd_category_market_value_improvement_before_any_cap
		set @temp_number = @temp_number + @ptd_personal_property_value + @ptd_mineral_value

		if (@ptd_account_taxable_value > @temp_number)
		begin
			set @message = 'Account Taxable Value must be less than market value'
			set @temp_value = cast(@ptd_account_taxable_value as varchar(20))
			exec ptd_insert_error 'AJR', @prop_id, @temp_value, @message
		end
	end


	/* build tiff fields... As of right now Bell County is the only tiff district we have */
	
	if (@tif_land_val + @tif_imprv_val > 0)
	begin
		set @ptd_tax_increment_financing_captured_appraised_value_loss = (isnull(@tif_land_val,0) * @state_cd_pct) + (isnull(@tif_imprv_val,0) * @state_cd_pct)
	
		if (@ptd_account_taxable_value > @ptd_tax_increment_financing_captured_appraised_value_loss)
		begin
			set @ptd_tax_increment_financing_captured_appraised_value_loss = @ptd_account_taxable_value - @ptd_tax_increment_financing_captured_appraised_value_loss
		end
		else
		begin
			set @ptd_tax_increment_financing_captured_appraised_value_loss = 0
		end

		if (@ptd_tax_increment_financing_captured_appraised_value_loss > 0)
		begin
			set @ptd_tax_increment_financing_indicator = 'Y'
			set @ptd_total_payments_into_tax_increment_financing_funds = (@ptd_tax_increment_financing_captured_appraised_value_loss/100) * @tax_rate

			/* according to the state we treat the captured appraised value loss as an exemption, so
                           subtract out from the taxable value */
			set @ptd_account_taxable_value = @ptd_account_taxable_value - @ptd_tax_increment_financing_captured_appraised_value_loss

			/* some of the value loss are so low that they generate a 0 payment, and this causes an 
			   error with the ptd. Therefore, we will plug a $1 into this number, so that an error 
			   is not generated */
			if (@ptd_total_payments_into_tax_increment_financing_funds = 0)
			begin
				set @ptd_total_payments_into_tax_increment_financing_funds = 1
			end
		end
		else
		begin
			set @ptd_tax_increment_financing_indicator = 'N'
			set @ptd_total_payments_into_tax_increment_financing_funds = 0
		end
	end
	else
	begin
		set @ptd_tax_increment_financing_captured_appraised_value_loss = 0
		set @ptd_tax_increment_financing_indicator = 'N'
		set @ptd_total_payments_into_tax_increment_financing_funds = 0
	end
	
		

	/* end tiff stuff */

	set @prev_entity_id = @entity_id
	set @prev_account_number = @ptd_account_number

	set @ptd_state_mandated_over65_homeowner_exemption_amount = isnull(@ptd_state_mandated_over65_homeowner_exemption_amount, 0)
	set @ptd_local_optional_over65_homeowner_exemption_amount = isnull(@ptd_local_optional_over65_homeowner_exemption_amount,0)
	set @ptd_state_mandated_disabled_homeowner_exemption_amount = isnull(@ptd_state_mandated_disabled_homeowner_exemption_amount,0)
	set @ptd_local_optional_disabled_homeowner_exemption_amount = isnull(@ptd_local_optional_disabled_homeowner_exemption_amount,0)
	set @ptd_state_mandated_homestead_exemption_amount = isnull(@ptd_state_mandated_homestead_exemption_amount,0)
	set @ptd_state_mandated_homestead_exemption_indicator = isnull(@ptd_state_mandated_homestead_exemption_indicator,'N')
	set @ptd_state_mandated_over6555_surviving_spouse_exemption_indicator = isnull(@ptd_state_mandated_over6555_surviving_spouse_exemption_indicator,'N')
	set @ptd_local_optional_over6555_surviving_spouse_exemption_indicator = isnull(@ptd_local_optional_over6555_surviving_spouse_exemption_indicator,'N')
	set @ptd_state_mandated_disabled_homeowner_exemption_indicator = isnull(@ptd_state_mandated_disabled_homeowner_exemption_indicator,'N')
	set @ptd_local_optional_disabled_homeowner_exemption_indicator = isnull(@ptd_local_optional_disabled_homeowner_exemption_indicator,'N')
	set @ptd_state_mandated_disabled_or_deceased_veteran_exemption_indicator = isnull(@ptd_state_mandated_disabled_or_deceased_veteran_exemption_indicator,'N')
	set @ptd_abatements_indicator = isnull(@ptd_abatements_indicator,'N')
	set @ptd_freeport_exemption_indicator = isnull(@ptd_freeport_exemption_indicator,'N')
	set @ptd_pollution_control_exemption_indicator = isnull(@ptd_pollution_control_exemption_indicator,'N')
	set @ptd_personal_property_value = isnull(@ptd_personal_property_value, 0)
	set @ptd_capped_value_of_residential_homesteads = isnull(@ptd_capped_value_of_residential_homesteads,0)
	set @ptd_value_loss_to_the_hscap_on_residential_homesteads = isnull(@ptd_value_loss_to_the_hscap_on_residential_homesteads,0)
	set @ptd_mineral_value = isnull(@ptd_mineral_value,0)
	set @ptd_value_loss_to_the_hscap_on_residential_homesteads = isnull(@ptd_value_loss_to_the_hscap_on_residential_homesteads,0)
	set @ptd_hscap_on_residential_homesteads_indicator = isnull(@ptd_hscap_on_residential_homesteads_indicator,'N')
	set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993 = isnull(@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993,0)
	set @ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993 = isnull(@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993,0)
	set @ptd_abatement_granted_before_may311993_indicator = isnull(@ptd_abatement_granted_before_may311993_indicator,'N')
	set @ptd_hscap_on_residential_homesteads_indicator = isnull(@ptd_hscap_on_residential_homesteads_indicator,'N')
	set @ptd_tax_increment_financing_indicator = isnull(@ptd_tax_increment_financing_indicator,'N')
	set @ptd_multiple_owner_indicator = isnull(@ptd_multiple_owner_indicator,'N')
	set @ptd_tax_ceiling_indicator = isnull(@ptd_tax_ceiling_indicator,'3')
	set @ptd_local_optional_homestead_exemption_percentage = isnull(@ptd_local_optional_homestead_exemption_percentage,0)
	set @ptd_local_optional_percentage_homestead_indicator = isnull(@ptd_local_optional_percentage_homestead_indicator,'N')
	set @ptd_total_exemption_amount = isnull(@ptd_total_exemption_amount, 0)
	set @ptd_account_taxable_value = isnull(@ptd_account_taxable_value, 0)


	insert into ptd_ajr
	(
		record_type,
		cad_id_code,
		account_number,
		taxing_unit_id_code,
		county_fund_type_ind,
		local_optional_percentage_homestead_exemption_amount,
		state_mandated_homestead_exemption_amount,
		state_mandated_over65_homeowner_exemption_amount,
		state_mandated_disabled_homeowner_exemption_amount,
		local_optional_over65_homeowner_exemption_amount,
		local_optional_disabled_homeowner_exemption_amount,
		total_exemption_amount,
		local_optional_historical_exemption_amount,
		solar_wind_powered_exemption_amount,
		state_mandated_disabled_deceased_veteran_exemption_amount,
		other_exemption_loss_amount,
		total_appraised_value_lost_due_to_tax_abatement_agreements,
		total_payments_into_tax_increment_financing_funds,
		comptrollers_category_code,
		category_market_value_land_before_any_cap,
		total_acres_for_category,
		productivity_value,
		productivity_value_loss,
		category_market_value_improvement_before_any_cap,
		account_taxable_value,
		tax_ceiling,
		freeport_exemption_loss,
		pollution_control_exemption_loss,
		personal_property_value,	
		proration_loss_to_property,
		levy_lost_to_tax_deferral_of_over65_or_increasing_home_taxes,
		capped_value_of_residential_homesteads,
		value_loss_to_the_hscap_on_residential_homesteads,
		water_conservation_initiatives_exemption_amount,
		local_optional_homestead_exemption_percentage,
		total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993,
		total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993,
		tax_increment_financing_captured_appraised_value_loss,
		mineral_value,
		last_reappraisal_year,
		state_mandated_homestead_exemption_indicator,
		state_mandated_over6555_surviving_spouse_exemption_indicator,
		state_mandated_disabled_homeowner_exemption_indicator,
		local_optional_percentage_homestead_exemption_indicator,
		local_optional_over6555_surviving_spouse_exemption_indicator,
		local_optional_disabled_homeowner_exemption_indicator,
		state_mandated_disabled_or_deceased_veteran_exemption_indicator,
		abatements_indicator,
		tax_increment_financing_indicator,
		certified_value_indicator,
		pollution_control_exemption_indicator,
		freeport_exemption_indicator,
		tax_ceiling_indicator,
		hscap_on_residential_homesteads_indicator,
		water_conservation_initiatives_indicator,
		multiple_owner_indicator,
		payments_into_tax_increment_financing_funds_eligible_for_deduction,
		land_units,
		abatement_granted_before_may311993_indicator
	)
	values
	(
		@ptd_record_type,
		@ptd_cad_id_code,
		@ptd_account_number,
		@ptd_taxing_unit_number,
		@ptd_county_fund_type_ind,
		@ptd_local_optional_percentage_homestead_exemption_amount,
		@ptd_state_mandated_homestead_exemption_amount,
		@ptd_state_mandated_over65_homeowner_exemption_amount,
		@ptd_state_mandated_disabled_homeowner_exemption_amount,
		@ptd_local_optional_over65_homeowner_exemption_amount,
		@ptd_local_optional_disabled_homeowner_exemption_amount,
		@ptd_total_exemption_amount,
		@ptd_local_optional_historical_exemption_amount,
		@ptd_solar_wind_powered_exemption_amount,
		@ptd_state_mandated_disabled_deceased_veteran_exemption_amount,
		@ptd_other_exemption_loss_amount,
		@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements,
		@ptd_total_payments_into_tax_increment_financing_funds,
		@ptd_comptrollers_category_code,
		@ptd_category_market_value_land_before_any_cap,
		@ptd_total_acres_for_category,
		@ptd_productivity_value,
		@ptd_productivity_value_loss,
		@ptd_category_market_value_improvement_before_any_cap,
		@ptd_account_taxable_value,
		@ptd_tax_ceiling,
		@ptd_freeport_exemption_loss,
		@ptd_pollution_control_exemption_loss,
		@ptd_personal_property_value,
		@ptd_proration_loss_to_property,
		@ptd_levy_lost_to_tax_deferral_of_over65_or_increasing_home_taxes,
		@ptd_capped_value_of_residential_homesteads,
		@ptd_value_loss_to_the_hscap_on_residential_homesteads,
		@ptd_water_conservation_initiatives_exemption_amount,
		@ptd_local_optional_homestead_exemption_percentage,
		@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_before_may311993,
		@ptd_total_appraised_value_lost_due_to_tax_abatement_agreements_granted_since_may311993,
		@ptd_tax_increment_financing_captured_appraised_value_loss,
		@ptd_mineral_value,
		@ptd_last_reappraisal_year,
		@ptd_state_mandated_homestead_exemption_indicator,
		@ptd_state_mandated_over6555_surviving_spouse_exemption_indicator,
		@ptd_state_mandated_disabled_homeowner_exemption_indicator,
		@ptd_local_optional_percentage_homestead_indicator,
		@ptd_local_optional_over6555_surviving_spouse_exemption_indicator,
		@ptd_local_optional_disabled_homeowner_exemption_indicator,
		@ptd_state_mandated_disabled_or_deceased_veteran_exemption_indicator,
		@ptd_abatements_indicator,
		@ptd_tax_increment_financing_indicator,
		@ptd_certified_value_indicator,
		@ptd_pollution_control_exemption_indicator,
		@ptd_freeport_exemption_indicator,
		@ptd_tax_ceiling_indicator,
		@ptd_hscap_on_residential_homesteads_indicator,
		@ptd_water_conservation_initiatives_indicator,
		@ptd_multiple_owner_indicator,
		@ptd_payments_into_tax_increment_financing_funds_eligible_for_deduction,
		@ptd_land_units,
		@ptd_abatement_granted_before_may311993_indicator
	)

	FETCH NEXT FROM PTD_AJR_VW into	@prop_id,
						@owner_id,
						@sup_num,
						@year,
						@entity_id,
						@state_cd,
						@acres,
						@front_foot,
						@ag_acres,
						@ag_use_val,
						@ag_market,
						@market,
						@imprv_hstd_val,
						@imprv_non_hstd_val,
						@land_hstd_val,
						@land_non_hstd_val,
						@timber_use,
						@timber_market,
						@appraised_val,
						@ten_percent_cap,
						@assessed_val,
						@taxable_val,
						@homestead_val,
						@pct_ownership,	
						@entity_pct,
						@state_cd_pct,
						@taxing_unit_num,
						@county_taxing_unit_ind,
						@prop_type_cd,
						@ag_loss,
						@tif_land_val,
						@tif_imprv_val,
						@last_appraisal_yr,
						@hs_pct,
						@tax_rate
END

CLOSE PTD_AJR_VW
DEALLOCATE PTD_AJR_VW

if object_id('tempdb..#ptd_ajr_exempt_vw') is not null
begin
	drop table #ptd_ajr_exempt_vw
end

if object_id('tempdb..#tmp__arb_protest') is not null
begin
	drop table #tmp__arb_protest
end

if object_id('tempdb..#tmp_arb_protest') is not null
begin
	drop table #tmp_arb_protest
end

if object_id('tempdb..#tmp_multi_owner') is not null
begin
	drop table #tmp_multi_owner
end

GO

