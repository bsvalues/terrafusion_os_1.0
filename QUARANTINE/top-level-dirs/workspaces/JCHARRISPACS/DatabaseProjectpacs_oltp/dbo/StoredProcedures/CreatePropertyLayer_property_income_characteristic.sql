CREATE   PROCEDURE CreatePropertyLayer_property_income_characteristic
	@lInputFromYear numeric(4,0),
    @lCopyToYear numeric(4,0),
    @CalledBy varchar(50) 
 
AS
 
/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)
 declare @proc varchar(500)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc + ' ' + convert(char(4),@lInputFromYear)
         + ',' + convert(char(4),@lCopyToYear) + ',' + @CalledBy
 
 exec dbo.CurrentActivityLogInsert @proc, @qry
-- set up final status message
 set @qry = Replace(@qry,'Start','End')
/* End top of each procedure to capture parameters */
INSERT INTO 
    property_income_characteristic
(
    year
   ,sup_num
   ,prop_id
   ,pic_id
   ,[type]
   ,owner_occupied
   ,survey_date
   ,situs
   ,contact_name
   ,contact_phone
   ,vacancy_rate
   ,num_rooms
   ,potential_gross_income
   ,actual_gross_income
   ,misc_income
   ,comment
   ,unusual_income
   ,unusual_expense
   ,unusual_expense_reason
   ,other_issues
   ,total_num_units
   ,total_num_units_override
   ,property_name
   ,is_active
)
SELECT 
    @lCopyToYear
    ,0  -- pic.sup_num
    ,pic.prop_id
    ,pic.pic_id
    ,pic.[type]
    ,pic.owner_occupied
    ,pic.survey_date
    ,pic.situs
    ,pic.contact_name
    ,pic.contact_phone
    ,pic.vacancy_rate
    ,pic.num_rooms
    ,pic.potential_gross_income
    ,pic.actual_gross_income
    ,pic.misc_income
    ,pic.comment
    ,pic.unusual_income
    ,pic.unusual_expense
    ,pic.unusual_expense_reason
    ,pic.other_issues
    ,pic.total_num_units
    ,pic.total_num_units_override
    ,pic.property_name
    ,pic.is_active
 FROM create_property_layer_prop_list as cplpl with(tablockx) join 
      property_income_characteristic as pic  with(tablockx) 
   on pic.year = cplpl.prop_val_yr
 and pic.sup_num = cplpl.sup_num
 and pic.prop_id = cplpl.prop_id
 

-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

