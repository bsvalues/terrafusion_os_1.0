
CREATE PROCEDURE dbo.WAUndoNewYearLayerTablePV
    @input_from_yr numeric(4,0),
    @CalledBy varchar(50) 

AS

/* Top of each procedure to capture input parameters */
SET NOCOUNT ON
DECLARE @Rows int
DECLARE @qry varchar(255)
 declare @proc varchar(500)
 set @proc = object_name(@@procid)
 
 SET @qry = 'Start - ' + @proc + ' '
         + convert(char(4),@input_from_yr)
         + ','  + @CalledBy
 
 exec dbo.CurrentActivityLogInsert @proc, @qry

-- set variable for final status entry
 set @qry = Replace(@qry,'Start','End')
 
/* End top of each procedure to capture parameters */

delete from wash_property_val where prop_val_yr = @input_from_yr

exec dbo.CurrentActivityLogInsert @proc, 'end delete wash_property_val',@@ROWCOUNT,@@ERROR

delete from  wash_prop_owner_tax_district_assoc where year = @input_from_yr

exec dbo.CurrentActivityLogInsert @proc, 'end delete wash_prop_owner_tax_district_assoc' ,@@ROWCOUNT,@@ERROR

-- update log
exec dbo.CurrentActivityLogInsert @proc, @qry,@@ROWCOUNT,@@ERROR

GO

