

create procedure PenpadGetCheckInTables
	@bPropertyTables bit /* 1 = only property tables ; 0 = only non property tables ; null = all */
as

	select szObjectName, szPIDColumnName
	from penpad_db_objects
	where
		szObjectType = 'U' and
		bCheckIn = 1 and (
			@bPropertyTables is null or
			(@bPropertyTables = 0 and szPIDColumnName is null) or
			(@bPropertyTables = 1 and szPIDColumnName is not null)
		)
	order by lOrder asc

GO

