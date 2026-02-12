CREATE TABLE [dbo].[levy] (
    [year]                          NUMERIC (4)      NOT NULL,
    [tax_district_id]               INT              NOT NULL,
    [levy_cd]                       VARCHAR (10)     NOT NULL,
    [end_year]                      NUMERIC (4)      NULL,
    [levy_type_cd]                  VARCHAR (10)     NULL,
    [voted]                         BIT              NULL,
    [levy_rate]                     NUMERIC (13, 10) NULL,
    [population_count_enable]       BIT              NULL,
    [population_count]              INT              NULL,
    [employee_cert_enable]          BIT              NULL,
    [employee_cert]                 DATETIME         NULL,
    [full_time_emp]                 BIT              NULL,
    [budget_received]               DATETIME         NULL,
    [budget_received_enable]        BIT              NULL,
    [budget_amount_enable]          BIT              NULL,
    [budget_amount]                 NUMERIC (14, 2)  NULL,
    [first_resolution_enable]       BIT              NULL,
    [first_resolution_date]         DATETIME         NULL,
    [second_resolution_enable]      BIT              NULL,
    [second_resolution_date]        DATETIME         NULL,
    [first_percent_enable]          BIT              NULL,
    [first_percent_amt]             NUMERIC (14, 10) NULL,
    [second_percent_enable]         BIT              NULL,
    [second_percent_amt]            NUMERIC (14, 10) NULL,
    [timber_assessed_enable]        BIT              NULL,
    [timber_assessed_cd]            VARCHAR (10)     NULL,
    [timber_assessed_full]          NUMERIC (14, 2)  CONSTRAINT [CDF_levy_timber_assessed_full] DEFAULT ((0)) NULL,
    [timber_assessed_half]          NUMERIC (14, 2)  CONSTRAINT [CDF_levy_timber_assessed_half] DEFAULT ((0)) NULL,
    [timber_assessed_roll]          NUMERIC (14, 2)  CONSTRAINT [CDF_levy_timber_assessed_roll] DEFAULT ((0)) NULL,
    [election_date]                 DATETIME         NULL,
    [election_term]                 INT              NULL,
    [voted_levy_amt]                NUMERIC (14)     NULL,
    [voted_levy_rate]               NUMERIC (13, 10) NULL,
    [certification_date]            DATETIME         NULL,
    [levy_description]              VARCHAR (50)     NULL,
    [include_in_levy_certification] BIT              DEFAULT ((0)) NOT NULL,
    [comment]                       VARCHAR (255)    NULL,
    [primary_fund_number]           NUMERIC (14)     NULL,
    [diversion_amount]              NUMERIC (14, 2)  NULL,
    [outstanding_debt]              NUMERIC (14, 2)  CONSTRAINT [CDF_levy_outstanding_debt] DEFAULT ((0)) NOT NULL,
    [outstanding_debt_as_of_date]   DATETIME         NULL,
    [copy_elec_info_pacs_user_id]   INT              NULL,
    [copy_elec_info_date]           DATETIME         NULL,
    [factor]                        NUMERIC (13, 9)  NULL,
    [first_amount_requested]        NUMERIC (14, 2)  NULL,
    [second_amount_requested]       NUMERIC (14, 2)  NULL,
    [voted_levy_is_senior_exempt]   BIT              NULL,
    [senior_levy_rate]              NUMERIC (13, 10) NULL,
    CONSTRAINT [CPK_levy] PRIMARY KEY CLUSTERED ([year] ASC, [tax_district_id] ASC, [levy_cd] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_levy_levy_type_cd] FOREIGN KEY ([levy_type_cd]) REFERENCES [dbo].[levy_type] ([levy_type_cd]),
    CONSTRAINT [CFK_levy_tax_district_id] FOREIGN KEY ([tax_district_id]) REFERENCES [dbo].[tax_district] ([tax_district_id]) ON DELETE CASCADE,
    CONSTRAINT [CFK_levy_timber_assessed_cd] FOREIGN KEY ([timber_assessed_cd]) REFERENCES [dbo].[timber_assessed_type] ([timber_assessed_type_cd])
);


GO


create trigger tr_levy_delete_insert_update_MemTable
on levy
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
where szTableName = 'levy'

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The date when a user copied election information to this levy from the tax_area_election_information_table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy', @level2type = N'COLUMN', @level2name = N'copy_elec_info_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Are senior properties exempt from this voted levy increase?', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy', @level2type = N'COLUMN', @level2name = N'voted_levy_is_senior_exempt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Oustanding debt from import', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy', @level2type = N'COLUMN', @level2name = N'outstanding_debt';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'levy factor', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy', @level2type = N'COLUMN', @level2name = N'factor';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Outstanding Debt As-Of Date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy', @level2type = N'COLUMN', @level2name = N'outstanding_debt_as_of_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Levy rate for properties with a senior exemption, if they should have a different rate', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy', @level2type = N'COLUMN', @level2name = N'senior_levy_rate';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Actual Amount Requested', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy', @level2type = N'COLUMN', @level2name = N'first_amount_requested';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The user ID of the user who copied election information to this levy from the tax_area_election_information table', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy', @level2type = N'COLUMN', @level2name = N'copy_elec_info_pacs_user_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Actual Amount Requested', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy', @level2type = N'COLUMN', @level2name = N'second_amount_requested';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Capture any diverted funds for a levy.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'levy', @level2type = N'COLUMN', @level2name = N'diversion_amount';


GO

