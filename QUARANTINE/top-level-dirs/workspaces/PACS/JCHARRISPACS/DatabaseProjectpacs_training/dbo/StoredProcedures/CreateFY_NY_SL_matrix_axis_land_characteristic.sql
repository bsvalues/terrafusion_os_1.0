
create procedure CreateFY_NY_SL_matrix_axis_land_characteristic
	@lInputFromYear numeric(4,0),
	@lCopyToYear numeric(4,0),
	@CalledBy varchar(10) 
 
as
 
/* Top of each procedure to capture input parameters */
set nocount on
declare @Rows int
declare @qry varchar(255)

declare @proc varchar(500)
set @proc = object_name(@@procid)

set @qry = 'Start - ' + @proc + ' ' + convert(char(4), @lInputFromYear) + ',' + 
	convert(char(4),@lCopyToYear) + ',' + @CalledBy
exec dbo.CurrentActivityLogInsert @proc, @qry
 
/* End top of each procedure to capture parameters */

insert into matrix_axis_land_characteristic
(matrix_yr, axis_cd, matrix_type, characteristic_cd)

select 
	@lCopyToYear,
  malc.axis_cd,
  malc.matrix_type,
	malc.characteristic_cd

from matrix_axis_land_characteristic malc

where malc.matrix_yr = @lInputFromYear

and not exists (  -- don't copy over existing keys
	select 1 from matrix_axis_land_characteristic fy_malc
	where fy_malc.matrix_yr = @lCopyToYear
	and fy_malc.matrix_type = malc.matrix_type
)
 
set @Rows = @@Rowcount


-- update log
set @qry = Replace(@qry, 'Start', 'End')
exec dbo.CurrentActivityLogInsert @proc, @qry, @Rows, @@ERROR

GO

