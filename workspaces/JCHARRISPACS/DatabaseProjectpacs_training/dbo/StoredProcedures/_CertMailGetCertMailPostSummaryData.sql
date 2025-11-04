

create procedure _CertMailGetCertMailPostSummaryData
	@mailer_type int,
        @batch_id  int
as

--DECLARE @batch_id as int
--DECLARE @mailer_type as int 

-------------------------------------------------------------
DECLARE @ParcelAccount   as varchar(30) 
DECLARE @Year            as int
DECLARE @MailingName     as varchar(512)
DECLARE @CertifiedNumber as varchar(30 ) 
DECLARE @post_fee        as money
DECLARE @cert_fee        as money
DECLARE @receipt_fee     as money
-------------------------------------------------------------
--select @batch_id = 66
--select @mailer_type = 0 
-------------------------------------------------------------
if object_id('tempdb..#myTempTable') is not null drop table #myTempTable
select cm.*, pf.postage_fee , pf.certified_fee  , pf.receipt_fee  into #myTempTable 
      FROM certified_mailer cm, postal_fees pf  where 1=2
-------------------------------------------------------------
--ALTER TABLE #myTempTable ADD Postage_fee as money 
--ALTER TABLE #myTempTable ADD Cert_fee as money   
--ALTER TABLE #myTempTable ADD Receipt_fee as money  

-------------------------------------------------------------
DECLARE Uniques CURSOR  FOR 
     SELECT DISTINCT cert_mail_cd from certified_mailer where certified_mailer_batch_id = @batch_id and mailer_type = @mailer_type
OPEN Uniques
FETCH NEXT FROM Uniques INTO @CertifiedNumber

WHILE @@FETCH_STATUS = 0 
BEGIN 
	INSERT INTO #myTempTable  
		SELECT TOP 1 cm.*, pf.postage_fee , pf.certified_fee , pf.receipt_fee FROM certified_mailer cm, postal_fees pf
		WHERE cert_mail_cd = @CertifiedNumber AND pf.type = @mailer_type
                      
	FETCH NEXT FROM Uniques INTO @CertifiedNumber
END
CLOSE Uniques
DEALLOCATE Uniques 

if (@mailer_type=0)
BEGIN
	select * from #myTempTable ORDER BY agent_id, mail_to_addr, prop_id
END
ELSE	
BEGIN
	select * from #myTempTable ORDER BY  mail_to_addr, prop_id
END


drop table #myTempTable

GO

