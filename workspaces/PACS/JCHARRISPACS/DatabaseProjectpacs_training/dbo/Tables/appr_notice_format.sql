CREATE TABLE [dbo].[appr_notice_format] (
    [szDefaultForm] VARCHAR (50) NOT NULL,
    [lSequence]     INT          IDENTITY (1, 1) NOT NULL,
    [bCustomize]    BIT          CONSTRAINT [CDF_appr_notice_format_bCustomize] DEFAULT (0) NOT NULL,
    CONSTRAINT [CPK_appr_notice_format] PRIMARY KEY CLUSTERED ([szDefaultForm] ASC) WITH (FILLFACTOR = 90)
);


GO

