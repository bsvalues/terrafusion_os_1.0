
create procedure WADeleteFutureYearTablePV

as

set nocount on

	delete wash_property_val where prop_val_yr = 0

GO

