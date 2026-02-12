
CREATE PROCEDURE PropMortAssoc_Process

	@bGeoID bit,
	@bDeleteAll bit = 1,
	@pacs_user_id int = 1

AS

  --truncate table PropMortAssoc_dPropMort (CreateDataTbl) 

set nocount on

declare @events table (prop_id int, mortgage_co_id int, bAdd bit)


if (@bGeoID = 0)
begin
	---Remove matching lenders (mortgage_id) for updates 
	insert PropMortAssoc_dPropMort (dMortID)
	select distinct mortID
	from PropMortAssoc_PropID_Vw
	where (propID is not null) and (mortID is not null)

	insert into PropMortAssoc_DataSummary (memo)
	values('Distinct Matching Lenders: '+ltrim(str(@@ROWCOUNT)))

	if (@bDeleteAll = 1)
	begin
		insert @events (prop_id, mortgage_co_id, bAdd)
		select prop_id, mortgage_co_id, 0
		from mortgage_assoc
		join PropMortAssoc_dPropMort
		on mortgage_co_id = dMortID
		
		delete mortgage_assoc
		from mortgage_assoc 
		join PropMortAssoc_dPropMort
		on mortgage_co_id = dMortID

		insert into PropMortAssoc_DataSummary (memo)
		values(
		'Delete table mortgage_assoc by matching lenders: '
		+ltrim(str(@@ROWCOUNT))
		)
	end

	---Remove matching properties (property id) for updates

	truncate table PropMortAssoc_dPropMort

	insert into PropMortAssoc_dPropMort (dPropID)
	select distinct propID
	from PropMortAssoc_PropID_Vw
	where (propID is not null) and (mortID is not null)

	insert into PropMortAssoc_DataSummary (memo)
	values('Distinct Matching Properties: '+ltrim(str(@@ROWCOUNT)))

	insert @events (prop_id, mortgage_co_id, bAdd)
	select prop_id, mortgage_co_id, 0
	from mortgage_assoc
	join PropMortAssoc_dPropMort
	on prop_id = dPropID	

	delete mortgage_assoc
	from mortgage_assoc 
	join PropMortAssoc_dPropMort
	on prop_id = dPropID

	insert into PropMortAssoc_DataSummary (memo)
	values(
	'Delete table mortgage_assoc by matching property IDs: '
	+ltrim(str(@@ROWCOUNT))
	)

	---Determine distinct property id and mortgage id

	truncate table PropMortAssoc_dPropMort     

	insert into PropMortAssoc_dPropMort
	(dPropID,dMortID,NumPropMort)

	select distinct propID,mortID, count(*)
	from PropMortAssoc_PropID_Vw
	where (propID is not null) and (mortID is not null)
	group by propID, mortID

	---Update matching loan id to matching property id and mortgage id
	---Loan id will be overridden on duplicated property id and mortgage id 

	update PropMortAssoc_dPropMort
	set dLoanID = loanID,
		dRec = recNo
	from PropMortAssoc_dPropMort join PropMortAssoc_PropID_Vw
	on (dPropID = propID) and (dMortID = mortID)
	where (propID is not null) and (mortID is not null)

	---Update table mortgage_assoc 
	insert @events (prop_id, mortgage_co_id, bAdd)
	select dPropID, dMortID, 1
	from PropMortAssoc_dPropMort

	insert into mortgage_assoc 
	(prop_id,mortgage_co_id,mortgage_acct_id)
	select dPropID,dMortID,dLoanID
	from PropMortAssoc_dPropMort

	insert into PropMortAssoc_DataSummary (memo)
	values('Update table mortgage_assoc: '+ltrim(str(@@ROWCOUNT)))

	---Marked the loan id updated with property mortgage associations

	if exists(select * from PropMortAssoc_dPropMort
				where NumPropMort > 1)
	begin
		delete from PropMortAssoc_dPropMort
		where NumPropMort = 1

		insert into PropMortAssoc_dPropMort
		(dPropID,dMortID,dLoanID,dRec)

		select propID,mortID,loanID,recNo
		from PropMortAssoc_dPropMort 
		join PropMortAssoc_PropID_Vw
		on (dPropID = propID) and (dMortID = mortID)
		where dLoanID <> loanID

		update PropMortAssoc_dPropMort
		set dLoanID = ltrim(rtrim(dLoanID))+' *****'
		where NumPropMort is not null

		select distinct dPropID,dMortID 
		from PropMortAssoc_dPropMort

		insert into PropMortAssoc_DataSummary (memo)
		values('Duplicated Property ID and Lender Number on Update: '+
		ltrim(str(@@ROWCOUNT))
		) 
	end
	else truncate table PropMortAssoc_dPropMort
end --PropID Process

else if (@bGeoID = 1)
begin
	---Remove matching lenders (mortgage_id) for updates

	insert into PropMortAssoc_dPropMort (dMortID)
	select distinct mortID
	from PropMortAssoc_GeoID_Vw
	where (propID is not null) and (mortID is not null)

	insert into PropMortAssoc_DataSummary (memo)
	values('Distinct Matching Lenders: '+ltrim(str(@@ROWCOUNT)))

	if (@bDeleteAll = 1)
	begin
		insert @events (prop_id, mortgage_co_id, bAdd)
		select prop_id, mortgage_co_id, 0
		from mortgage_assoc
		join PropMortAssoc_dPropMort
		on mortgage_co_id = dMortID

		delete mortgage_assoc
		from mortgage_assoc join PropMortAssoc_dPropMort
		on mortgage_co_id = dMortID
	
		insert into PropMortAssoc_DataSummary (memo)
		values(
		'Delete table mortgage_assoc by matching lenders: '
		+ltrim(str(@@ROWCOUNT))
		)
	end

	---Remove matching properties (prop_id) for updates

	truncate table PropMortAssoc_dPropMort

	insert into PropMortAssoc_dPropMort (dPropID)

	select distinct propID
	from PropMortAssoc_GeoID_Vw
	where (propID is not null) and (mortID is not null)

	insert into PropMortAssoc_DataSummary (memo)
	values('Distinct Matching Properties: '+ltrim(str(@@ROWCOUNT)))

	insert @events (prop_id, mortgage_co_id, bAdd)
	select prop_id, mortgage_co_id, 0
	from mortgage_assoc
	join PropMortAssoc_dPropMort
	on prop_id = dPropID	

	delete mortgage_assoc
	from mortgage_assoc 
	join PropMortAssoc_dPropMort
	on prop_id = dPropID

	insert into PropMortAssoc_DataSummary (memo)
	values(
	'Delete table mortgage_assoc by matching property IDs: '
	+ltrim(str(@@ROWCOUNT))
	)

	---Update matching loan id to matching property id and mortgage id
	---Loan id will be overridden on duplicated property id and mortgage id 

	truncate table PropMortAssoc_dPropMort

	insert into PropMortAssoc_dPropMort
	(dPropID,dMortID,NumPropMort)

	select distinct propID,mortID, count(*)
	from PropMortAssoc_GeoID_Vw
	where (propID is not null) and (mortID is not null)
	group by propID, mortID

	update PropMortAssoc_dPropMort
	set dLoanID = loanID,
		dRec = recNo
	from PropMortAssoc_dPropMort join PropMortAssoc_GeoID_Vw
	on (dPropID = propID) and (dMortID = mortID)
	where (propID is not null) and (mortID is not null)


	---Update table mortgage_assoc

	insert @events (prop_id, mortgage_co_id, bAdd)
	select dPropID, dMortID, 1
	from PropMortAssoc_dPropMort

	insert mortgage_assoc (prop_id, mortgage_co_id, mortgage_acct_id)	
	select dPropID, dMortID, dLoanID
	from PropMortAssoc_dPropMort

	insert into PropMortAssoc_DataSummary (memo)
	values('Update table mortgage_assoc: '+ltrim(str(@@ROWCOUNT)))

	---Marked the loan id updated with property mortgage associations

	if exists(select * from PropMortAssoc_dPropMort
				where NumPropMort > 1)
	begin
		delete from PropMortAssoc_dPropMort
		where NumPropMort = 1

		insert into PropMortAssoc_dPropMort
		(dPropID,dMortID,dLoanID,dRec)
		
		select propID,mortID,loanID,recNo
		from PropMortAssoc_dPropMort 
		join PropMortAssoc_GeoID_Vw
		on (dPropID = propID) and (dMortID = mortID)
		where dLoanID <> loanID

		update PropMortAssoc_dPropMort
		set dLoanID = ltrim(rtrim(dLoanID))+' *****'
		where NumPropMort is not null

		select distinct dPropID,dMortID 
		from PropMortAssoc_dPropMort

		insert into PropMortAssoc_DataSummary (memo)
		values('Duplicated Property ID and Lender Number: '+
		ltrim(str(@@ROWCOUNT))
		) 
	end
	else truncate table PropMortAssoc_dPropMort
end

-- insert events

-- initialize, look up information that's the same for all events
declare @event_id int
declare @prop_count int
declare @pacs_user_name varchar(30)
declare @prop_id int
declare @mortgage_co_id int
declare @bAdd bit

select @prop_count = count(*) from @events
if @prop_count > 0
begin
	exec dbo.GetUniqueID 'event', @event_id output, @prop_count, 0

	select @pacs_user_name = full_name
	from pacs_user pu
	where pu.pacs_user_id = @pacs_user_id

	-- event cursor
	declare event_cursor cursor fast_forward for
	select prop_id, mortgage_co_id, bAdd
	from @events

	open event_cursor
	fetch next from event_cursor into @prop_id, @mortgage_co_id, @bAdd

	-- insert an [event] record and a linking [prop_event_assoc] record for each event
	while @@fetch_status = 0
	begin
		insert event (event_id, system_type, event_date,
			pacs_user_id, pacs_user, event_type, event_desc)
		select @event_id, 'C', getdate(), @pacs_user_id, @pacs_user_name,
			case when @bAdd = 1 then 'MORTGAGEADD' else 'MORTGAGEDEL' end,
			case when @bAdd = 1 
				then 'Mortgage Company Added: ' 
				else 'Mortgage Company Removed: ' end + 
				(select file_as_name from account a where a.acct_id = @mortgage_co_id)

		insert prop_event_assoc (prop_id, event_id)
		select @prop_id, @event_id

		set @event_id = @event_id + 1
		fetch next from event_cursor into @prop_id, @mortgage_co_id, @bAdd
	end

	close event_cursor
	deallocate event_cursor	
end


-- finished

update PropMortAssoc_DataSummary
set memo = '*** Update Processed ***'
where memo like '%Update Pending%'

GO

