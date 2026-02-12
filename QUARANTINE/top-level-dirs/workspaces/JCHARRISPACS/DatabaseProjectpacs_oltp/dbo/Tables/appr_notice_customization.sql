CREATE TABLE [dbo].[appr_notice_customization] (
    [notice_name]     VARCHAR (50)   NOT NULL,
    [notice_year]     NUMERIC (4)    NOT NULL,
    [notices_printed] BIT            CONSTRAINT [CDF_appr_notice_customization_notices_printed] DEFAULT (0) NOT NULL,
    [section_1_text]  VARCHAR (512)  NULL,
    [section_2_text]  VARCHAR (512)  NULL,
    [section_3_text]  VARCHAR (2048) NULL,
    [section_4_text]  VARCHAR (256)  NULL,
    [section_5_text]  VARCHAR (256)  NULL,
    [section_6_text]  VARCHAR (1024) NULL,
    [section_7_text]  VARCHAR (256)  NULL,
    CONSTRAINT [CPK_appr_notice_customization] PRIMARY KEY CLUSTERED ([notice_name] ASC, [notice_year] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_appr_notice_customization_notice_name] FOREIGN KEY ([notice_name]) REFERENCES [dbo].[appr_notice_format] ([szDefaultForm])
);


GO

