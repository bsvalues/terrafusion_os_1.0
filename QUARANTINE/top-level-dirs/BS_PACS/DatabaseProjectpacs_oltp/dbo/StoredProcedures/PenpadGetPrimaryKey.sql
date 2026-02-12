

create procedure PenpadGetPrimaryKey
	@szTableName sysname,
	@lIndexID smallint = null output,
	@szPKConstraintName sysname = null output
as

set nocount on

	delete #tmp_pk_columns
	set @lIndexID = null
	set @szPKConstraintName = null

	declare @lTableID int

	set @lTableID = object_id(@szTableName)
	if ( @lTableID is null )
	begin
		return(-1)
	end

	/* Get the primary key for the table */
	select
		@lIndexID = si.indid,
		@szPKConstraintName = t_primarykeys.name
	from sysobjects as t_primarykeys
	join sysobjects as t_tables on
		t_primarykeys.parent_obj = t_tables.id
	join sysindexes as si on
		t_primarykeys.name = si.name
	where
		t_primarykeys.xtype = 'PK' and
		t_tables.id = @lTableID

	if ( @lIndexID is null )
	begin
		return(-2)
	end

	/* Get the key columns */
	insert #tmp_pk_columns (
		szColumnName, szColumnDataType, iColumnSeq
	)
	select
		sc.name, st.name, sik.keyno
	from sysindexkeys as sik
	join syscolumns as sc on
		sik.id = sc.id and
		sik.colid = sc.colid
	join systypes as st on
		sc.xtype = st.xtype and
		sc.xusertype = st.xusertype
	where
		sik.id = @lTableID and
		sik.indid = @lIndexID
	order by
		sik.keyno asc

set nocount off

GO

