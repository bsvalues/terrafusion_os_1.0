CREATE procedure tt
as

--select top 10 * from property_exemption where exmpt_tax_yr=2010

--exec tt

declare @xxx varchar(100),@prop_id varchar(10),@year int,@sup int
set @prop_id=263377
set @year=2010
set @sup=0
print @prop_id

exec @xxx = fn_getexemptions @prop_id,@year,@sup
print @xxx 
print 'done'

--drop table #tmp
--select pv.prop_id,pv.abs_subdv_cd,pv.market,pv.assessed_val,pe.exmpt_type_cd
--into #tmp
--from property_val pv with (nolock)
--
--      left outer join property_exemption pe with (nolock)
--
--      on pv.prop_id = pe.prop_id
--
--      and pv.prop_val_yr = pe.exmpt_tax_yr
--
--      and pe.exmpt_tax_yr = pe.owner_tax_yr
--
--where prop_val_yr in(2010)
--and pv.prop_id=263377
--
--select * from #tmp
--
--select prop_id,abs_subdv_cd,market,dbo.fn_getexemptions(t.prop_id,2010,0) as exemptions
--from #tmp t

GO

