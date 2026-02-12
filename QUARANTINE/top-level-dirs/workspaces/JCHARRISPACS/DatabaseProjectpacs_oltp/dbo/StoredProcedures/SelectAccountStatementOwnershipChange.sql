

create procedure SelectAccountStatementOwnershipChange

@StartDate		datetime,
@EndDate		datetime,
@include_zero_balance bit

as

declare @year as int

select @year=tax_yr from pacs_system
set @EndDate = DATEADD(day, 1, @EndDate)


if @include_zero_balance = 0
begin
	select p.prop_id,p.col_owner_id,psa.sup_num
	from property as p with(nolock)
	inner join prop_supp_assoc as psa with(nolock) on
			psa.prop_id = p.prop_id
	and psa.owner_tax_yr = @year
	inner join (
		select prop_id,sum((((bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
					((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
					(bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd))))) as amt
		from bill
		with (nolock)
		where bill.active_bill = 'T'
		and bill.coll_status_cd <> 'RS'
		group by prop_id
	
	) as bill_amt on
			bill_amt.prop_id=p.prop_id
	where col_owner_update_dt >= @StartDate and col_owner_update_dt < @EndDate and amt <> 0
end
else
begin
	select p.prop_id,p.col_owner_id,psa.sup_num
	from property as p with(nolock)
	inner join prop_supp_assoc as psa with(nolock) on
			psa.prop_id = p.prop_id
	and psa.owner_tax_yr = @year
	inner join (
		select prop_id,sum((((bill.bill_adj_m_n_o + bill_adj_i_n_s) - 
					((bill.bill_m_n_o_pd + bill.bill_i_n_s_pd + discount_mno_pd + discount_ins_pd + underage_mno_pd +  underage_ins_pd) - 
					(bill.refund_m_n_o_pd + bill.refund_i_n_s_pd + bill.refund_disc_mno_pd + bill.refund_disc_ins_pd))))) as amt
		from bill
		with (nolock)
		where bill.active_bill = 'T'
		and bill.coll_status_cd <> 'RS'
		group by prop_id
	
	) as bill_amt on
			bill_amt.prop_id=p.prop_id
	where col_owner_update_dt >= @StartDate and col_owner_update_dt < @EndDate
end

GO

