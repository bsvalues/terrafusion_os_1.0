CREATE TABLE [dbo].[dor_use_code] (
    [sub_cd]        VARCHAR (10)  NOT NULL,
    [sub_desc]      VARCHAR (40)  NOT NULL,
    [land_use_cd]   VARCHAR (10)  NOT NULL,
    [land_use_desc] VARCHAR (200) NOT NULL,
    [residential]   BIT           NULL,
    [multifamily]   BIT           NULL,
    [commercial]    BIT           NULL,
    [industrial]    BIT           NULL,
    [current_use]   BIT           NULL,
    [other]         BIT           NULL,
    [mh_park]       BIT           NULL,
    CONSTRAINT [CPK_dor_use_code] PRIMARY KEY CLUSTERED ([sub_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


create trigger tr_dor_use_code_delete_insert_update_MemTable
on dor_use_code
for delete, insert, update
not for replication
as

if ( @@rowcount = 0 )
begin
	return
end

set nocount on

update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'dor_use_code'

GO

