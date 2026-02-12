
-- sample exec
--  exec RefundLevyAmounts 4,'BGGAR,CAMGAR', 0

CREATE procedure RefundLevyAmounts
 @config_id int,
 @levy_cd_linked_list varchar(1000),
 @runid int,
 @CALCADJUSTED bit = 0
AS
SET NOCOUNT ON

declare @levy_cd table(levy_cd varchar(10))
declare @includeInterest bit
declare @begin_date datetime
declare @end_date datetime
declare @levy_year int

create table #levy_amounts
(
	primary_levy_cd varchar(10),
	amount numeric(14,2),
	interest numeric(14,2)
)

insert into @levy_cd
	select id from dbo.fn_ReturnTableFromCommaSepValues(@levy_cd_linked_list)

select 
	@includeInterest = include_interest_paid,
	@begin_date = refund_begin_dt,
	@end_date = refund_end_dt,
	@levy_year = year	
from refund_levy_config
where refund_levy_config_id = @config_id


--SQL FOR LEVY ADJUSTMENTS, OBTAINED FROM THE FISCAL YEAR RECAP YPT REPORT
if (@CALCADJUSTED = 1) 
begin

				IF object_id('tempdb..#fiscal_temp') is not null
				BEGIN 
						DROP TABLE #fiscal_temp
				END

				IF object_id('tempdb..#rlcml_temp') is not null
				BEGIN 
						DROP TABLE #rlcml_temp
				END

				SELECT MAX(fm.[begin_date]) as begin_date, 
							district_id
				INTO #fiscal_temp
				FROM fiscal_year AS fy WITH(NOLOCK)
				JOIN fiscal_month AS fm WITH(NOLOCK) 
					ON	fy.[begin_tax_year] = fm.[tax_year] AND 
							fy.[begin_tax_month] = fm.[tax_month]
				WHERE fm.begin_date <= @begin_date
				group by district_id


				select --l.primary_fund_number as fund_number, 
				rlcml.* 
				into #rlcml_temp			 
				from refund_levy_config_mapped_levy as rlcml with (nolock) 
				join #fiscal_temp as ftemp
					on rlcml.tax_district_id = ftemp.district_id
				join refund_levy_config as rlc with (nolock) 
					on rlcml.refund_levy_config_id = rlc.refund_levy_config_id									
				join @levy_cd lc
					on lc.levy_cd = rlcml.levy_cd_linked
				join levy as l with (nolock) 
					on	l.levy_cd = lc.levy_cd
					and l.year = rlc.year									
				where rlcml.refund_levy_config_id = @config_id


				SELECT 
				f.fund_number,
				--b.display_year as year,
				 SUM(
					CASE 
						WHEN tt.[core_transaction_type] = 3
							AND ISNULL(ba.[annexation_adjustment], 0) = 0 
						THEN ISNULL(pct.[base_amount], 0) 
						ELSE 0 
					END) as adjustments	

				INTO #adjustments_temp	
												
				FROM posted_coll_transaction AS pct WITH(NOLOCK)
				JOIN levy_bill_transaction_assoc as lbta WITH(NOLOCK) ON
					lbta.[posted_transaction_id] = pct.[posted_transaction_id]
				JOIN bill AS b WITH(NOLOCK) ON
					b.bill_id = pct.trans_group_id
				JOIN levy_bill AS lb WITH(NOLOCK) ON
					b.bill_id = lb.bill_id		
				JOIN fund as f with(nolock) ON
					f.[fund_id] = lbta.[fund_id]
					AND f.[year] = b.[year]																	
				JOIN #fiscal_temp as ftemp WITH(NOLOCK) ON				
							ftemp.district_id = f.tax_district_id 
					and	ftemp.district_id = lb.tax_district_id
				JOIN #rlcml_temp as rt WITH(NOLOCK) ON
							rt.tax_district_id = ftemp.district_id 
					--and rt.fund_number = f.fund_number 
					--and	rt.levy_cd_linked = lb.levy_cd
				LEFT JOIN transaction_type AS tt WITH(NOLOCK) ON
					tt.[transaction_type] = pct.[transaction_type]
				LEFT JOIN bill_adjustment AS ba WITH(NOLOCK) ON
					ba.[transaction_id] = pct.[transaction_id]
					
				WHERE
					pct.[effective_date] >= @begin_date
					AND pct.[effective_date] <= @end_date
					AND tt.core_transaction_type <> 1				
					--AND b.display_year = @levy_year
					--AND f.fund_number in (select fund_number from rlcm)
				GROUP BY
					f.fund_number
					--b.display_year

			drop table #fiscal_temp
			drop table #rlcml_temp
end					

insert into #levy_amounts
select rlcml.primary_levy_cd,
ct.base_amount_pd as amount, 
ct.other_amount_pd as interest
from refund_levy_config_mapped_levy as rlcml with (nolock) 
join refund_levy_config as rlc with (nolock) 
	on rlcml.refund_levy_config_id = rlc.refund_levy_config_id
join refund_levy_config_refund_type as rlcrt with (nolock) 
	on rlc.refund_levy_config_id = rlcrt.refund_levy_config_id
join batch as bat with (nolock) 
	on bat.balance_dt >= rlc.refund_begin_dt
    and bat.balance_dt <= rlc.refund_end_dt
join coll_transaction as ct with (nolock) 
	on ct.batch_id = bat.batch_id
join levy_bill as lb with (nolock) 
	on rlcml.primary_levy_cd = lb.levy_cd
	and ct.trans_group_id = lb.bill_id
join refund_transaction_assoc as rta with (nolock)
	on rta.transaction_id = ct.transaction_id
    and rta.refund_type_cd = rlcrt.refund_type_cd
join @levy_cd lc
	on lc.levy_cd = rlcml.levy_cd_linked
where rlcml.refund_levy_config_id = @config_id -- variable


select lc.levy_cd
into #notused
from @levy_cd lc
where lc.levy_cd not in (select distinct primary_levy_cd from #levy_amounts)

insert into #levy_amounts
select rlcml.primary_levy_cd,
0.0 as amount, 
0.0 as interest
from refund_levy_config_mapped_levy as rlcml with (nolock) 
join @levy_cd lc
	on lc.levy_cd = rlcml.levy_cd_linked
where lc.levy_cd in (
	select levy_cd from #notused
)

create table #levy_details
(
	fund_number numeric(14,0),
	taxing_district varchar(50),
	levy_desc varchar(50),
	linked_levy_desc varchar(50),
	amount numeric(14,2),
	tax_district_id int,
	primary_levy_cd varchar(10),
	levy_cd_linked varchar(10),
	refund_levy_config_id int,
	additional_amount numeric(14,2),
	adjustments numeric(14,2),
	ADREF numeric(14,2),
	difference numeric(14,2),
	year int		
)

insert into #levy_details
select l.primary_fund_number as fund_number, 
rlcml.tax_district_desc as taxing_district, 
rlcml.primary_levy_desc as levy_desc,
rlcml.linked_levy_desc as linked_levy_desc, 
case @includeInterest
	when 1 then (sum(amount) + sum(interest)) * -1
	else sum(amount) * -1
end as amount,
l.tax_district_id,
rlcml.primary_levy_cd,
rlcml.levy_cd_linked,
rlc.refund_levy_config_id,
0.0 as additional_amount,
NULL as adjustments,
NULL as ADREF,
NULL as difference,
@levy_year
from #levy_amounts la
join levy as l with (nolock) on la.primary_levy_cd = l.levy_cd
join refund_levy_config_mapped_levy as rlcml with (nolock) on 
	  l.levy_cd = rlcml.primary_levy_cd
join refund_levy_config as rlc with (nolock) on 
	  rlcml.refund_levy_config_id = rlc.refund_levy_config_id
join @levy_cd lc
	on lc.levy_cd = rlcml.levy_cd_linked
where rlcml.refund_levy_config_id = @config_id -- variable
and l.year = rlc.year
group by l.primary_fund_number, rlcml.tax_district_desc, rlcml.primary_levy_desc,
rlcml.linked_levy_desc, l.tax_district_id, rlcml.primary_levy_cd, rlcml.levy_cd_linked,
rlc.refund_levy_config_id

--UPDATE VALUES FOR LEVY ADJUSTMENTS WHEN NEEDED
if (@CALCADJUSTED = 1) 
begin
	update #levy_details
	set adjustments = at.adjustments,
	ADREF = (case when at.adjustments < 0 then
		case when (-1 * at.adjustments) > (ld.amount + ld.additional_amount) then
			-1 * at.adjustments
		else
			(ld.amount + ld.additional_amount)
		end
	else
		 (ld.amount + ld.additional_amount)
	end)
	from #levy_details as ld with(nolock)
	join #adjustments_temp as at with(nolock)
	on at.fund_number = ld.fund_number 
	--and at.year = ld.year
	

	-----------------
	update #levy_details
	set difference = (case when ld.fund_number is not null then	
			ld.ADREF - ld.amount
		else
			NULL
		end
	)
	from #levy_details as ld with(nolock)
end	

if (@runid > 0)
BEGIN
	update #levy_details
	set additional_amount = rlrd.additional_amount
	from #levy_details ld (nolock)
	join dbo.refund_levy_run_tax_district_detail rlrd (nolock)
		on ld.fund_number = rlrd.fund_number
		and rlrd.refund_levy_run_id = @runid
		and rlrd.levy_cd = ld.primary_levy_cd
		and rlrd.tax_district_id = ld.tax_district_id
		
END

select *
from #levy_details
order by fund_number, taxing_district

drop table #levy_amounts
drop table #levy_details
drop table #notused
if (@CALCADJUSTED = 1) drop table #adjustments_temp

GO

