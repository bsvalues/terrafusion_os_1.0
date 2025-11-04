CREATE TABLE [dbo].[_arb_protest_options] (
    [machine_name]                           VARCHAR (25) NOT NULL,
    [pro_auto_sch]                           INT          NOT NULL,
    [pro_gen_comp_grid]                      INT          NOT NULL,
    [pro_type]                               VARCHAR (10) NOT NULL,
    [pro_status]                             VARCHAR (10) NOT NULL,
    [pro_by_type]                            VARCHAR (50) NOT NULL,
    [pro_bAssignAgentDocket]                 CHAR (1)     NULL,
    [pro_lNumDaysAutoSchedule]               INT          NULL,
    [pro_reopen_status]                      VARCHAR (10) NULL,
    [pro_autoclose]                          INT          NULL,
    [pro_auto_record]                        INT          NULL,
    [ignore_default_arb_protest_year_fields] BIT          NOT NULL,
    [default_protest_create_year]            NUMERIC (4)  NULL,
    [default_protest_search_year]            NUMERIC (4)  NULL,
    [tax_presentation_image_type]            CHAR (10)    NULL,
    [tax_presentation_rec_type]              CHAR (10)    NULL,
    [tax_presentation_sub_type]              CHAR (10)    NULL,
    [tax_presentation_arb_type]              NCHAR (10)   NULL,
    CONSTRAINT [PK__arb_protest_options] PRIMARY KEY CLUSTERED ([machine_name] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This table will contain the maintenance options for boe protests (this table is half of the old _arb_letter_options table).', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_protest_options';


GO

