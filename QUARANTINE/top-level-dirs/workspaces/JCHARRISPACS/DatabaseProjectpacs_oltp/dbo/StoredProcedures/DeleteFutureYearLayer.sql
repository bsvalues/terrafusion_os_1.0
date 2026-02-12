
CREATE procedure DeleteFutureYearLayer

AS

set nocount on

-- Perform the undo in a try-catch block and a transaction, so that errors can be
-- caught and rolled up, even if they occur in sub-procedures.
begin try
begin tran

/* turn off logging */
EXEC SetMachineLogChanges 0

/* update pacs_system */
UPDATE	pacs_system
SET	future_yr = NULL
WHERE	system_type IN ('A', 'B')

EXEC DeleteFutureYearPropertyLayer
EXEC DeleteFutureYearTaxRateLayer
EXEC DeleteFutureYearScheduleLayer

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

