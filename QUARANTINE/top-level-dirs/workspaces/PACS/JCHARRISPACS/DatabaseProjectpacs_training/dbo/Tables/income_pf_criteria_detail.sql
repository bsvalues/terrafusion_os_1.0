CREATE TABLE [dbo].[income_pf_criteria_detail] (
    [criteria_id]        INT           NOT NULL,
    [detail_id]          INT           IDENTITY (1, 1) NOT NULL,
    [criteria_code_type] VARCHAR (20)  NOT NULL,
    [criteria_code]      VARCHAR (100) NOT NULL,
    CONSTRAINT [CPK_income_pf_criteria_detail] PRIMARY KEY CLUSTERED ([criteria_id] ASC, [detail_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_income_pf_criteria_detail] FOREIGN KEY ([criteria_id]) REFERENCES [dbo].[income_pf_criteria] ([criteria_id])
);


GO

