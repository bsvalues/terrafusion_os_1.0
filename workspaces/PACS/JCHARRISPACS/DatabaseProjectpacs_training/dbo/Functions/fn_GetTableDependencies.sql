
Create function dbo.fn_GetTableDependencies 
(
@table_name varchar(300)
)
   returns @Dependencies Table
(
  reference_type varchar(50)
 ,obj_name nvarchar(257)
 ,obj_type nvarchar(16)
 ,updated nvarchar(7)
 ,used_in_select nvarchar(8)
 ,depends_on_column sysname
)

as

BEGIN
declare @objid int
select @objid = object_id(@table_name)


--  get objects that this table depends on.
Insert into @Dependencies
select
 	'This object depends on:' as Reference_type,
     'name' = (s6.name+ '.' + o1.name),
	 type = substring(v2.name, 5, 16),
	 updated = substring(u4.name, 1, 7),
	 selected = substring(w5.name, 1, 8),
     'column' = col_name(d3.depid, d3.depnumber)
from	 sysobjects		o1
	,master.dbo.spt_values	v2
	,sysdepends		d3
	,master.dbo.spt_values	u4
	,master.dbo.spt_values	w5 --11667
	,sysusers		s6
where	 o1.id = d3.depid
and	 o1.xtype = substring(v2.name,1,2) collate database_default and v2.type = 'O9T'
and	 u4.type = 'B' and u4.number = d3.resultobj
and	 w5.type = 'B' and w5.number = d3.readobj|d3.selall
and	 d3.id = @objid
and	 o1.uid = s6.uid
and deptype < 2


--  Now check for things that depend on the object.
Insert into @Dependencies
select distinct 
    'Objects that depend on it:' as Reference_type,
    'name' = (s.name + '.' + o.name),
	type = substring(v.name, 5, 16),
    '',
    '',
    ''
		from sysobjects o, master.dbo.spt_values v, sysdepends d,
			sysusers s
		where o.id = d.id
			and o.xtype = substring(v.name,1,2) collate database_default and v.type = 'O9T'
			and d.depid = @objid
			and o.uid = s.uid
			and deptype < 2



RETURN
END

GO

