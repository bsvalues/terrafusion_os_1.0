CREATE TABLE [dbo].[mobile_manager_import_detail] (
    [run_id]     INT           NOT NULL,
    [scolumn]    INT           NOT NULL,
    [srownumber] INT           NOT NULL,
    [svalue]     VARCHAR (500) NOT NULL,
    [row_type]   INT           NOT NULL,
    CONSTRAINT [PK__mobile_m__ECC509D4304DCD56] PRIMARY KEY CLUSTERED ([run_id] ASC, [srownumber] ASC, [row_type] ASC, [scolumn] ASC)
);


GO

