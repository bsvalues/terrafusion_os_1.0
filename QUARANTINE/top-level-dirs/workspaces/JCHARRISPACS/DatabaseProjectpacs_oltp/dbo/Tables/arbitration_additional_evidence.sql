CREATE TABLE [dbo].[arbitration_additional_evidence] (
    [evidence_cd]   VARCHAR (10) NOT NULL,
    [evidence_desc] VARCHAR (50) NULL,
    [sys_flag]      BIT          NULL,
    CONSTRAINT [CPK_arbitration_additional_evidence] PRIMARY KEY CLUSTERED ([evidence_cd] ASC)
);


GO

