







CREATE PROCEDURE ptd_amr_proc
 @input_yr              numeric(4),
 @input_cad_id_code     numeric(3)
AS

--PTD Variables
declare @ptd_record_type                                                                char(3)
declare @ptd_cad_id_code                                                                char(3)
declare @ptd_account_number                                                             char(25)
declare @ptd_last_reappraisal                                                           char(4)
declare @ptd_percent_ownership                                                          char(7)
declare @ptd_utility_company_or_mineral_type                                            char(2)
declare @ptd_total_exemption_indicator                                                  char(1)
declare @ptd_homestead_exemption_indicator                                              char(1)
declare @ptd_over65_over55_surviving_spouse_exemption_indicator                         char(1)
declare @ptd_tax_ceiling_indicator                                                      char(1)
declare @ptd_disabled_person_exemption_indicator                                        char(1)
declare @ptd_disabled_or_deceased_veterans_exemption_indicator                          char(1)
declare @ptd_historic_exemption_indicator                                               char(1)
declare @ptd_solar_wind_powered_exemption_indicator                                     char(1)
declare @ptd_abatements_indicator                                                       char(1)
declare @ptd_tax_increment_financing_indicator                                          char(1)
declare @ptd_tif_zone_name                                                              char(50)
declare @ptd_total_market_value                                                         char(11)
declare @ptd_land_units                                                                 char(1)
declare @ptd_land_size                                                                  char(11)
declare @ptd_complex_property_indicator                                                 char(1)
declare @ptd_blank                                                                      char(1)
declare @ptd_certified_value_indicator                                                  char(1)
declare @ptd_field_not_used                                                             char(1)
declare @ptd_same_taxing_unit_data_indicator                                            char(1)
declare @ptd_taxing_unit_1_id_code                                                      char(8)
declare @ptd_taxing_unit_2_id_code                                                      char(8)
declare @ptd_taxing_unit_3_id_code                                                      char(8)
declare @ptd_taxing_unit_4_id_code                                                      char(8)
declare @ptd_taxing_unit_5_id_code                                                      char(8)
declare @ptd_taxing_unit_6_id_code                                                      char(8)
declare @ptd_taxing_unit_7_id_code                                                      char(8)
declare @ptd_taxing_unit_8_id_code                                                      char(8)
declare @ptd_taxing_unit_9_id_code                                                      char(8)
declare @ptd_taxing_unit_10_id_code                                                     char(8)
declare @ptd_taxing_unit_11_id_code                                                     char(8)
declare @ptd_taxing_unit_12_id_code                                                     char(8)
declare @ptd_taxing_unit_13_id_code                                                     char(8)
declare @ptd_taxing_unit_14_id_code                                                     char(8)
declare @ptd_taxing_unit_15_id_code                                                     char(8)
declare @ptd_taxing_unit_1_multicounty_taxing_unit_indicator_or_county_fund_type        char(1)
declare @ptd_taxing_unit_2_multicounty_taxing_unit_indicator_or_county_fund_type        char(1)
declare @ptd_taxing_unit_3_multicounty_taxing_unit_indicator_or_county_fund_type        char(1)
declare @ptd_taxing_unit_4_multicounty_taxing_unit_indicator_or_county_fund_type        char(1)
declare @ptd_taxing_unit_5_multicounty_taxing_unit_indicator_or_county_fund_type        char(1)
declare @ptd_taxing_unit_6_multicounty_taxing_unit_indicator_or_county_fund_type        char(1)
declare @ptd_taxing_unit_7_multicounty_taxing_unit_indicator_or_county_fund_type        char(1)
declare @ptd_taxing_unit_8_multicounty_taxing_unit_indicator_or_county_fund_type        char(1)
declare @ptd_taxing_unit_9_multicounty_taxing_unit_indicator_or_county_fund_type        char(1)
declare @ptd_taxing_unit_10_multicounty_taxing_unit_indicator_or_county_fund_type       char(1)
declare @ptd_taxing_unit_11_multicounty_taxing_unit_indicator_or_county_fund_type       char(1)
declare @ptd_taxing_unit_12_multicounty_taxing_unit_indicator_or_county_fund_type       char(1)
declare @ptd_taxing_unit_13_multicounty_taxing_unit_indicator_or_county_fund_type       char(1)
declare @ptd_taxing_unit_14_multicounty_taxing_unit_indicator_or_county_fund_type       char(1)
declare @ptd_taxing_unit_15_multicounty_taxing_unit_indicator_or_county_fund_type       char(1)
declare @ptd_pollution_control_exemption_indicator                                      char(1)
declare @ptd_low_income_housing_indicator                                               char(1)
declare @ptd_abatement_granted_before_may311999                                         char(1)
declare @ptd_freeport_exemption_indicator                                               char(1)
declare @ptd_mineral_interest_property_valued_at_less_than_500_indicator                char(1)
declare @ptd_income_producing_personal_property_valued_at_less_than_500_indicator       char(1)
declare @ptd_proration_exemption_indicator                                              char(1)
declare @ptd_tax_deferral_of_over65_or_increasing_home_taxes_indicator                  char(1)
declare @ptd_hscap_on_residential_homesteads_indicator                                  char(1)
declare @ptd_water_conservation_initiatives_indicator                                   char(1)
declare @ptd_property_in_more_than_one_cad_indicator                                    char(1)
declare @ptd_property_receiving_productivity_value_in_categories_other_than_category_d_indicator        char(1)
declare @tmp_land_size                                                                  numeric(18,4)

--Database Variables
declare @prop_id                        int
declare @last_appraisal_yr              numeric(4)
declare @state_cd                       char(2)
declare @owner_tax_yr                   numeric(4)
declare @appraised_val                  numeric(14)
declare @prop_type_cd                   char(5)
declare @ten_percent_cap                numeric(14)
declare @taxing_unit_num                char(8)
declare @ptd_multi_unit                 char(1)
declare @size_acres                     numeric(18,4)
declare @size_square_feet               numeric(18,2)
declare @effective_front                numeric(18,2)
declare @ag_apply                       char(1)
declare @ls_ag_method                   char(5)
declare @ls_mkt_method                  char(5)


--Stored Procedure Variables
declare @end_proc                       char(1)

--Initialize Variables
select @ptd_record_type         = 'AMR'
select @ptd_percent_ownership   = '1000000'

--Begin
--First, delete everything in the ptd_amr table
delete from ptd_amr

--Now loop through the ptd_amr_vw and populate the ptd_amr table
DECLARE PTD_AMR SCROLL CURSOR
FOR select      prop_id,
                last_appraisal_yr,
                state_cd,

                owner_tax_yr,
                appraised_val,
                prop_type_cd,
                ten_percent_cap

        from    ptd_amr_vw
        where   owner_tax_yr = @input_yr

OPEN PTD_AMR

FETCH NEXT FROM PTD_AMR into    @prop_id,
                                @last_appraisal_yr,
                                @state_cd,
                                @owner_tax_yr,
                                @appraised_val,
                                @prop_type_cd,
                                @ten_percent_cap
                                

while (@@FETCH_STATUS = 0)
begin
        select @ptd_cad_id_code = CONVERT(char(3), @input_cad_id_code)
        select @ptd_account_number = CONVERT(char(25), @prop_id)

        if (@last_appraisal_yr is not null)
        begin
                select @ptd_last_reappraisal = CONVERT(char(4), @last_appraisal_yr)
        end
        else
        begin
                select @ptd_last_reappraisal = '0000'
        end

        

        if (@state_cd is not null)
        begin
                select @ptd_utility_company_or_mineral_type = @state_cd
        end
        else
        begin
                select @ptd_utility_company_or_mineral_type = '  '
        end

        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'EX'
                        and     prop_exemption_vw.exmpt_type_cd is not null)
        begin
                select @ptd_total_exemption_indicator = 'Y'
        end
        else
        begin
                select @ptd_total_exemption_indicator = 'N'

        end
                
        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'HS'
                        and     prop_exemption_vw.exmpt_type_cd is not null)
        begin
                select @ptd_homestead_exemption_indicator = 'Y'
        end
        else
        begin
                select @ptd_homestead_exemption_indicator = 'N'

        end     

        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     ((prop_exemption_vw.exmpt_type_cd       = 'OV65')
                        or      (prop_exemption_vw.exmpt_type_cd        = 'OV65S'))
                        and     prop_exemption_vw.exmpt_type_cd is not null)
        begin
                select @ptd_over65_over55_surviving_spouse_exemption_indicator = 'Y'
        end
        else
        begin
                select @ptd_over65_over55_surviving_spouse_exemption_indicator = 'N'

        end     

/*
        if exists (select *
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'OV65'
                        and     prop_exemption_vw.use_freeze    = 'T'
                        and     prop_exemption_vw.exmpt_type_cd is not null)
        begin
                select @ptd_tax_ceiling_indicator = '1'
        end
        else if exists (select *
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'OV65S'
                        and     prop_exemption_vw.use_freeze    = 'T'
                        and     prop_exemption_vw.exmpt_type_cd is not null)
        begin
                select @ptd_tax_ceiling_indicator = '2'
        end
        else
        begin
                select @ptd_tax_ceiling_indicator = '3'
        end

*/
	--Note:	This change was made due to migration of freeze / transfer info
	--	from the property_exemption table to the property_freeze table.
	--	
	--	Entities other than schools may now have a freeze (tax ceiling), but
	--	we don't have the specifications yet as to how to handle that in
	--	this procedure, so we're adapting the procedure to return the same
	--	results until then.
	if exists
	(
		select
			*
		from
			property_freeze_vw with (nolock)
		where
			rtrim(isnull(entity_type_cd, '')) = 'S'
		and	owner_tax_yr = @input_yr
		and	prop_id = @prop_id
		and	exmpt_type_cd = 'OV65'
		and	use_freeze = 'T'
	)
	begin
		select @ptd_tax_ceiling_indicator = '1'
	end
	else if exists
	(
		select
			*
		from
			property_freeze_vw with (nolock)
		where
			rtrim(isnull(entity_type_cd, '')) = 'S'
		and	owner_tax_yr = @input_yr
		and	prop_id = @prop_id
		and	exmpt_type_cd = 'OV65S'
		and	use_freeze = 'T'
	)
	begin
		select @ptd_tax_ceiling_indicator = '2'
	end
	else
	begin
		select @ptd_tax_ceiling_indicator = '3'
	end

        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'DP'
                        and     prop_exemption_vw.exmpt_type_cd is not null)
        begin
                select @ptd_disabled_person_exemption_indicator = 'Y'
        end
        else
        begin
                select @ptd_disabled_person_exemption_indicator = 'N'

        end             

        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     ((prop_exemption_vw.exmpt_type_cd       = 'DV1')
                        or      (prop_exemption_vw.exmpt_type_cd        = 'DV1S')
                        or      (prop_exemption_vw.exmpt_type_cd        = 'DV2')
                        or      (prop_exemption_vw.exmpt_type_cd        = 'DV2S')
                        or      (prop_exemption_vw.exmpt_type_cd        = 'DV3')
                        or      (prop_exemption_vw.exmpt_type_cd        = 'DV3S')
                        or      (prop_exemption_vw.exmpt_type_cd        = 'DV4')
                        or      (prop_exemption_vw.exmpt_type_cd        = 'DV4S'))
                        and     prop_exemption_vw.exmpt_type_cd is not null)
        begin
                select @ptd_disabled_or_deceased_veterans_exemption_indicator = 'Y'
        end
        else
        begin
                select @ptd_disabled_or_deceased_veterans_exemption_indicator = 'N'

        end

        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'HT'
                        and     prop_exemption_vw.exmpt_type_cd is not null)
        begin
                select @ptd_historic_exemption_indicator = 'Y'
        end
        else
        begin
                select @ptd_historic_exemption_indicator = 'N'

        end

        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'SO'
                        and     prop_exemption_vw.exmpt_type_cd is not null)
        begin
                select @ptd_solar_wind_powered_exemption_indicator = 'Y'
        end
        else
        begin
                select @ptd_solar_wind_powered_exemption_indicator = 'N'

        end

        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'AB'
                        and     prop_exemption_vw.exmpt_type_cd is not null)
        begin
                select @ptd_abatements_indicator = 'Y'
        end
        else
        begin
                select @ptd_abatements_indicator = 'N'

        end

        select @ptd_tax_increment_financing_indicator = 'N'
        select @ptd_tif_zone_name = SPACE(50)

        if not exists(select        * 
                        from    ptd_amr_land_size_vw
                        where   owner_tax_yr    = @input_yr
                        and     prop_id         = @prop_id)
        begin
		select @ptd_land_size = '00000000000'
                select @ptd_land_units = '4'
                select @tmp_land_size = CAST(0 as numeric(18,4))
        end
        else
        begin
                DECLARE PTD_AMR_LAND_SIZE_VW SCROLL CURSOR
                FOR select      size_acres,
                                size_square_feet,
                                effective_front,
                                ag_apply,
                                ls_ag_method,
                                ls_mkt_method
                        from    ptd_amr_land_size_vw
                        where   owner_tax_yr    = @input_yr
                        and     prop_id         = @prop_id

                OPEN PTD_AMR_LAND_SIZE_VW
        
                FETCH NEXT FROM PTD_AMR_LAND_SIZE_VW into       @size_acres,
                                                                @size_square_feet,
                                                                @effective_front,
                                                                @ag_apply,      
                                                                @ls_ag_method,
                                                                @ls_mkt_method
        
                select @ptd_land_size = '00000000000'
                select @tmp_land_size = CAST(0 as numeric(18,4))
                select @ptd_land_units = 0
                select @end_proc = 'F'

                while (@@FETCH_STATUS = 0)
                begin
			--select another_row = 'Another row from ptd_amr_land_size_vw'
			--select end_proc_before = @end_proc
			--select ag_apply = @ag_apply

                        if ((@ag_apply = 'T') and (@ag_apply is not null) and (@end_proc = 'F'))
                        begin
                                if ((@ls_ag_method = 'A') and (@ls_ag_method is not null))
                                begin
                                        select @tmp_land_size = @tmp_land_size + CAST(@size_acres as numeric(18,4))

                                        if (@ptd_land_units = 0)
                                        begin
                                                select @ptd_land_units = '1'
                                                select @end_proc = 'F'
                                        end
                                        else if (@ptd_land_units = 1)
                                        begin
                                                select @ptd_land_units = '1'
                                                select @end_proc = 'F'
                                        end
                                        else
                                        begin
                                                select @tmp_land_size = CAST(0 as numeric(18,4))
                                                select @ptd_land_units = '4'
                                                select @end_proc = 'T'
                                        end
                                end
                                else if ((@ls_ag_method = 'SQ') and (@ls_ag_method is not null))
                                begin
                                        select @tmp_land_size = @tmp_land_size + CAST(@size_square_feet as numeric(18,4))

                                        if (@ptd_land_units = 0)
                                        begin
                                                select @ptd_land_units = '2'
                                                select @end_proc = 'F'
                                        end
                                        else if (@ptd_land_units = 2)
                                        begin
                                                select @ptd_land_units = '2'
                                                select @end_proc = 'F'
                                        end
                                        else
                                        begin
                                                select @tmp_land_size = CAST(0 as numeric(18,4))
                                                select @ptd_land_units = '4'
                                                select @end_proc = 'T'
                                        end
                                end
                                else if ((@ls_ag_method = 'FF') and (@ls_ag_method is not null))
                                begin
                                        select @tmp_land_size = @tmp_land_size + CAST(@effective_front as numeric(18,4))

                                        if (@ptd_land_units = 0)
                                        begin
                                                select @ptd_land_units = '3'
                                                select @end_proc = 'F'
                                        end
                                        else if (@ptd_land_units = 3)
                                        begin
                                                select @ptd_land_units = '3'
                                                select @end_proc = 'F'
                                        end
                                        else
                                        begin
                                                select @tmp_land_size = CAST(0 as numeric(18,4))
                                                select @ptd_land_units = '4'
                                                select @end_proc = 'T'
                                        end
                                end
                                else if ((@ls_ag_method = 'LOT') and (@ls_ag_method is not null))
                                begin
                                        select @tmp_land_size = CAST(0 as numeric(18,4))
                                        select @ptd_land_units = '4'
                                        select @end_proc = 'T'
                                end
                        end
                        else if ((@ag_apply = 'F') and (@ag_apply is not null) and (@end_proc = 'F'))
                        begin
                                if ((@ls_mkt_method = 'A') and (@ls_mkt_method is not null))
                                begin
                                        select @tmp_land_size = @tmp_land_size + CAST(@size_acres as numeric(18,4))

                                        if (@ptd_land_units = 0)
                                        begin
                                                select @ptd_land_units = '1'
                                                select @end_proc = 'F'
                                        end
                                        else if (@ptd_land_units = 1)
                                        begin
                                                select @ptd_land_units = '1'
                                                select @end_proc = 'F'
                                        end
                                        else
                                        begin
                                                select @tmp_land_size = CAST(0 as numeric(18,4))
                                                select @ptd_land_units = '4'
                                                select @end_proc = 'T'
                                        end

                                end
                                else if ((@ls_mkt_method = 'SQ') and (@ls_mkt_method is not null))
                                begin
                                        select @tmp_land_size = @tmp_land_size + CAST(@size_square_feet as numeric(18,4))

                                        if (@ptd_land_units = 0)
                                        begin
                                                select @ptd_land_units = '2'
                                                select @end_proc = 'F'
                                        end
                                        else if (@ptd_land_units = 2)
                                        begin
                                                select @ptd_land_units = '2'
                                                select @end_proc = 'F'
                                        end
                                        else
                                        begin
                                                select @tmp_land_size = CAST(0 as numeric(18,4))
                                                select @ptd_land_units = '4'
                                                select @end_proc = 'T'
                                        end
                                end
                                else if ((@ls_mkt_method = 'FF') and (@ls_mkt_method is not null))
                                begin
                                        select @tmp_land_size = @tmp_land_size + CAST(@effective_front as numeric(18,4))

                                        if (@ptd_land_units = 0)
                                        begin
                                                select @ptd_land_units = '3'
                                                select @end_proc = 'F'
                                        end
                                        else if (@ptd_land_units = 3)
                                        begin
                                                select @ptd_land_units = '3'
                                                select @end_proc = 'F'
                                        end
                                        else
                                        begin
                                                select @tmp_land_size = CAST(0 as numeric(18,4))
                                                select @ptd_land_units = '4'
                                                select @end_proc = 'T'
                                        end
                                end
                                else if ((@ls_mkt_method = 'LOT') and (@ls_mkt_method is not null))
                                begin
                                        select @tmp_land_size = CAST(0 as numeric(18,4))
                                        select @ptd_land_units = '4'
                                        select @end_proc = 'T'
                                end
                        end

			--select end_proc_after = @end_proc
			
                        FETCH NEXT FROM PTD_AMR_LAND_SIZE_VW into       @size_acres,
                                                                        @size_square_feet,
                                                                        @effective_front,
                                                                        @ag_apply,      
                                                                        @ls_ag_method,
                                                                        @ls_mkt_method
        
                end

                CLOSE PTD_AMR_LAND_SIZE_VW
                DEALLOCATE PTD_AMR_LAND_SIZE_VW
        end

        if exists (select       * 
                        from    ptd_amr_complex_property_vw
                        where   prop_id         = @prop_id
                        and     owner_tax_yr    = @input_yr)
        begin
                select @ptd_complex_property_indicator = 'Y'
        end
        else
        begin
                select @ptd_complex_property_indicator = 'N'
        end

        select @ptd_blank = ' '
        select @ptd_certified_value_indicator = 'Y'
        select @ptd_field_not_used = ' '
        select @ptd_same_taxing_unit_data_indicator = 'N'


        DECLARE PTD_AMR_TU SCROLL CURSOR
        FOR select      taxing_unit_num,
                        ptd_multi_unit
                from    ptd_amr_taxing_unit_vw
                where   owner_tax_yr    = @input_yr
                and     prop_id         = @prop_id

        OPEN PTD_AMR_TU

        FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit

        if (@@FETCH_STATUS = 0)
        begin
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_1_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_1_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_1_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_1_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_1_id_code = '00000000'
                select @ptd_taxing_unit_1_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)              
        end

        if (@@FETCH_STATUS = 0)
        begin           
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_2_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_2_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_2_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_2_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_2_id_code = '00000000'
                select @ptd_taxing_unit_2_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)              
        end

        if (@@FETCH_STATUS = 0)
        begin           
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_3_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_3_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_3_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_3_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_3_id_code = '00000000'
                select @ptd_taxing_unit_3_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)              
        end

        if (@@FETCH_STATUS = 0)
        begin           
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_4_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_4_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_4_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_4_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_4_id_code = '00000000'
                select @ptd_taxing_unit_4_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)              
        end

        if (@@FETCH_STATUS = 0)
        begin           
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_5_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_5_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_5_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_5_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_5_id_code = '00000000'
                select @ptd_taxing_unit_5_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)              
        end

        if (@@FETCH_STATUS = 0)
        begin           
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_6_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_6_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_6_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_6_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_6_id_code = '00000000'
                select @ptd_taxing_unit_6_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)              
        end

        if (@@FETCH_STATUS = 0)
        begin           
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_7_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_7_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_7_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_7_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_7_id_code = '00000000'
                select @ptd_taxing_unit_7_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)              
        end

        if (@@FETCH_STATUS = 0)
        begin           
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_8_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_8_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_8_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_8_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_8_id_code = '00000000'
                select @ptd_taxing_unit_8_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)              
        end

        if (@@FETCH_STATUS = 0)
        begin           
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_9_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_9_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_9_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_9_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_9_id_code = '00000000'
                select @ptd_taxing_unit_9_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)              
        end

        if (@@FETCH_STATUS = 0)
        begin           
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_10_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_10_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_10_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_10_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_10_id_code = '00000000'
                select @ptd_taxing_unit_10_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)             
        end

        if (@@FETCH_STATUS = 0)
        begin           

                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_11_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_11_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_11_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_11_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_11_id_code = '00000000'
                select @ptd_taxing_unit_11_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)             
        end

        if (@@FETCH_STATUS = 0)
        begin           
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_12_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_12_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_12_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin

                        select @ptd_taxing_unit_12_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_12_id_code = '00000000'
                select @ptd_taxing_unit_12_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)             
        end

        if (@@FETCH_STATUS = 0)
        begin           
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_13_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_13_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_13_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_13_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_13_id_code = '00000000'
                select @ptd_taxing_unit_13_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)             
        end

        if (@@FETCH_STATUS = 0)
        begin           
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_14_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_14_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_14_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_14_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_14_id_code = '00000000'
                select @ptd_taxing_unit_14_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)             
        end

        if (@@FETCH_STATUS = 0)
        begin           
                if (@taxing_unit_num is not null)
                begin
                        select @ptd_taxing_unit_15_id_code = @taxing_unit_num
                end
                else
                begin
                        select @ptd_taxing_unit_15_id_code = '00000000'
                end
                
                if (@ptd_multi_unit is not null)
                begin
                        select @ptd_taxing_unit_15_multicounty_taxing_unit_indicator_or_county_fund_type = @ptd_multi_unit
                end
                else
                begin
                        select @ptd_taxing_unit_15_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)
                end

                FETCH NEXT FROM PTD_AMR_TU into @taxing_unit_num, @ptd_multi_unit
        end
        else
        begin
                select @ptd_taxing_unit_15_id_code = '00000000'
                select @ptd_taxing_unit_15_multicounty_taxing_unit_indicator_or_county_fund_type = SPACE(1)             
        end

        CLOSE PTD_AMR_TU
        DEALLOCATE PTD_AMR_TU

        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'PC'
                        and     prop_exemption_vw.exmpt_type_cd is not null)
        begin
                select @ptd_pollution_control_exemption_indicator = 'Y'
        end
        else
        begin
                select @ptd_pollution_control_exemption_indicator = 'N'

        end

        select @ptd_low_income_housing_indicator = 'N'

        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'AB'
                        and     prop_exemption_vw.exmpt_type_cd is not null
                        and     prop_exemption_vw.effective_dt  < '1993-06-01 00:00:00.000'
                        and     prop_exemption_vw.effective_dt  is not null)
        begin
                select @ptd_abatement_granted_before_may311999 = 'Y'
        end
        else
        begin
                select @ptd_abatement_granted_before_may311999 = 'N'

        end

        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'FR'
                        and     prop_exemption_vw.exmpt_type_cd is not null)
        begin
                select @ptd_freeport_exemption_indicator = 'Y'
        end
        else
        begin
                select @ptd_freeport_exemption_indicator = 'N'

        end

        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'EX366'
                        and     prop_exemption_vw.exmpt_type_cd is not null
                        and     @prop_type_cd = 'MN')
        begin
                select @ptd_mineral_interest_property_valued_at_less_than_500_indicator = 'Y'
        end
        else
        begin
                select @ptd_mineral_interest_property_valued_at_less_than_500_indicator = 'N'

        end

        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'EX366'
                        and     prop_exemption_vw.exmpt_type_cd is not null
                        and     @prop_type_cd = 'P')
        begin
                select @ptd_income_producing_personal_property_valued_at_less_than_500_indicator = 'Y'
        end
        else
        begin
                select @ptd_income_producing_personal_property_valued_at_less_than_500_indicator = 'N'

        end

        if exists (select       exmpt_type_cd
                        from    prop_exemption_vw
                        where   prop_exemption_vw.owner_tax_yr  = @input_yr
                        and     prop_exemption_vw.prop_id       = @prop_id
                        and     prop_exemption_vw.exmpt_type_cd = 'PRO'
                        and     prop_exemption_vw.exmpt_type_cd is not null)
        begin
                select @ptd_proration_exemption_indicator = 'Y'
        end
        else
        begin
                select @ptd_proration_exemption_indicator = 'N'

        end

        select @ptd_tax_deferral_of_over65_or_increasing_home_taxes_indicator = 'N'

        if (@ten_percent_cap > 0)
        begin
                select @ptd_hscap_on_residential_homesteads_indicator = 'Y'
        end
        else
        begin
                select @ptd_hscap_on_residential_homesteads_indicator = 'N'
        end

        select @ptd_water_conservation_initiatives_indicator = 'N'
        select @ptd_property_in_more_than_one_cad_indicator = 'N'

        if exists (select       *
                        from    land_detail_vw
                        where   prop_val_yr     = @input_yr
                        and     prop_id         = @prop_id
                        and     ag_apply        = 'T'
                        and     ag_apply        is not null
                        and     ag_val          > 0
                        and     state_cd        not like 'D%')
        begin
                select @ptd_property_receiving_productivity_value_in_categories_other_than_category_d_indicator = 'Y'
        end
        else
        begin
                select @ptd_property_receiving_productivity_value_in_categories_other_than_category_d_indicator = 'N'
        end


        insert into ptd_amr     (
                                record_type,
                                cad_id_code,
                                account_number,
                                last_reappraisal,
                                percent_ownership,
                                utility_company_or_mineral_type,
                                total_exemption_indicator,
                                homestead_exemption_indicator,
                                over65_over55_surviving_spouse_exemption_indicator,
                                tax_ceiling_indicator,
                                disabled_person_exemption_indicator,
                                disabled_or_deceased_veterans_exemption_indicator,
                                historic_exemption_indicator,
                                solar_wind_powered_exemption_indicator,
                                abatements_indicator,
                                tax_increment_financing_indicator,
                                tif_zone_name,
                                total_market_value,
                                land_units,
                                land_size,
                                complex_property_indicator,
                                blank,
                                certified_value_indicator,
                                field_not_used,
                                same_taxing_unit_data_indicator,
                                taxing_unit_1_id_code,
                                taxing_unit_2_id_code,
                                taxing_unit_3_id_code,
                                taxing_unit_4_id_code,
                                taxing_unit_5_id_code,
                                taxing_unit_6_id_code,
                                taxing_unit_7_id_code,
                                taxing_unit_8_id_code,
                                taxing_unit_9_id_code,
                                taxing_unit_10_id_code,
                                taxing_unit_11_id_code,
                                taxing_unit_12_id_code,
                                taxing_unit_13_id_code,
                                taxing_unit_14_id_code,
                                taxing_unit_15_id_code,
                                taxing_unit_1_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_2_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_3_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_4_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_5_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_6_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_7_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_8_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_9_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_10_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_11_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_12_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_13_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_14_multicounty_taxing_unit_indicator_or_county_fund_type,
                                taxing_unit_15_multicounty_taxing_unit_indicator_or_county_fund_type,
                                pollution_control_exemption_indicator,
                                low_income_housing_indicator,
                                abatement_granted_before_may311999,
                                freeport_exemption_indicator,
                                mineral_interest_property_valued_at_less_than_500_indicator,
                                income_producing_personal_property_valued_at_less_than_500_indicator,
                                proration_exemption_indicator,
                                tax_deferral_of_over65_or_increasing_home_taxes_indicator,
                                hscap_on_residential_homesteads_indicator,
                                water_conservation_initiatives_indicator,
                                property_in_more_than_one_cad_indicator,
                                property_receiving_productivity_value_in_categories_other_than_category_d_indicator,
                                tmp_total_market_value,
                                tmp_land_size
                                )
        values                  (
                                @ptd_record_type,
                                @ptd_cad_id_code,
                                @ptd_account_number,
                                @ptd_last_reappraisal,
                                @ptd_percent_ownership,
                                @ptd_utility_company_or_mineral_type,
                                @ptd_total_exemption_indicator,
                                @ptd_homestead_exemption_indicator,
                                @ptd_over65_over55_surviving_spouse_exemption_indicator,
                                @ptd_tax_ceiling_indicator,
                                @ptd_disabled_person_exemption_indicator,
                                @ptd_disabled_or_deceased_veterans_exemption_indicator,
                                @ptd_historic_exemption_indicator,
                                @ptd_solar_wind_powered_exemption_indicator,
                                @ptd_abatements_indicator,
                                @ptd_tax_increment_financing_indicator,
                                @ptd_tif_zone_name,
                                0,
                                @ptd_land_units,
                                @ptd_land_size,
                                @ptd_complex_property_indicator,
                                @ptd_blank,
                                @ptd_certified_value_indicator,
                                @ptd_field_not_used,
                                @ptd_same_taxing_unit_data_indicator,
                                @ptd_taxing_unit_1_id_code,
                                @ptd_taxing_unit_2_id_code,
                                @ptd_taxing_unit_3_id_code,
                                @ptd_taxing_unit_4_id_code,
                                @ptd_taxing_unit_5_id_code,
                                @ptd_taxing_unit_6_id_code,
                                @ptd_taxing_unit_7_id_code,
                                @ptd_taxing_unit_8_id_code,
                                @ptd_taxing_unit_9_id_code,
                                @ptd_taxing_unit_10_id_code,
                                @ptd_taxing_unit_11_id_code,
                                @ptd_taxing_unit_12_id_code,
                                @ptd_taxing_unit_13_id_code,
                                @ptd_taxing_unit_14_id_code,
                                @ptd_taxing_unit_15_id_code,
                                @ptd_taxing_unit_1_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_2_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_3_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_4_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_5_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_6_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_7_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_8_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_9_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_10_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_11_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_12_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_13_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_14_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_taxing_unit_15_multicounty_taxing_unit_indicator_or_county_fund_type,
                                @ptd_pollution_control_exemption_indicator,
                                @ptd_low_income_housing_indicator,
                                @ptd_abatement_granted_before_may311999,
                                @ptd_freeport_exemption_indicator,
                                @ptd_mineral_interest_property_valued_at_less_than_500_indicator,
                                @ptd_income_producing_personal_property_valued_at_less_than_500_indicator,
                                @ptd_proration_exemption_indicator,
                                @ptd_tax_deferral_of_over65_or_increasing_home_taxes_indicator,
                                @ptd_hscap_on_residential_homesteads_indicator,
                                @ptd_water_conservation_initiatives_indicator,
                                @ptd_property_in_more_than_one_cad_indicator,
                                @ptd_property_receiving_productivity_value_in_categories_other_than_category_d_indicator,
                                @appraised_val,
                                @tmp_land_size
                                )

FETCH NEXT FROM PTD_AMR into    @prop_id,
                                @last_appraisal_yr,
                                @state_cd,
                                @owner_tax_yr,
                                @appraised_val,
                                @prop_type_cd,
                                @ten_percent_cap

end

CLOSE PTD_AMR
DEALLOCATE PTD_AMR

GO

