

create procedure PenpadGetCheckOutTables

as
	select szObjectName, szPIDColumnName
	from penpad_db_objects
	where
		szObjectType = 'U' and
		bCheckOut = 1
	order by szObjectName /* Possibly to be changed later, based on an order #, in order to work with PK/FK relationships */

GO

