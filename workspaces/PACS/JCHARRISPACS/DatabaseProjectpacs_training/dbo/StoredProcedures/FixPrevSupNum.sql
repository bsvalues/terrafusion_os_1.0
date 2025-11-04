


/****** Object:  Stored Procedure dbo.FixPrevSupNum    Script Date: 11/6/2003 3:37:49 PM ******/

CREATE PROCEDURE FixPrevSupNum

AS

set nocount on

declare @prop_id		int
declare @prev_prop_id		int
declare @prop_val_yr		numeric(4,0)
declare @prev_prop_val_yr	numeric(4,0)
declare @sup_num		int
declare @seq_num		int

if object_id('tempdb..#tmp') is not null
begin
	drop table #tmp
end

if object_id('tempdb..#tmp1') is not null
begin
	drop table #tmp1
end

if object_id('_tmp_prev_supp_issue_property_val') is not null
begin
	drop table _tmp_prev_supp_issue_property_val
end

if object_id('_tmp_prev_supp_issue') is not null
begin
	drop table _tmp_prev_supp_issue
end

select pv.prop_id, pv.prop_val_yr, pv.sup_num, pv.prev_sup_num, 0 as seq_num
into #tmp
from property_val as pv with (nolock)
where pv.prop_id in
(
	select pv2.prop_id
	from property_val as pv2 with (nolock)
	where pv.prop_id = pv2.prop_id
		and pv.prop_val_yr = pv2.prop_val_yr
		and pv2.sup_num > 0
)
and pv.sup_num >= 0
order by pv.prop_id, pv.prop_val_yr, pv.sup_num

select * into _tmp_prev_supp_issue_property_val from #tmp

create clustered index idx_keys on #tmp(prop_id, prop_val_yr, sup_num)

DECLARE PREVSUPNUM INSENSITIVE SCROLL CURSOR
FOR SELECT prop_id, prop_val_yr, sup_num
FROM #tmp
ORDER BY prop_id, prop_val_yr, sup_num

OPEN PREVSUPNUM
FETCH NEXT FROM PREVSUPNUM into @prop_id, @prop_val_yr, @sup_num

set @prev_prop_id 	= @prop_id
set @prev_prop_val_yr   = @prop_val_yr
set @seq_num		= 0

WHILE (@@FETCH_STATUS = 0)
BEGIN
	IF (@prev_prop_id = @prop_id) AND (@prev_prop_val_yr = @prop_val_yr)
	BEGIN
		update #tmp set seq_num = @seq_num
		where prop_id = @prop_id
			and prop_val_yr = @prop_val_yr
			and sup_num = @sup_num

		set @seq_num = @seq_num + 1
	END
	
	FETCH NEXT FROM PREVSUPNUM into @prop_id, @prop_val_yr, @sup_num

	IF (@prev_prop_id <> @prop_id) OR (@prev_prop_val_yr <> @prop_val_yr)
	BEGIN
		set @seq_num = 0	
	END

	set @prev_prop_id = @prop_id
	set @prev_prop_val_yr = @prop_val_yr
END

CLOSE PREVSUPNUM
DEALLOCATE PREVSUPNUM

select * into #tmp1 from #tmp

update #tmp set #tmp.prev_sup_num = #tmp1.sup_num
from #tmp1
where #tmp.prop_id = #tmp1.prop_id
	and #tmp.prop_val_yr = #tmp1.prop_val_yr
	and #tmp.seq_num = #tmp1.seq_num + 1

update #tmp set prev_sup_num = 0 where sup_num = 0

select property_val.prop_id,
	property_val.prop_val_yr,
	property_val.sup_num,
	property_val.prev_sup_num,
	#tmp.prev_sup_num as correct_prev_sup_num
into _tmp_prev_supp_issue
from #tmp, property_val
where #tmp.prop_id = property_val.prop_id
	and #tmp.sup_num = property_val.sup_num
	and #tmp.prop_val_yr = property_val.prop_val_yr
	and #tmp.prev_sup_num <> property_val.prev_sup_num

update property_val
set property_val.prev_sup_num = #tmp.prev_sup_num
from #tmp
where #tmp.prop_id = property_val.prop_id
	and #tmp.sup_num = property_val.sup_num
	and #tmp.prop_val_yr = property_val.prop_val_yr
	and #tmp.prev_sup_num <> property_val.prev_sup_num

if not exists (select * from dbo.sysobjects where id = object_id(N'[dbo].[pacs_upgrades]') and OBJECTPROPERTY(id, N'IsUserTable') = 1)
BEGIN
	CREATE TABLE [dbo].[pacs_upgrades] (
		[upgrade_id] [int] IDENTITY (1, 1) NOT NULL ,
		[upgrade_dt] [datetime] NULL ,
		[upgrade_desc] [varchar] (255) NULL 
	) ON [PRIMARY]
	
	ALTER TABLE [dbo].[pacs_upgrades] WITH NOCHECK ADD 
		CONSTRAINT [DF_pacs_upgrades_upgrade_dt] DEFAULT (getdate()) FOR [upgrade_dt]
END

declare @upgrade_desc varchar(255)

set @upgrade_desc = 'PACS Stored Proc Executed: FixPrevSupNum; Packaged by ERICZ; Executed by ' + rtrim(host_name())

insert into pacs_upgrades (upgrade_desc) values (@upgrade_desc)

print 'Records Updated'
print '***************'
select * from _tmp_prev_supp_issue order by prop_id, prop_val_yr, sup_num

print 'Update Finished'
print '***************'
select * from pacs_upgrades where upgrade_desc = @upgrade_desc order by upgrade_dt desc

GO

