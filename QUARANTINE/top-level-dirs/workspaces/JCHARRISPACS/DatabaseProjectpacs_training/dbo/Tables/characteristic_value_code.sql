CREATE TABLE [dbo].[characteristic_value_code] (
    [characteristic_cd]     VARCHAR (10) NOT NULL,
    [characteristic_desc]   VARCHAR (40) NOT NULL,
    [push_to_land]          BIT          NOT NULL,
    [priority]              INT          NULL,
    [receive_from_gis]      BIT          NULL,
    [available_to_property] BIT          NULL,
    [available_to_land]     BIT          NULL,
    [primary_zoning]        BIT          NULL,
    [topography]            BIT          NULL,
    [secondary_zoning]      BIT          CONSTRAINT [CDF_characteristic_value_code_secondary_zoning] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_characteristic_value_code] PRIMARY KEY CLUSTERED ([characteristic_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


create trigger tr_characteristic_value_code_insert_update_PacsConfigUpdate
on characteristic_value_code
for insert, update
not for replication
as

if ( @@rowcount = 0 )
begin
	return
end

set nocount on

	declare @characteristic_cd varchar(10)

	-- The way we store primary & secondary zoning flags is retarded.
	-- There can be only one and that is why I created the pacs_config rows for them.
	-- Nonetheless everyone ignored my emails to change this so now we have this brute force trigger
	-- so that the recalc (profile population) and its dependency (comp grids) can have good configuration & data.
	
	if update(primary_zoning)
	begin
		set @characteristic_cd = null
		select @characteristic_cd = characteristic_cd
		from inserted
		where primary_zoning = 1
		
		if (@characteristic_cd is not null)
		begin
			update pacs_config
			set szConfigValue = @characteristic_cd
			where szGroup = 'CHARACTERISTICS' and szConfigName = 'ZONING1'
		end
	end
	
	if update(secondary_zoning)
	begin
		set @characteristic_cd = null
		select @characteristic_cd = characteristic_cd
		from inserted
		where secondary_zoning = 1
		
		if (@characteristic_cd is not null)
		begin
			update pacs_config
			set szConfigValue = @characteristic_cd
			where szGroup = 'CHARACTERISTICS' and szConfigName = 'ZONING2'
		end
	end

GO


create trigger tr_characteristic_value_code_delete_insert_update_MemTable
on characteristic_value_code
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
-- the cached MMTableField reader also returns data from this table
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName in ('characteristic_value_code', 'mm_table_field')

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates that this code is the secondary zoning code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'characteristic_value_code', @level2type = N'COLUMN', @level2name = N'secondary_zoning';


GO

