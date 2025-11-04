
CREATE PROCEDURE SetCertMailIdsEX
        --@mailer_type int,
        @batch_id int
AS 

DECLARE @serv_type varchar(5)
DECLARE @cust_id varchar(16)
DECLARE @board_qualify bit
DECLARE @generate_cm   bit
DECLARE @prot_by_id    int
DECLARE @cert_mail_cd  varchar(50)
DECLARE @case_id       int 
DECLARE @prop_val_yr   numeric(4)



--DECLARE @cert_mail_num varchar(50) 
 
SET @cert_mail_cd = NULL 



SELECT TOP 1
  @serv_type = serv_type,
  @cust_id   = cust_id
    FROM next_cert_mail_id 

DECLARE temp_curs cursor FOR
    SELECT     prot_by_id,case_id,prop_val_yr, qualify, generate_cm
    FROM certified_mailer
    WHERE  certified_mailer_batch_id = @batch_id
           and generate_cm = 1
    ORDER BY prot_by_id, prop_id  
-- 
OPEN temp_curs
FETCH NEXT FROM temp_curs into @prot_by_id,   @case_id,  @prop_val_yr,  @board_qualify, @generate_cm
 
WHILE (@@FETCH_STATUS = 0)
BEGIN
   exec CreateCertMailUse 0,@cert_mail_cd_out = @cert_mail_cd OUTPUT 

    UPDATE certified_mailer
    SET cert_mail_cd = @cert_mail_cd
       WHERE   
         certified_mailer_batch_id = @batch_id
	 AND prot_by_id                = @prot_by_id
     AND qualify                   = @board_qualify


    INSERT mail_assoc (ref_id1,ref_type,val_yr,mail_id,serv_type,cust_id,date_printed)
    VALUES (@case_id,'AP',@prop_val_yr,@cert_mail_cd,@serv_type,@cust_id,GETDATE())
 
FETCH NEXT FROM temp_curs into @prot_by_id ,@case_id ,@prop_val_yr,  @board_qualify, @generate_cm

END

CLOSE      temp_curs
DEALLOCATE temp_curs

GO

