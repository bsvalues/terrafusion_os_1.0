
CREATE  procedure SetChgLogUser

@input_user_id	int

as

declare @host_name	varchar(50)
declare @host_id	int

select @host_name = host_name()
select @host_id  = host_id()

if ( app_name() like '%SyncService%' )  
begin
	set @host_name = host_name() +'_SS'

	delete from chg_log_user with (ROWLOCK) where machine = @host_name
	and hostid = @host_id

	insert into chg_log_user with (ROWLOCK)
	(machine, pacs_user_id , log_changes, hostid)
	values
	(@host_name, @input_user_id, 1, @host_id)
end
else
begin

	delete from chg_log_user with (ROWLOCK) where machine = @host_name

	insert into chg_log_user with (ROWLOCK)
	(machine, pacs_user_id , log_changes, hostid) 
	values 
	(@host_name, @input_user_id, 1, @host_id)
end

GO

