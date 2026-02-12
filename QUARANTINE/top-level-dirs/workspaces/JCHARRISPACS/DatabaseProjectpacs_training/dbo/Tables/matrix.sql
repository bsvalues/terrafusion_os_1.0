CREATE TABLE [dbo].[matrix] (
    [matrix_id]          INT             NOT NULL,
    [matrix_yr]          NUMERIC (4)     NOT NULL,
    [label]              VARCHAR (20)    NULL,
    [axis_1]             VARCHAR (20)    NULL,
    [axis_2]             VARCHAR (20)    NULL,
    [matrix_description] VARCHAR (50)    NULL,
    [operator]           VARCHAR (20)    NULL,
    [default_cell_value] NUMERIC (16, 2) NULL,
    [bInterpolate]       BIT             NULL,
    [matrix_type]        VARCHAR (20)    NULL,
    [matrix_sub_type_cd] VARCHAR (10)    NULL,
    CONSTRAINT [CPK_matrix] PRIMARY KEY CLUSTERED ([matrix_id] ASC, [matrix_yr] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_matrix_matrix_yr_operator] FOREIGN KEY ([matrix_yr], [operator]) REFERENCES [dbo].[matrix_operator] ([matrix_yr], [operator_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_matrix_yr_label]
    ON [dbo].[matrix]([matrix_yr] ASC, [label] ASC) WITH (FILLFACTOR = 90);


GO


create trigger tr_matrix_delete_insert_update_MemTable
on matrix
for delete, insert, update
not for replication
as
 
if ( @@rowcount = 0 )
begin
	return
end
 
set nocount on
 
update table_cache_status with(rowlock)
set lDummy = 0
where szTableName = 'matrix'

if update(label)
begin
	update table_cache_status with(rowlock)
	set lDummy = 0
	where szTableName = 'income_sched_imprv_detail_matrix_assoc'
end

GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Matrix Sub Type', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'matrix', @level2type = N'COLUMN', @level2name = N'matrix_sub_type_cd';


GO

