CREATE TABLE [dbo].[special_assessment] (
    [year]                          NUMERIC (4)     NOT NULL,
    [agency_id]                     INT             NOT NULL,
    [calculate_fee]                 BIT             NOT NULL,
    [flat_fee]                      BIT             NOT NULL,
    [has_additional_fee]            BIT             NOT NULL,
    [has_flat_additional_fee]       BIT             NOT NULL,
    [fee_type_cd]                   VARCHAR (10)    NULL,
    [assessment_fee_amt]            NUMERIC (10, 2) NULL,
    [additional_fee_amt]            NUMERIC (10, 2) NULL,
    [recalculate_during_supplement] BIT             NOT NULL,
    [calc_source]                   IMAGE           NULL,
    [status_cd]                     VARCHAR (10)    NULL,
    [created_date]                  DATETIME        CONSTRAINT [CDF_special_assessment_created_date] DEFAULT (getdate()) NULL,
    [calculated_date]               DATETIME        NULL,
    [bill_create_date]              DATETIME        NULL,
    [createdby]                     VARCHAR (50)    NULL,
    [calculatedby]                  VARCHAR (50)    NULL,
    [bills_createdby]               VARCHAR (50)    NULL,
    [has_additional_fee_as_percent] BIT             CONSTRAINT [DF_special_assessment_has_additional_fee_as_percent] DEFAULT ((0)) NOT NULL,
    [additional_fee_as_percent]     NUMERIC (10, 2) NULL,
    [disburse]                      BIT             CONSTRAINT [CDF_special_assessment_disburse] DEFAULT ((0)) NOT NULL,
    [disburse_acct_id]              INT             NULL,
    [rule_id]                       INT             NULL,
    [import_or_calculate]           BIT             DEFAULT ((0)) NOT NULL,
    [end_year]                      NUMERIC (4)     NULL,
    CONSTRAINT [CPK_special_assessment] PRIMARY KEY CLUSTERED ([year] ASC, [agency_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_special_assessment_agency_id] FOREIGN KEY ([agency_id]) REFERENCES [dbo].[special_assessment_agency] ([agency_id]),
    CONSTRAINT [CFK_special_assessment_fee_type_cd] FOREIGN KEY ([fee_type_cd]) REFERENCES [dbo].[fee_type] ([fee_type_cd]),
    CONSTRAINT [CFK_special_assessment_rule_id] FOREIGN KEY ([rule_id]) REFERENCES [dbo].[calculation_rule] ([rule_id]),
    CONSTRAINT [CFK_special_assessment_status_cd] FOREIGN KEY ([status_cd]) REFERENCES [dbo].[special_assessment_status_cd] ([status_cd])
);


GO

create trigger [dbo].[tr_special_assessment_delete_insert_update_MemTable]
on special_assessment
for delete, insert, update
not for replication
as
begin

	if ( @@rowcount = 0 )
	 return
 
	set nocount on
 
	update table_cache_status with(rowlock)
	set lDummy = 0
	where szTableName = 'special_assessment'

end

GO

