
 

/******************************************************************************************

 Procedure: LevyCertificationCaptureValues_New

 Synopsis:  Captures a summary of property values by tax district/levy for use with a

                  Levy Certification Run.

 Call From: App Server

 ******************************************************************************************/
-- LevyCertificationCaptureValues_New 2006,0,131,'testdesc'
CREATE PROCEDURE LevyCertificationCaptureValues_New 

      @year             numeric (4, 0) ,

      @as_of_sup_num    int ,

      @pacs_user_id     int,

      @description      varchar(50)

AS

      SET NOCOUNT ON
      declare @captured_value_run_id                  int 

 

      -- get a new run id 

      exec GetUniqueID 'captured_value_run', @captured_value_run_id output

 

      -- see if property value has been certified yet

      declare @is_certified_value bit

      

      set @is_certified_value = 0

      

      if exists (select * from pacs_year where tax_yr = @year and certification_dt is not null)

      begin

            set @is_certified_value = 1

      end

 

      -- create the captured_value_run record

      insert into captured_value_run

      (captured_value_run_id, [year], [description], as_of_sup_num, created_date, created_by_id, is_certified_value, [status])

      values

      (@captured_value_run_id, @year, @description, @as_of_sup_num, getdate(), @pacs_user_id, @is_certified_value, 'Executing')

 
      -- create a temporary table to hold all captured value broken out by category
     if object_id('tempdb..#captured_value') is not null
        begin
	    drop table #captured_value
        end

       create table #captured_value
      (
            [year] numeric(4,0),

            sup_num int,

            prop_id int,

            tax_district_id int,

            levy_cd varchar(10),

            tax_area_id int,

            real_pers_value_non_annex numeric(14, 2),

            state_value_non_annex numeric(14, 2),

            senior_value_non_annex numeric(14, 2),

            new_const_value_non_annex numeric(14, 2),

            real_pers_value_annex numeric(14, 2),

            state_value_annex numeric(14, 2),

            senior_value_annex numeric(14, 2),

            new_const_value_annex numeric(14, 2),

            is_annexation_value bit

      )

 

      -- populate the temp table with all values for the current year

      insert into #captured_value

      (

            [year],

            sup_num,

            prop_id,

            tax_area_id,

            real_pers_value_non_annex,

            state_value_non_annex,

            senior_value_non_annex,

            new_const_value_non_annex,

            real_pers_value_annex,

            state_value_annex,

            senior_value_annex,

            new_const_value_annex,

            is_annexation_value

      )


      select

            @year,

            psa.sup_num,

            psa.prop_id,

            wpola.tax_area_id,

            wpov.taxable_non_classified,

            wpov.state_assessed,

            wpov.taxable_classified,

            wpov.new_val_hs + wpov.new_val_nhs + wpov.new_val_p,

            0, 0, 0, 0, 0

      from wash_prop_owner_val as wpov with (nolock)
      join (select
              [year],
              max(sup_num) as sup_num,
              prop_id
             from wash_prop_owner_val with (nolock)
            where [year] = @year
              and sup_num <= @as_of_sup_num
            group by [year], prop_id ) as psa
      on    psa.[year] = wpov.[year]
            and psa.sup_num = wpov.sup_num
            and psa.prop_id = wpov.prop_id
            and wpov.[year] = @year
      join wash_prop_owner_levy_assoc as wpola with (nolock) on
                wpola.prop_id           = wpov.prop_id
            and wpola.[year]        = wpov.[year]
            and wpola.sup_num       = wpov.sup_num
            and wpola.owner_id            = wpov.owner_id
            and wpola.[year] = @year

       -- now update info from tax_area_fund_assoc

      UPDATE #captured_value
         SET tax_district_id = tafa.tax_district_id ,
             levy_cd =  tafa.levy_cd
        FROM #captured_value cp join 
             tax_area_fund_assoc as tafa with (nolock) on
             tafa.[year]             = cp.[year]
             and tafa.tax_area_id    = cp.tax_area_id


      -- Although Real Property may have classified value, a levy may not necessarily

      -- exempt classified value for Senior/Disabled.  In such cases, move the  

      -- classified value to the non-classified column

      update #captured_value set

            real_pers_value_non_annex = real_pers_value_non_annex + senior_value_non_annex

      where 

                  prop_id in (select prop_id from [property] where prop_type_cd in ('R', 'MH'))

            and not exists (

                  select * from levy_exemption as le with (nolock) where

                        le.[year]                     = #captured_value.[year]

                  and le.tax_district_id        = #captured_value.tax_district_id

                  and le.levy_cd                      = #captured_value.levy_cd

                  and le.exmpt_type_cd          = 'SNR/DSBL'

            )

 

      update #captured_value set

            senior_value_non_annex = 0

      where 

                  prop_id in (select prop_id from [property] where prop_type_cd in ('R', 'MH'))

            and not exists (

                  select * from levy_exemption as le with (nolock) where

                        le.[year]                     = #captured_value.[year]

                  and le.tax_district_id        = #captured_value.tax_district_id

                  and le.levy_cd                      = #captured_value.levy_cd

                  and le.exmpt_type_cd          = 'SNR/DSBL'

            )

 

      -- Although Personal Property may have classified value, a levy may not necessarily

      -- exempt classified value for Farm.  In such cases, move the classified value to the 

      -- non-classified column.

      update #captured_value set

            real_pers_value_non_annex = real_pers_value_non_annex + senior_value_non_annex

      where 

                  prop_id in (select prop_id from [property] where prop_type_cd = 'P')

            and not exists (

                  select * from levy_exemption as le with (nolock) where

                        le.[year]                     = #captured_value.[year]

                  and le.tax_district_id        = #captured_value.tax_district_id

                  and le.levy_cd                      = #captured_value.levy_cd

                  and le.exmpt_type_cd          = 'FARM'

            )

 

      update #captured_value set

            senior_value_non_annex = 0

      where 

                  prop_id in (select prop_id from [property] where prop_type_cd = 'P')

            and not exists (

                  select * from levy_exemption as le with (nolock) where

                        le.[year]                     = #captured_value.[year]

                  and le.tax_district_id        = #captured_value.tax_district_id

                  and le.levy_cd                      = #captured_value.levy_cd

                  and le.exmpt_type_cd          = 'FARM'

            )

      

      -- now update the annex values for any properties involved in an active 

      -- annexation for the current year

      update #captured_value set

            real_pers_value_annex = real_pers_value_non_annex,

            state_value_annex = state_value_non_annex,

            senior_value_annex = senior_value_non_annex,

            new_const_value_annex = new_const_value_non_annex,

            is_annexation_value = 1

      from #captured_value as cv

      join 

      (

            annexation as anx with (nolock)

            join annexation_property_assoc as apa with (nolock) on

                  apa.annexation_id = anx.annexation_id

      ) on

                  apa.prop_id                         = cv.prop_id

            and anx.start_year                        = cv.[year]

            and anx.tax_district_id             = cv.tax_district_id

      where anx.annexation_status = 1

 

      -- clear new construction non-annex value for property that was annexed.

      -- We don't want new construction value to be summed in the the total new 

      -- construction value 

      update #captured_value set

            new_const_value_non_annex = 0

      where is_annexation_value = 1

 

      -- Now populate the captured_value table with sums according to the following rules:

      --    1.    Total taxable value = real_pers_value + senior_value + state_value from non-annex columns

      --    2.    Annex Value = real_pers_value + senior_value + state_value from annex columns

      --    3.    New Construction value = sum of non-annexed new construction value

      insert into captured_value (

            captured_value_run_id,

            [year],

            tax_district_id,

            levy_cd,

            tax_area_id,

            real_pers_value,

            state_value,

            senior_value,

            new_const_value,

            taxable_value,

            annex_value,

            is_joint_district_value)

      select

            @captured_value_run_id,

            @year,

            cv.tax_district_id,

            cv.levy_cd,

            cv.tax_area_id,

            sum(real_pers_value_non_annex),

            sum(state_value_non_annex),

            sum(senior_value_non_annex),

            sum(new_const_value_non_annex),

            sum(real_pers_value_non_annex + state_value_non_annex + senior_value_non_annex),

            sum(real_pers_value_annex + state_value_annex + senior_value_annex),

            0

      from #captured_value as cv with (nolock)

      group by

            cv.tax_district_id,

            cv.levy_cd,

            cv.tax_area_id

 

      -- add joint district values

      insert into captured_value (

            captured_value_run_id,

            [year],

            tax_district_id,

            levy_cd,

            tax_area_id,

            real_pers_value,

            state_value,

            senior_value,

            annex_value,

            new_const_value,

            taxable_value,

            is_joint_district_value)

      select

            @captured_value_run_id,

            @year,

            tdj.tax_district_id,

            tdj.levy_cd,

            tdj.acct_id_linked,

            tdj.assessed_value,

            tdj.state_assessed_value,

            tdj.senior_assessed_value,

            tdj.annex_value,

            tdj.new_const_value,

            tdj.assessed_value + tdj.senior_assessed_value + tdj.state_assessed_value,

            1

      from tax_district_joint as tdj with (nolock)

      where tdj.[year] = @year

      

      update captured_value_run set

            [status] = 'Ready'

      where captured_value_run_id = @captured_value_run_id

            and [year] = @year

GO

