
create procedure dbo._CertMailGetOwnerCountList
	@mailer_type int,
        @batch_id  int
as
-- delete temp tables if they exist
if object_id('tempdb..#myTempCrystalTbl') is not null drop table #myTempCrystalTbl
if object_id('tempdb..#FinalTable') is not null drop table #FinalTable
if object_id('tempdb..#count_tble') is not null drop table #count_tble
if object_id('tempdb..#tempduplicatedata') is not null drop table #tempduplicatedata
--
select * into #myTempCrystalTbl 
from certified_mailer where certified_mailer_batch_id = @batch_id AND mailer_type = @mailer_type AND owner_id is not NULL 
ORDER BY cert_mail_cd, owner_id

select prot_by_id, count(*) as n_count, qualify into #count_tble 
from #myTempCrystalTbl GROUP BY prot_by_id, qualify


select certified_mailer_batch_id, prop_val_yr, mailer_type, cm.prot_by_id, cm.cert_mail_cd, ct.n_count, cm.mail_to_addr, cm.qualify
into #FinalTable From certified_mailer cm
INNER JOIN #count_tble ct  on
cm.prot_by_id = ct.prot_by_id AND
cm.qualify    = ct.qualify
where  
cm.mailer_type = @mailer_type AND
cm.certified_mailer_batch_id = @batch_id
--
--*****************************************************
select certified_mailer_batch_id, mailer_type ,prot_by_id, cert_mail_cd, n_count, mail_to_addr, qualify into #tempduplicatedata from #finaltable where 1=2
-- 
--
 


INSERT INTO #tempduplicatedata
SELECT  certified_mailer_batch_id, mailer_type ,prot_by_id, cert_mail_cd , n_count, mail_to_addr, qualify
FROM #finaltable
GROUP BY certified_mailer_batch_id, mailer_type ,prot_by_id, cert_mail_cd , n_count, mail_to_addr, qualify
HAVING COUNT(*) > 1
 


--delete the duplicates from the original table
DELETE FROM #finaltable 
FROM #finaltable
INNER JOIN #tempduplicatedata
ON  #finaltable.certified_mailer_batch_id   = #tempduplicatedata.certified_mailer_batch_id 
AND #finaltable.mailer_type  = #tempduplicatedata.mailer_type
AND #finaltable.cert_mail_cd = #tempduplicatedata.cert_mail_cd 
AND #finaltable.prot_by_id   = #tempduplicatedata.prot_by_id
AND #finaltable.mail_to_addr = #tempduplicatedata.mail_to_addr
AND #finaltable.qualify      = #tempduplicatedata.qualify
 
insert into #finaltable select certified_mailer_batch_id,0, mailer_type ,prot_by_id, cert_mail_cd,n_count, mail_to_addr, qualify from #tempduplicatedata
--*****************************************************

if (@mailer_type = 2)
begin
   select * FROM #FinalTable ORDER BY mail_to_addr, prot_by_id 
END
ELSE
BEGIN
   select * FROM #FinalTable ORDER BY cert_mail_cd, prot_by_id
END
--select * from certified_mailer

drop table #count_tble
drop table #myTempCrystalTbl
drop table #FinalTable

GO

