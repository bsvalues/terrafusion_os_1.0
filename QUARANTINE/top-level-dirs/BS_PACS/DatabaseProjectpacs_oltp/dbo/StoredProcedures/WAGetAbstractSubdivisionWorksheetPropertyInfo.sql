
CREATE PROCEDURE WAGetAbstractSubdivisionWorksheetPropertyInfo
   @input_abs_subdv_cd	varchar(10)
with recompile 
AS

declare @date_entered		datetime
declare	@prop_id		int
declare @geo_id			varchar(50)
declare	@existing_acreage	decimal(14,4)
declare @deleted_acreage	decimal(14,4)
declare @remaining_acreage	decimal(14,4)
declare @market_val	decimal(14,0)

set nocount off 

select
	isnull(date_entered, GetDate()),
	prop_id,
	isnull(geo_id, ''),
	isnull(existing_acreage, 0.0),
	isnull(deleted_acreage, 0.0),
	isnull(remaining_acreage, 0.0),
	isnull(market_val, 0.0)
from
	abs_subdv_worksheet_prop_assoc
where
	abs_subdv_cd = @input_abs_subdv_cd
order by date_entered, prop_id

set nocount off

GO

