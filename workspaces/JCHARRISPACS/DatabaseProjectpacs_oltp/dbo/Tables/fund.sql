CREATE TABLE [dbo].[fund] (
    [year]                NUMERIC (4)  NOT NULL,
    [tax_district_id]     INT          NOT NULL,
    [levy_cd]             VARCHAR (10) NOT NULL,
    [fund_id]             INT          NOT NULL,
    [fund_number]         NUMERIC (14) NULL,
    [begin_date]          DATETIME     NULL,
    [end_date]            DATETIME     NULL,
    [fund_description]    VARCHAR (50) NULL,
    [disburse]            BIT          CONSTRAINT [CDF_fund_disburse] DEFAULT ((0)) NOT NULL,
    [disburse_acct_id]    INT          NULL,
    [display_fund_number] AS           (right('0000000000'+CONVERT([varchar],[fund_number],0),(10))),
    [annexation_id]       INT          CONSTRAINT [CDF_fund_annexation_id] DEFAULT ((0)) NULL,
    CONSTRAINT [CPK_fund] PRIMARY KEY CLUSTERED ([year] ASC, [tax_district_id] ASC, [levy_cd] ASC, [fund_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_fund_year_tax_district_id_levy_cd] FOREIGN KEY ([year], [tax_district_id], [levy_cd]) REFERENCES [dbo].[levy] ([year], [tax_district_id], [levy_cd])
);


GO

CREATE NONCLUSTERED INDEX [IDX_fund_fund_number]
    ON [dbo].[fund]([fund_number] ASC) WITH (FILLFACTOR = 90);


GO


create trigger tr_fund_delete_insert_update_MemTable
on fund
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
where szTableName = 'fund'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'annexation id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fund', @level2type = N'COLUMN', @level2name = N'annexation_id';


GO

