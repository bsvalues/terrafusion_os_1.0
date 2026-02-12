CREATE TABLE [dbo].[_arb_inquiry_options] (
    [machine_name]                           VARCHAR (25) NOT NULL,
    [inq_gen_comp_grid]                      INT          NOT NULL,
    [inq_print_letter]                       INT          NOT NULL,
    [inq_print_appr_card]                    INT          NOT NULL,
    [inq_type]                               VARCHAR (10) NOT NULL,
    [inq_nature]                             VARCHAR (10) NOT NULL,
    [inq_by_type]                            VARCHAR (10) NOT NULL,
    [inq_status]                             VARCHAR (10) NULL,
    [inq_reopen_status]                      VARCHAR (10) NULL,
    [inq_autoclose]                          INT          NULL,
    [tax_presentation_image_type]            CHAR (10)    NULL,
    [tax_presentation_rec_type]              CHAR (10)    NULL,
    [tax_presentation_sub_type]              CHAR (10)    NULL,
    [pro_appr_meeting_type]                  VARCHAR (50) NULL,
    [mass_sched_real_res_type]               VARCHAR (50) NULL,
    [mas_sched_real_com_type]                VARCHAR (50) NULL,
    [mass_sched_personal_type]               VARCHAR (50) NULL,
    [mass_sched_mineral_type]                VARCHAR (50) NULL,
    [mass_sched_auto_type]                   VARCHAR (50) NULL,
    [appr_SchedMeetingDays]                  INT          NULL,
    [appr_SchedHearingDays]                  INT          NULL,
    [appr_auto_schedule]                     INT          NULL,
    [tax_presentation_arb_type]              CHAR (10)    NULL,
    [default_inquiry_create_year]            NUMERIC (4)  NULL,
    [default_inquiry_search_year]            NUMERIC (4)  NULL,
    [ignore_default_arb_inquiry_year_fields] BIT          NOT NULL,
    [inq_auto_create_inquiry]                BIT          NOT NULL,
    CONSTRAINT [PK__arb_inquiry_options] PRIMARY KEY CLUSTERED ([machine_name] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'This table will contain the maintenance options for boe inquiries (this table is half of the old _arb_letter_options table).', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'_arb_inquiry_options';


GO

