






CREATE PROCEDURE DeleteFutureYearTaxRateLayer

AS

declare @lFutureYear numeric(4)
set @lFutureYear = 0

--entity_exmpt
delete from entity_exmpt where exmpt_tax_yr = @lFutureYear

--tax_rate
delete from tax_rate where tax_rate_yr = @lFutureYear

GO

