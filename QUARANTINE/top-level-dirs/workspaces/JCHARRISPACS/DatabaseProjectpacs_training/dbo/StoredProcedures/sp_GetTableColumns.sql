

create procedure sp_GetTableColumns
	@szTableName sysname
as
	select
		sc.colid as column_order,
		sc.name as column_name,
		st.name as type_name,
		sc.isnullable,
		sc.length as data_length,
		sc.colstat & 1 as is_identity,
		ident_incr(systables.name),
		ident_seed(systables.name),
		sc.xprec,
		sc.xscale
	from syscolumns as sc with(nolock)
	join systypes as st with(nolock) on
		sc.xtype = st.xtype
	join sysobjects as systables on
		sc.id = systables.id
	where
		sc.id = object_id(@szTableName)
	order by sc.colid

GO

