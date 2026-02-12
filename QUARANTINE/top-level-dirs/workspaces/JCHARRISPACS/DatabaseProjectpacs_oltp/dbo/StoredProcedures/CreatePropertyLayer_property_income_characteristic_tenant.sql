CREATE   PROCEDURE CreatePropertyLayer_property_income_characteristic_tenant
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
-- set variable for final status entry
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */
INSERT INTO 
    property_income_characteristic_tenant
(
    year
   ,sup_num
   ,prop_id
   ,pic_id
   ,tenant_id
   ,tenant_name
   ,lease_begin_date
   ,lease_end_date
   ,sqft_occupancy
   ,base_rent_per_month
   ,base_rent_per_year
   ,indicated_rent_per_sqft
   ,monthly_cam_per_sqft
   ,water_sewer
   ,garbage
   ,electricity
   ,heat
   ,gas
   ,real_estate_taxes
   ,fire_insurance
   ,other
)
SELECT 
    @lCopyToYear
    ,0  --pict.sup_num
    ,pict.prop_id
    ,pict.pic_id
    ,pict.tenant_id
    ,pict.tenant_name
    ,pict.lease_begin_date
    ,pict.lease_end_date
    ,pict.sqft_occupancy
    ,pict.base_rent_per_month
    ,pict.base_rent_per_year
    ,pict.indicated_rent_per_sqft
    ,pict.monthly_cam_per_sqft
    ,pict.water_sewer
    ,pict.garbage
    ,pict.electricity
    ,pict.heat
    ,pict.gas
    ,pict.real_estate_taxes
    ,pict.fire_insurance
    ,pict.other
 FROM create_property_layer_prop_list as cplpl with(tablockx) join 
      property_income_characteristic_tenant as pict  with(tablockx) 
   on pict.year = cplpl.prop_val_yr
 and pict.sup_num = cplpl.sup_num
 and pict.prop_id = cplpl.prop_id
 
-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

