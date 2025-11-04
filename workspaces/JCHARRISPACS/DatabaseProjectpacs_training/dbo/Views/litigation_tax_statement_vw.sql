CREATE VIEW [dbo].[litigation_tax_statement_vw]
AS
		select distinct b.year, b.prop_id, isNull(b.statement_id, 0) as statement_id, l.*
		from litigation_statement_assoc as lba with (nolock)
		join bill as b with (nolock) 
			on b.statement_id = lba.statement_id and b.year = lba.year
		join litigation as l with (nolock) 
		on l.litigation_id = lba.litigation_id

GO

