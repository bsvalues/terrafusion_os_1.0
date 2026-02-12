





CREATE  procedure PreliminaryRollReportRecalcTotals
	@input_sql_props	varchar(2000),
	@input_entity_ids	varchar(200),
	@input_year		varchar(4)

as

SET NOCOUNT ON


exec CalculateTaxable @input_entity_ids, 0, @input_year, 0, @input_sql_props

GO

