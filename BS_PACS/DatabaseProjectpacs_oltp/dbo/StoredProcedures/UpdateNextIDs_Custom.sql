
create procedure UpdateNextIDs_Custom
	@id_name varchar(63)
as

set nocount on

	declare @maxID bigint
	
	if (@id_name = 'coll_transaction')
	begin
		select @maxID = max(transaction_id)
		from coll_transaction with(tablockx)
		set @maxID = isnull(@maxID, 0)

		declare @pendingMaxID int
		select @pendingMaxID = max(pending_transaction_id)
		from pending_coll_transaction with(tablockx)
		set @pendingMaxID = isnull(@pendingMaxID, 0)
		
		if (@pendingMaxID > @maxID)
			set @maxID = @pendingMaxID
	end
	else if (@id_name = 'payment_group_id')
	begin
		select @maxID = max(payment_group_id)
		from bill with(tablockx)
		where payment_group_id is not null
		set @maxID = isnull(@maxID, 0)
		
		declare @feeMaxID int
		select @feeMaxID = max(payment_group_id)
		from fee with(tablockx)
		where payment_group_id is not null
		set @feeMaxID = isnull(@feeMaxID, 0)
		
		if (@feeMaxID > @maxID)
			set @maxID = @feeMaxID
	end
	else if (@id_name = 'sup_group')
	begin
		select @maxID = max(sup_group_id)
		from sup_group with(tablockx)
		where sup_group_id < 32767
	end
	else if (@id_name = 'appr_company')
	begin
		select @maxID = max(appr_company_id)
		from appr_company with(tablockx)
		set @maxID = isnull(@maxID, 0)
		
		if (@maxID < 100)
			set @maxID = 100
	end
	else if (@id_name = 'land_sched_si_detail')
	begin
		select @maxID = max(ls_detail_id)
		from land_sched_si_detail with(tablockx)
		set @maxID = isnull(@maxID, 0)
		
		declare
			@lMaxSI_STD int,
			@lMaxSI_SIZ int,
			@lMaxSI_EIF int

		select @lMaxSI_STD = max(sid_detail_id)
		from slope_intercept_std_detail with(tablockx)

		select @lMaxSI_SIZ = max(sid_detail_id)
		from slope_intercept_size_detail with(tablockx)

		select @lMaxSI_EIF = max(sid_detail_id)
		from slope_intercept_eif_detail with(tablockx)

		if ( @lMaxSI_STD > @maxID )
		begin
			set @maxID = @lMaxSI_STD
		end
		if ( @lMaxSI_SIZ > @maxID )
		begin
			set @maxID = @lMaxSI_SIZ
		end
		if ( @lMaxSI_EIF > @maxID )
		begin
			set @maxID = @lMaxSI_EIF
		end
	end
	else if (@id_name = 'split_merge')
	begin
		declare @max_split_merge_id int
		declare @max_split_id int
		declare @max_merge_id int

		select @max_split_merge_id = isnull(max(split_merge_id), 0)
		from split_merge with(nolock)

		select @max_split_id = isnull(max(split_id), 0)
		from split_assoc with(nolock)

		select @max_merge_id = isnull(max(merge_id), 0)
		from merge_assoc with(nolock)
		
		if((@max_split_merge_id >= @max_split_id) and (@max_split_merge_id >= @max_merge_id))
		begin
			set @maxID = @max_split_merge_id
		end
		else if(@max_split_id >= @max_merge_id)
		begin
			set @maxID = @max_split_id
		end
		else
		begin
			set @maxID = @max_merge_id
		end
	end
		
	if (@maxID is not null)
	begin
		update next_unique_id
		set id = (@maxID + 1)
		where
			id_name = @id_name and
			id < (@maxID + 1)
	end

GO

