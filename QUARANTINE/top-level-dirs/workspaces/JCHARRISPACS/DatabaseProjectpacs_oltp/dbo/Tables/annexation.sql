CREATE TABLE [dbo].[annexation] (
    [annexation_id]              INT          NOT NULL,
    [annexation_code]            VARCHAR (10) NOT NULL,
    [annexation_description]     VARCHAR (50) NOT NULL,
    [annexation_type]            BIT          NOT NULL,
    [annexation_status]          BIT          NOT NULL,
    [tax_district_id]            INT          NOT NULL,
    [ordinance_number]           VARCHAR (40) NOT NULL,
    [ordinance_date]             DATETIME     NULL,
    [certification_request_date] DATETIME     NULL,
    [certification_issue_date]   DATETIME     NULL,
    [effective_date]             DATETIME     NULL,
    [start_year]                 NUMERIC (4)  NOT NULL,
    [excise_date]                DATETIME     NULL,
    [accept_date]                DATETIME     NULL,
    [accept_user]                INT          NULL,
    [divert_funds_date]          DATETIME     NULL,
    [divert_funds_user]          INT          NULL,
    [divert_funds_batch_id]      INT          NULL,
    [earliest_divert_funds_year] NUMERIC (4)  NULL,
    CONSTRAINT [CPK_annexation] PRIMARY KEY CLUSTERED ([annexation_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CUQ_annexation_annexation_code] UNIQUE NONCLUSTERED ([annexation_code] ASC)
);


GO


create trigger tr_annexation_delete_insert_update_MemTable
on annexation
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
where szTableName = 'annexation'

GO

