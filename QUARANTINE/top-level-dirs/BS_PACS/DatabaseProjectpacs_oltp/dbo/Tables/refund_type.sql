CREATE TABLE [dbo].[refund_type] (
    [year]                      NUMERIC (4)    NOT NULL,
    [refund_type_cd]            VARCHAR (20)   NOT NULL,
    [refund_reason]             VARCHAR (50)   NULL,
    [interest_check]            BIT            NULL,
    [interest_to_refund_amount] NUMERIC (6, 4) NULL,
    [print_refund_letter]       INT            NULL,
    [print_refund_check]        BIT            NULL,
    [category]                  BIT            NULL,
    [modify_cd]                 VARCHAR (10)   NULL,
    [core_refund_type]          INT            CONSTRAINT [CDF_refund_type_core_refund_type] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_refund_type] PRIMARY KEY CLUSTERED ([year] ASC, [refund_type_cd] ASC),
    CONSTRAINT [CFK_refund_type_core_refund_type] FOREIGN KEY ([core_refund_type]) REFERENCES [dbo].[core_refund_type] ([id])
);


GO

create trigger [dbo].[tr_refund_type_delete_insert_update_MemTable]
on [dbo].[refund_type]
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
where szTableName = 'refund_type'

GO

