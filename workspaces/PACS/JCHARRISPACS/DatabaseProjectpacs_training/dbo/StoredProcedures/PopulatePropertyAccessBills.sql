
		CREATE PROCEDURE [dbo].[PopulatePropertyAccessBills]
		@input_prop_id      		int,
		@input_effective_date        	varchar(10),
		@input_year			int = 0,
		@input_total_due		bit = 0
		AS
			set nocount on

GO

