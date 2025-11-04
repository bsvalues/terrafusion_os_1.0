
create procedure PenpadGetTableDefinition
	@szTableName sysname
as

	select
		sc.name, st.name,
		bIdentity = convert(
			bit,
			case when (sc.status & 0x80) <> 0 then 1 else 0 end
		),
		bComputed = convert(
			bit,
			case when sc.iscomputed <> 0 then 1 else 0 end
		)
	from syscolumns as sc
	join systypes as st on
		sc.xtype = st.xtype
	where
		sc.id = object_id(@szTableName) and
		not sc.name = 'bPenpadRowStatusCode'
	order by sc.colid asc

GO

