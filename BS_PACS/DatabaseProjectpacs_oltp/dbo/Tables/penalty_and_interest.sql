CREATE TABLE [dbo].[penalty_and_interest] (
    [p_and_i_id]                        INT              IDENTITY (1, 1) NOT NULL,
    [type_cd]                           VARCHAR (5)      NOT NULL,
    [percentage]                        NUMERIC (13, 10) NOT NULL,
    [frequency_type_cd]                 VARCHAR (5)      NOT NULL,
    [begin_date]                        DATETIME         NULL,
    [end_date]                          DATETIME         NULL,
    [ref_id]                            INT              NOT NULL,
    [ref_type_cd]                       VARCHAR (5)      NOT NULL,
    [year]                              NUMERIC (4)      NULL,
    [ref_date_type_cd]                  VARCHAR (5)      NULL,
    [ref_date_offset]                   INT              CONSTRAINT [CDF_penalty_and_interest_ref_date_offset] DEFAULT ((0)) NULL,
    [ref_cd]                            VARCHAR (50)     NULL,
    [fee_type_cd]                       AS               (CONVERT([varchar](10),case when [ref_type_cd]='FEE' AND len([ref_cd])>(0) then [ref_cd]  end,0)) PERSISTED,
    [begin_date_h2]                     DATETIME         NULL,
    [end_date_h2]                       DATETIME         NULL,
    [ref_date_offset_months]            INT              CONSTRAINT [CDF_penalty_and_interest_ref_date_offset_months] DEFAULT ((0)) NULL,
    [penalty_interest_property_type_cd] VARCHAR (10)     NULL,
    CONSTRAINT [CPK_penalty_and_interest] PRIMARY KEY CLUSTERED ([p_and_i_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CCK_penalty_and_interest_begin_date_ref_date_type_cd_ref_date_offset] CHECK (([ref_date_type_cd] IS NULL OR [ref_date_type_cd]='E' OR [ref_date_type_cd]='P') AND NOT ([ref_date_type_cd] IS NULL AND [begin_date] IS NULL)),
    CONSTRAINT [CFK_penalty_and_interest_fee_type_cd] FOREIGN KEY ([fee_type_cd]) REFERENCES [dbo].[fee_type] ([fee_type_cd]) ON DELETE CASCADE,
    CONSTRAINT [CFK_penalty_and_interest_frequency_type_cd] FOREIGN KEY ([frequency_type_cd]) REFERENCES [dbo].[penalty_interest_frequency_type] ([penalty_interest_frequency_type_cd]),
    CONSTRAINT [CFK_penalty_and_interest_ref_date_type_cd] FOREIGN KEY ([ref_date_type_cd]) REFERENCES [dbo].[penalty_interest_ref_date_type] ([penalty_interest_ref_date_type_cd]),
    CONSTRAINT [CFK_penalty_and_interest_ref_type_cd] FOREIGN KEY ([ref_type_cd]) REFERENCES [dbo].[penalty_interest_ref_type] ([penalty_interest_ref_type_cd]),
    CONSTRAINT [CFK_penalty_and_interest_type_cd] FOREIGN KEY ([type_cd]) REFERENCES [dbo].[penalty_interest_type] ([penalty_interest_type_cd]),
    CONSTRAINT [FK_penalty_and_interest_PIPT_codes] FOREIGN KEY ([penalty_interest_property_type_cd]) REFERENCES [dbo].[penalty_interest_property_type] ([penalty_interest_property_type_cd])
);


GO


create trigger tr_penalty_and_interest_delete_insert_update_MemTable
on penalty_and_interest
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
where szTableName = 'penalty_and_interest'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The second half base due date to calculate Effective type interest with', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'penalty_and_interest', @level2type = N'COLUMN', @level2name = N'begin_date_h2';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The second half base end date that the Effective type interest calculation ends on.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'penalty_and_interest', @level2type = N'COLUMN', @level2name = N'end_date_h2';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'P&I Property Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'penalty_and_interest', @level2type = N'COLUMN', @level2name = N'penalty_interest_property_type_cd';


GO

