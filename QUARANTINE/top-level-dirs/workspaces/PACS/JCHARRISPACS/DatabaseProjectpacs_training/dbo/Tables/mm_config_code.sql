CREATE TABLE [dbo].[mm_config_code] (
    [mm_id]      INT          NOT NULL,
    [mm_code_id] INT          IDENTITY (1, 1) NOT NULL,
    [code_type]  VARCHAR (20) NOT NULL,
    [code]       VARCHAR (20) NOT NULL,
    [value]      VARCHAR (75) NULL,
    CONSTRAINT [CPK_mm_config_code] PRIMARY KEY CLUSTERED ([mm_id] ASC, [mm_code_id] ASC),
    CONSTRAINT [CFK_mm_config_code_mm_id] FOREIGN KEY ([mm_id]) REFERENCES [dbo].[mm_config] ([mm_id])
);


GO

