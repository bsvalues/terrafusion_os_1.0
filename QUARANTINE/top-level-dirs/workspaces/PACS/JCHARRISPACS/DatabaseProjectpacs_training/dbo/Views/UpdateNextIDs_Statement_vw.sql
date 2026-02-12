
create view UpdateNextIDs_Statement_vw
as

	select year, statement_id
	from bill
	
	union all
	
	select year, statement_id
	from fee

GO

