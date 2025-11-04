
create procedure GetNextARBCaseID
	@bARBInquiry bit, /* 0 = get an inquiry case ID, 1 = get a protest case ID */
	@lYear numeric(4,0),
	@lNextCaseID int = null output,
	@bOutputRS bit = 1
as

set nocount on

	declare @maxCaseID int

	begin transaction

	if ( @bARBInquiry = 1 )
	begin


		select @maxCaseID = IsNull(max(case_id),1) + 1 from _arb_inquiry with(tablockx, holdlock) where prop_val_yr = @lYear

		select @lNextCaseID = arb_inquiry_next_case_id
		from _arb_inquiry_next_case_id with(holdlock, rowlock, updlock)
		where arb_inquiry_year = @lYear

		if ( @@rowcount = 0 )
		begin
			insert _arb_inquiry_next_case_id with(holdlock, rowlock, xlock) (
				arb_inquiry_year, arb_inquiry_next_case_id
			) values (
				@lYear, @maxCaseID + 1
			)
			set @lNextCaseID = @maxCaseID
		end
		else
		begin
			if (@maxCaseID > @lNextCaseID) set @lNextCaseID = @maxCaseID

			update _arb_inquiry_next_case_id with(holdlock, rowlock, updlock)
			set arb_inquiry_next_case_id = @lNextCaseID + 1
			where arb_inquiry_year = @lYear
		end
	end
	else
	begin
		select @maxCaseID = IsNull(max(case_id),1) + 1 from _arb_protest with(tablockx, holdlock) where prop_val_yr = @lYear

		select @lNextCaseID = arb_protest_next_case_id
		from _arb_protest_next_case_id with(holdlock, rowlock, updlock)
		where arb_protest_year = @lYear

		if ( @@rowcount = 0 )
		begin
			insert _arb_protest_next_case_id with(holdlock, rowlock, xlock) (
				arb_protest_year, arb_protest_next_case_id
			) values (
				@lYear, @maxCaseID + 1
			)
			set @lNextCaseID = @maxCaseID
		end
		else
		begin
			if (@maxCaseID > @lNextCaseID) set @lNextCaseID = @maxCaseID

			update _arb_protest_next_case_id with(holdlock, rowlock, updlock)
			set arb_protest_next_case_id = @lNextCaseID + 1
			where arb_protest_year = @lYear
		end
	end
	
	commit transaction

set nocount off

	if ( @bOutputRS = 1 )
	begin
		select lNextID = @lNextCaseID
	end

GO

