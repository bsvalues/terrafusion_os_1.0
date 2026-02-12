CREATE TABLE [dbo].[ptd_history] (
    [dataset_id]  BIGINT       NOT NULL,
    [year]        INT          NOT NULL,
    [sup_num]     INT          NOT NULL,
    [certified]   CHAR (1)     NOT NULL,
    [date]        DATETIME     NOT NULL,
    [error_cnt]   INT          NULL,
    [ajr_rec_cnt] INT          NULL,
    [aud_rec_cnt] INT          NULL,
    [apl_rec_cnt] INT          NULL,
    [and_rec_cnt] INT          NULL,
    [acd_rec_cnt] INT          NULL,
    [tu2_rec_cnt] INT          NULL,
    [ajr_rec_len] INT          NULL,
    [aud_rec_len] INT          NULL,
    [apl_rec_len] INT          NULL,
    [and_rec_len] INT          NULL,
    [acd_rec_len] INT          NULL,
    [tu2_rec_len] INT          NULL,
    [server_name] VARCHAR (60) NULL,
    CONSTRAINT [CPK_ptd_history] PRIMARY KEY CLUSTERED ([dataset_id] ASC)
);


GO

