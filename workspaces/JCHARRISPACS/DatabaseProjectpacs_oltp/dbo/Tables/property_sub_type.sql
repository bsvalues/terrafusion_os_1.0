CREATE TABLE [dbo].[property_sub_type] (
    [property_sub_cd]        VARCHAR (5)  NOT NULL,
    [property_sub_desc]      VARCHAR (20) NOT NULL,
    [residential]            BIT          NULL,
    [commercial]             BIT          NULL,
    [state_assessed_utility] BIT          NULL,
    [local_assessed_utility] BIT          NULL,
    [farm]                   BIT          NULL,
    [leased]                 BIT          NULL,
    [industrial]             BIT          NULL,
    [prop_type]              CHAR (5)     NULL,
    [boat]                   BIT          NULL,
    [state_bid_timber]       BIT          NULL,
    [imp_leased_land]        BIT          CONSTRAINT [CDF_property_sub_type_imp_leased_land] DEFAULT ((0)) NOT NULL,
    [facility_type]          CHAR (1)     NULL,
    CONSTRAINT [CPK_property_sub_type] PRIMARY KEY CLUSTERED ([property_sub_cd] ASC)
);


GO


create trigger [dbo].[tr_property_sub_type_delete_insert_update_MemTable]
on [dbo].[property_sub_type]
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
where szTableName = 'property_sub_type'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates if a property is state-bid timber.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_sub_type', @level2type = N'COLUMN', @level2name = N'state_bid_timber';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicates if a property is a boat.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_sub_type', @level2type = N'COLUMN', @level2name = N'boat';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Facility Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_sub_type', @level2type = N'COLUMN', @level2name = N'facility_type';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Improvements on Leased Land Attribute', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_sub_type', @level2type = N'COLUMN', @level2name = N'imp_leased_land';


GO

