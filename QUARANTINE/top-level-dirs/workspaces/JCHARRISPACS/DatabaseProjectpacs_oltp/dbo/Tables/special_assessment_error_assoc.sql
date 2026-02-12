CREATE TABLE [dbo].[special_assessment_error_assoc] (
    [dataset_id] BIGINT      NOT NULL,
    [year]       NUMERIC (4) NOT NULL,
    [agency_id]  INT         NOT NULL,
    CONSTRAINT [CPK_special_assessment_error_assoc] PRIMARY KEY CLUSTERED ([dataset_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_special_assessment_error_assoc_dataset_id] FOREIGN KEY ([dataset_id]) REFERENCES [dbo].[system_errors] ([dataset_id]) ON DELETE CASCADE
);


GO

