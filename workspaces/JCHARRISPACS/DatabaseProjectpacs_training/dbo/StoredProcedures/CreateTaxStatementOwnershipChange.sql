
create procedure CreateTaxStatementOwnershipChange

@StartDate		datetime,
@EndDate		datetime,
@pacs_user_id int,
@events			bit,
@include_zero_balance bit

as
set nocount on
/*

declare @year as int
declare @prop_id as int
declare @owner_id as int
declare @sup_num as int
declare @event_id as int

select @year=tax_yr from pacs_system
set @EndDate = DATEADD(day, 1, @EndDate)

delete from ##tax_statement_event_list where pacs_user_id=@pacs_user_id

if @include_zero_balance = 0
begin
	declare change cursor for
	select p.prop_id,p.col_owner_id,psa.sup_num
	from property as p with(nolock)
	inner join prop_supp_assoc as psa with(nolock) on
			psa.prop_id=p.prop_id
	and psa.owner_tax_yr=@year
	inner join (
		select prop_id,sum((((bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
					((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
					(bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd))))) as amt
		from bill
		group by prop_id
	
	) as bill_amt on
			bill_amt.prop_id=p.prop_id
	where col_owner_update_dt >= @StartDate and col_owner_update_dt < @EndDate and amt > 0
end
else
begin

	declare change cursor for
	select p.prop_id,p.col_owner_id,psa.sup_num
	from property as p with(nolock)
	inner join prop_supp_assoc as psa with(nolock) on
			psa.prop_id=p.prop_id
	and psa.owner_tax_yr=@year
	where col_owner_update_dt >= @StartDate and col_owner_update_dt < @EndDate
end

open change

fetch next 
from change into
		@prop_id,
		@owner_id,
		@sup_num

while @@fetch_status = 0
begin

	-- Get the next event id
	exec dbo.GetUniqueID 'event', @event_id output, 1, 0

	-- Create the tax statement
	exec CreateTransferPropertyTaxStmnt @year,@sup_num,@prop_id,@owner_id,@event_id,@pacs_user_id

	insert ##tax_statement_event_list
	(event_id,pacs_user_id)
	select @event_id,@pacs_user_id

	fetch next 
	from change into
			@prop_id,
			@owner_id,
			@sup_num

end

close change
deallocate change
*/

GO

