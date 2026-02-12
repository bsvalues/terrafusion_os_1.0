CREATE TABLE [dbo].[fin_reet_rate_description] (
    [description_cd]          VARCHAR (50)  NOT NULL,
    [description]             VARCHAR (255) NOT NULL,
    [administrative_fee]      BIT           CONSTRAINT [CDF_fin_reet_rate_description_administrative_fee] DEFAULT ((0)) NOT NULL,
    [lnd_cnsrv_acq_and_maint] BIT           CONSTRAINT [CDF_fin_reet_rate_description_lnd_cnsrv_acq_and_maint] DEFAULT ((0)) NULL,
    [affordable_housing]      BIT           NULL,
    CONSTRAINT [CPK_fin_reet_rate_description] PRIMARY KEY CLUSTERED ([description_cd] ASC)
);


GO


create trigger tr_fin_reet_rate_description_delete_insert_update_MemTable
on fin_reet_rate_description
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
where szTableName = 'fin_reet_rate_description'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'affordable_housing', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fin_reet_rate_description', @level2type = N'COLUMN', @level2name = N'affordable_housing';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Describes a reet rate as Land Conservency or not', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fin_reet_rate_description', @level2type = N'COLUMN', @level2name = N'lnd_cnsrv_acq_and_maint';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Indicator of whether the REET Rate Type is an Admin Fee', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fin_reet_rate_description', @level2type = N'COLUMN', @level2name = N'administrative_fee';


GO

