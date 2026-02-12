CREATE TABLE [dbo].[supplement] (
    [sup_tax_yr]       NUMERIC (4) NOT NULL,
    [sup_num]          INT         NOT NULL,
    [sup_group_id]     INT         NOT NULL,
    [levy_cert_run_id] INT         NULL,
    CONSTRAINT [CPK_supplement] PRIMARY KEY CLUSTERED ([sup_tax_yr] ASC, [sup_num] ASC, [sup_group_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_supplement_sup_group_id] FOREIGN KEY ([sup_group_id]) REFERENCES [dbo].[sup_group] ([sup_group_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_sup_group_id]
    ON [dbo].[supplement]([sup_group_id] ASC) WITH (FILLFACTOR = 90);


GO



create trigger tr_supplement_delete_insert_update_MemTable
on supplement
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
where szTableName = 'supplement'

GO


/*
 * This trigger is here to trap for the situation where for whatever reason,
 * the sup_num = 0 row is missing from the supplement table.  There should
 * ALWAYS be a sup_num = 0 row in the supplement table for each year in the
 * pacs_year table.
 * 
 * If the year is not present in the pacs_year table, it may be removed.
 */

create trigger tr_supplement_delete_SupNum0
on supplement
for delete
not for replication
as
 
if ( @@rowcount = 0 )
begin
     return
end
 
set nocount on

declare @foundError bit
declare @sup_tax_yr numeric(4,0)
declare @sup_num int

set @foundError = 0

declare curRows cursor
for
	select sup_tax_yr, sup_num
	from deleted
for read only

open curRows

fetch next from curRows into @sup_tax_yr, @sup_num

while @@fetch_status = 0
begin
	if @sup_num = 0
	begin
		if exists(select tax_yr
							from pacs_year
							with (nolock)
							where tax_yr = @sup_tax_yr)
		begin
			set @foundError = 1
		end
	end

	fetch next from curRows into @sup_tax_yr, @sup_num
end

close curRows
deallocate curRows

if @foundError = 1
begin
	raiserror('Deletions that would cause [supplement] to no longer have a zero supplement in a year are not allowed.', 18, 1)
	rollback transaction
end

GO


/*
 * This really should not happen, but do not allow the sup_num of the
 * supplement table to be updated. A row can be deleted or inserted,
 * but not updated.
 */

create trigger tr_supplement_update_SupNum0
on supplement
for update
not for replication
as

set nocount on

if update(sup_num)
begin
	if exists(
		select 1 from deleted
		where sup_num = 0
	)
	begin
		rollback transaction
		raiserror('Updates that would cause [supplement] to no longer have a zero supplement in a year are not allowed.', 18, 1)
	end
end

GO

