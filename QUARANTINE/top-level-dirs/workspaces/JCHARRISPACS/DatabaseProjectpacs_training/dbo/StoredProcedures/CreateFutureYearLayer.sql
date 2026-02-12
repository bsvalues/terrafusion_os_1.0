
CREATE PROCEDURE [dbo].[CreateFutureYearLayer]
	@lInputFromYear	numeric(4,0)

AS
 SET NOCOUNT ON

 -- Perform the future year layer creation in a try-catch block and a transaction, so that errors can be
 -- caught and rolled up, even if they occur in sub-procedures.
 begin try
 begin tran

/* turn off logging */
EXEC	SetMachineLogChanges 0

-- call Undo first to thoroughly clean the future year layer of any old records
exec DeleteFutureYearLayer

EXEC	CreateFutureYearScheduleLayer @lInputFromYear

DECLARE	@lApprYear	numeric(4,0)
EXEC	GetApprYear @lApprYear output

DECLARE	@lActualFutureYear	numeric(4,0)
SET	@lActualFutureYear = @lApprYear + 1

EXEC	CreateFutureYearTaxRateLayer  @lInputFromYear, @lActualFutureYear

-- If the Marshall & Swift commercial or residential is enabled, make sure it is in the
-- future year layer
declare @commercial_enabled bit
declare @residential_enabled bit

select @commercial_enabled = isnull(commercial_enabled,0),
		@residential_enabled = isnull(residential_enabled,0)
from ms_config
with (nolock)
where [year] = @lInputFromYear

set @commercial_enabled = isnull(@commercial_enabled,0)
set @residential_enabled = isnull(@residential_enabled,0)

if not exists(select [year]
				from ms_config
				with (nolock)
				where [year] = @lActualFutureYear)
begin
	insert ms_config
	(year, commercial_enabled, commercial_loaded, residential_enabled, residential_loaded)
	values
	(@lActualFutureYear, 0, 0, 0, 0)
end

update ms_config
set commercial_enabled = @commercial_enabled,
	residential_enabled = @residential_enabled
where [year] = @lActualFutureYear

/* update pacs_system */
UPDATE	pacs_system
SET	future_yr = @lActualFutureYear
WHERE	system_type IN ('A', 'B')

/* turn on logging */
exec SetMachineLogChanges 1


-- If an error is caught, roll back the transaction.
-- Then, raise the error again so it will appear in the PACS client.
commit tran
end try

begin catch
	if @@trancount > 0 rollback tran;

	declare @ErrorMessage nvarchar(max);
	declare @ErrorSeverity int;
	declare @ErrorState int;

	select @ErrorMessage = error_message(),
		@ErrorSeverity = error_severity(),
		@ErrorState = error_state()

	raiserror(@ErrorMessage, @ErrorSeverity, @ErrorState)
end catch

GO

