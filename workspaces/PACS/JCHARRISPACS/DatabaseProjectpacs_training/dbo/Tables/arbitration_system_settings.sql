CREATE TABLE [dbo].[arbitration_system_settings] (
    [settings_id]                    INT          NOT NULL,
    [include_decision_reason]        BIT          NULL,
    [reject_letter_id]               INT          NULL,
    [request_letter_id]              INT          NULL,
    [evidence_letter_id]             INT          NULL,
    [additional_evidence_letter_id]  INT          NULL,
    [arbitrator_selection_letter_id] INT          NULL,
    [image_type]                     VARCHAR (10) NULL,
    [record_type]                    VARCHAR (10) NULL,
    [sub_type]                       VARCHAR (10) NULL,
    [arbitration_status]             VARCHAR (10) NULL,
    CONSTRAINT [CPK_arbitration_system_settings] PRIMARY KEY CLUSTERED ([settings_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CCK_arbitration_system_settings_settings_id] CHECK ([settings_id] = 0)
);


GO

