
CREATE Procedure dbo.sp_BillTaxAreaId_ReturnTable
(
	@balanceDt datetime
)
--RETURNS @TaxArea Table (bill_id int, prop_id int, year numeric(4,0), transaction_id, tax_area_id int)
AS
BEGIN

	-- create a 'working' table that we can update with data
	create table #working
	(
		bill_id int,
		prop_id int,
		[year] numeric(4, 0),
		transaction_id int,
		tax_area_id int
	)

	if( @balanceDt is null )
	begin
		-- In this case, we simply want the most current tax_Area_id for a bill
		-- regardless of date
		
		-- 1. Select the tax_area_id associated with the levy_bill record at the time it was created
		insert into #working
			(bill_id, prop_id, [year], tax_area_id)
		select distinct 
			b.bill_id, b.prop_id, b.year, lb.tax_area_id 
		from levy_bill as lb with(nolock)
		join bill as b with(nolock) on
			b.bill_id = lb.bill_id

		create index #ix_working on #working(bill_id)

		-- 2. Update the tax_area_id for any bills that might have had a bill_adjustment that changed the tax area
		update #working
		set tax_area_id = ba.tax_area_id
		from #working as w
		join bill_adjustment as ba with(nolock) on
				ba.bill_id = w.bill_id
			and ba.tax_area_id is not null -- exclude any adjustments where tax_area_id wasn't recorded (such as Bill Fee Code Change)
			and ba.transaction_id is not null
		join (
			select max(bill_adj_id) as bill_adj_id, ba.bill_id
			from bill_adjustment as ba with(nolock)
			join #working as w on
				w.bill_id = ba.bill_id
			where ba.tax_area_id is not null -- exclude any adjustments where tax_area_id wasn't recorded (such as Bill Fee Code Change)
			and ba.transaction_id is not null
			group by ba.bill_id
		) as max_ba on
			max_ba.bill_id = ba.bill_id
			and max_ba.bill_adj_id = ba.bill_adj_id
	end
	else
	begin
		-- We need to record a tax_area_id per transaction
		-- 1. Get a list of all the transactions that occurred on the balance_dt
		select ct.transaction_id, ct.trans_group_id, batch.balance_dt 
		into #tmpctz
		from coll_transaction as ct with (nolock)
		join batch with (nolock) on batch.batch_id = ct.batch_id
		where batch.balance_dt = @balanceDt

		create index #ndx_tmpctz on #tmpctz (trans_group_id)

		-- 2. Get levy_bill data associated with those transactions
		insert into #working
			(bill_id, prop_id, [year], transaction_id, tax_area_id)
		select distinct 
			b.bill_id, b.prop_id, b.year, ct.transaction_id, lb.tax_area_id 
		from levy_bill as lb with (nolock)
		join bill as b with (nolock) on
				b.bill_id = lb.bill_id
		join #tmpctz as ct on
				ct.trans_group_id = b.bill_id

		create index #ix_working on #working(bill_id, transaction_id)

		-- For now, we are assuming that no more than ONE adjustment that changes the tax area
		-- will ever exist for a given day.  If it ever turns out that this is not necessarily the case,
		-- then the code below will have to change to use a cursor to walk through the bill_adjustment
		-- records one at a time and update the working table.
	
		-- 3. Update the tax_area_id from bill_adjustments making sure to update the tax_area_id
		--	  for all transactions occurring on or after the transaction_id for the adjustment.
		--	  a. The initial query assumes levy_bill.tax_area_id is correct.  This is *not* true if an 
		--		 annexation already occurred prior to the balance_dt.  So we need to update records to 
		--		 reflect that first:
		update #working
		set tax_area_id = ba.tax_area_id
		from #working as w
		join bill_adjustment as ba with(nolock) on
				ba.bill_id = w.bill_id
			and ba.tax_area_id is not null
			and ba.transaction_id is not null
		join (
			-- Use a join sub-query to limit matching bill_adjustment records to 1 per bill_id
			-- using only those bill_adjustments that have a non-null tax_area_id
			select w.bill_id, max(bill_adj_id) as bill_adj_id
			from #working as w
			join bill_adjustment as ba with (nolock) on
					ba.bill_id = w.bill_id
				and ba.tax_area_id is not null
			join coll_transaction as ct with (nolock) on
					ct.transaction_id = ba.transaction_id
			join batch as b with (nolock) on 
					b.batch_id = ct.batch_id
			where b.balance_dt < @balanceDt
			group by w.bill_id 
		) as ba_max on
			ba_max.bill_id = w.bill_id and ba_max.bill_adj_id = ba.bill_adj_id
			
		--	 b. Now update all transactions including and subsequent to any bill_adjustment that changed the tax area
		--		has a non-null tax_area_id
		update #working
		set tax_area_id = ba.tax_area_id
		from #working as w
		join (
			-- Use a join sub-query to limit matching bill_adjustment records to 1 per bill_id
			-- using only those bill_adjustments that have a non-null tax_area_id
			select 
				w.bill_id, 
				max(ba.transaction_id) as transaction_id
			from #working as w
			join bill_adjustment as ba with (nolock) on
					ba.bill_id = w.bill_id
				and ba.tax_area_id is not null
				and ba.transaction_id is not null
			join batch as b with (nolock) on 
					b.batch_id = ba.batch_id
			where b.balance_dt = @balanceDt
			and ba.transaction_id is not null
			group by w.bill_id
		) as ba_max on
				ba_max.bill_id = w.bill_id 
			and w.transaction_id >= ba_max.transaction_id
		join bill_adjustment as ba with (nolock) on
				ba.bill_id = w.bill_id
			and ba.transaction_id = ba_max.transaction_id
	end

	select * from #working
END

GO

