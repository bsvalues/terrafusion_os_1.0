CREATE PROCEDURE [dbo].[LetterList]  
  
 @system_type char(1) = '',  
 @letter_type varchar(10) = null,  
 @letter_filter varchar(20) = ''  
  
AS  
  
set nocount on  
  
 declare @tblTypes table (  
  letter_type_cd varchar(10) not null  
 )  
 if @letter_filter = ''  
 begin  
  insert @tblTypes (letter_type_cd)  
  select letter_type_cd from letter_type  
 end  
 else if @letter_filter = 'ARBITRATION'  
 begin  
  insert @tblTypes (letter_type_cd)  
  select letter_type_cd from letter_type where letter_type_cd like 'AR%'  
 end  
 else if @letter_filter = 'ARB'  
 begin  
  insert @tblTypes (letter_type_cd) values ('AI')  
  insert @tblTypes (letter_type_cd) values ('AP')  
    end  
  
 declare @systemTypesTemp table (  
  system_type_cd char(1) not null  
 )  
 if @system_type = 'B'  
 begin  
  insert @systemTypesTemp values ('A')  
        insert @systemTypesTemp values ('C')  
 end  
 else 
 begin  
  insert @systemTypesTemp values (@system_type)  
 end  
  
set nocount off  
  
    SELECT letter_name,  
   account_type.acct_type_desc,  
   letter_type,  
   letter_desc,  
   event_type.event_type_desc,  
   CONVERT(varchar(10), create_dt, 101) as create_dt,  
   letter_id,  
   'LETTER_PATH',  
   LTRIM(event_type.event_type_cd) as event_type_cd,  
   account_type.acct_type_cd,  
   letter_copies  
    
   FROM letter  
   INNER JOIN @tblTypes as tblTypes  
   ON tblTypes.letter_type_cd = letter.letter_type  
   INNER JOIN @systemTypesTemp as sysTypes  
   ON sysTypes.system_type_cd = letter.system_type  
   LEFT OUTER JOIN event_type  
   ON letter.event_type_cd = event_type.event_type_cd  
   LEFT OUTER JOIN account_type  
   ON account_type.acct_type_cd = letter.letter_type  
  
   WHERE  
   (@letter_type IS NULL OR  
    @letter_type = 'ALL' OR  
    letter.letter_type = @letter_type  
   )  
   ORDER BY letter_name  
  
  

-- ** 'End csp.LetterList.sql'



-- ** 'End 1.00.00.92_procs_edvantis.sql'

set ansi_nulls on
set ansi_padding on
set ansi_warnings on
set arithabort on
set concat_null_yields_null on
set quoted_identifier on
set numeric_roundabort off
set nocount on

GO

