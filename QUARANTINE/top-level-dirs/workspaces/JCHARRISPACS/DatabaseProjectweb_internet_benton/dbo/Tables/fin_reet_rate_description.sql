CREATE TABLE [dbo].[fin_reet_rate_description] (
    [description_cd]          VARCHAR (50)  NOT NULL,
    [description]             VARCHAR (255) NOT NULL,
    [administrative_fee]      BIT           NOT NULL,
    [lnd_cnsrv_acq_and_maint] BIT           NULL,
    [affordable_housing]      BIT           NULL,
    CONSTRAINT [CPK_fin_reet_rate_description] PRIMARY KEY CLUSTERED ([description_cd] ASC)
);


GO

