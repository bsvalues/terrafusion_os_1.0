
CREATE PROCEDURE BPPCAT

	@case_id int,
	@ID1 int,
	@ID2 int = NULL
as

DECLARE @prop_val_yr int
DECLARE @prot_by_id int

if @ID2 IS NULL 
	set @prop_val_yr = @ID1
else
begin
	set @prop_val_yr = @ID2
	set @prot_by_id = @ID1
end


set nocount on

declare @prop_id int


select @prop_id = prop_id
from _arb_protest
with (nolock)
where case_id = @case_id
and prop_val_yr = @prop_val_yr

create table #temp_bppcat_curr
(
	prop_id int not null,
	szCategory varchar(100) null,
	lCurrYearValue numeric(14,0) null
)

create table #temp_bppcat_last
(
	prop_id int not null,
	szCategory varchar(100) null,
	lLastYearValue numeric(14,0) null
)

create table #temp_bppcat_totals
(
	lID int not null identity(1,1),
	szCategory varchar(100) null,
	lLastYearValue numeric(14,0) null,
	lCurrYearValue numeric(14,0) null
)

insert into #temp_bppcat_curr
(prop_id, szCategory, lCurrYearValue)

select pps.prop_id, pp_type_cd, sum(pp_mkt_val)
from pers_prop_seg as pps
with (nolock)
join prop_supp_assoc as psa
with (nolock)
on pps.prop_id = psa.prop_id
and pps.prop_val_yr = psa.owner_tax_yr
and pps.sup_num = psa.sup_num
where pps.prop_id = @prop_id
and pps.prop_val_yr = @prop_val_yr
group by pps.prop_id, pps.pp_type_cd
order by pps.prop_id, pps.pp_type_cd


insert into #temp_bppcat_last
(prop_id, szCategory, lLastYearValue)

select pps.prop_id, pp_type_cd, sum(pp_mkt_val)
from pers_prop_seg as pps
with (nolock)
join prop_supp_assoc as psa
with (nolock)
on pps.prop_id = psa.prop_id
and pps.prop_val_yr = psa.owner_tax_yr
and pps.sup_num = psa.sup_num
where pps.prop_id = @prop_id
and pps.prop_val_yr = @prop_val_yr - 1
group by pps.prop_id, pps.pp_type_cd
order by pps.prop_id, pps.pp_type_cd

insert into #temp_bppcat_totals
(szCategory, lLastYearValue, lCurrYearValue)
select isnull(c.szCategory,l.szCategory) as Category, 
		isnull(lLastYearValue, 0) as LastYearValue,
		isnull(lCurrYearValue, 0) as CurrYearValue
from #temp_bppcat_curr as c
with (nolock)
left outer join #temp_bppcat_last as l
with (nolock)
on c.szCategory = l.szCategory
order by c.szCategory

insert into #temp_bppcat_totals
(szCategory, lLastYearValue, lCurrYearValue)
select 'Totals:', sum(lLastYearValue), sum(lCurrYearValue)
from #temp_bppcat_totals

select szCategory as Category, lLastYearValue as LastYearValue, lCurrYearValue as CurrYearValue
from #temp_bppcat_totals
order by lID

GO

