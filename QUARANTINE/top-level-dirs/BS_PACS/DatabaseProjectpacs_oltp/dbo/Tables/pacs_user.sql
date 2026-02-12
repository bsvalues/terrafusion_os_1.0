CREATE TABLE [dbo].[pacs_user] (
    [pacs_user_id]         INT          NOT NULL,
    [pacs_user_name]       VARCHAR (30) NOT NULL,
    [full_name]            VARCHAR (30) NULL,
    [description]          VARCHAR (50) NULL,
    [mru_prop_id1]         INT          NULL,
    [mru_prop_id2]         INT          NULL,
    [mru_prop_id3]         INT          NULL,
    [mru_prop_id4]         INT          NULL,
    [mru_prop_id5]         INT          NULL,
    [mru_prop_id6]         INT          NULL,
    [mru_prop_id7]         INT          NULL,
    [mru_prop_id8]         INT          NULL,
    [mru_acct_id1]         INT          NULL,
    [mru_acct_id2]         INT          NULL,
    [mru_acct_id3]         INT          NULL,
    [mru_acct_id4]         INT          NULL,
    [mru_acct_id5]         INT          NULL,
    [mru_acct_id6]         INT          NULL,
    [mru_acct_id7]         INT          NULL,
    [mru_acct_id8]         INT          NULL,
    [mru_bill_id1]         INT          NULL,
    [mru_bill_id2]         INT          NULL,
    [mru_bill_id3]         INT          NULL,
    [mru_bill_id4]         INT          NULL,
    [mru_bill_id5]         INT          NULL,
    [mru_bill_id6]         INT          NULL,
    [mru_bill_id7]         INT          NULL,
    [mru_bill_id8]         INT          NULL,
    [logon_start]          DATETIME     NULL,
    [logon_end]            DATETIME     NULL,
    [weeknd_logon_start]   DATETIME     NULL,
    [weeknd_logon_end]     DATETIME     NULL,
    [acct_exp_end]         DATETIME     NULL,
    [psw_exp_end]          DATETIME     NULL,
    [must_chg_psw]         VARCHAR (1)  NULL,
    [remote_user]          VARCHAR (1)  NULL,
    [daily_batch_id]       INT          NULL,
    [tnt_user_name]        VARCHAR (50) NULL,
    [tnt_password]         VARCHAR (50) NULL,
    [search_row_count]     NUMERIC (14) NULL,
    [last_password_chg_dt] DATETIME     NULL,
    [password_hash]        BINARY (20)  NULL,
    CONSTRAINT [CPK_pacs_user] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_pacs_user_daily_batch_id] FOREIGN KEY ([daily_batch_id]) REFERENCES [dbo].[daily_batch] ([batch_id]),
    CONSTRAINT [CUQ_pacs_user_pacs_user_name] UNIQUE NONCLUSTERED ([pacs_user_name] ASC) WITH (FILLFACTOR = 100)
);


GO



create trigger tr_pacs_user_delete_insert_update_MemTable
on pacs_user
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
where szTableName = 'pacs_user'

GO

