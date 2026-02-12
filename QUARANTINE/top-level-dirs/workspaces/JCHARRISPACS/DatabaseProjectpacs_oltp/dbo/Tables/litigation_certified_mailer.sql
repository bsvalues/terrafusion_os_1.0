CREATE TABLE [dbo].[litigation_certified_mailer] (
    [litigation_id]           INT          NOT NULL,
    [prop_id]                 INT          NOT NULL,
    [lien_holder_id]          INT          DEFAULT ((-1)) NOT NULL,
    [certified_run_id]        INT          NOT NULL,
    [certified_mailer_number] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_litigation_certified_mailer] PRIMARY KEY CLUSTERED ([litigation_id] ASC, [prop_id] ASC, [lien_holder_id] ASC, [certified_run_id] ASC),
    CONSTRAINT [CFK_litigation_certified_mailer_litigation] FOREIGN KEY ([litigation_id]) REFERENCES [dbo].[litigation] ([litigation_id])
);


GO

