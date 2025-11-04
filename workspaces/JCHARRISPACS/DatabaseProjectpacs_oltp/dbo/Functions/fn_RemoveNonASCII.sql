
CREATE FUNCTION dbo.fn_RemoveNonASCII   
(  
 @nstring nvarchar(255)  
)  
RETURNS varchar(255)  
AS  
BEGIN  
  
 DECLARE @Result varchar(255)  
 SET @Result = ''  
  
 DECLARE @nchar nvarchar(1)  
 DECLARE @position int  
  
 SET @position = 1  
 WHILE @position <= LEN(@nstring)  
 BEGIN  
  SET @nchar = SUBSTRING(@nstring, @position, 1)  
  --Unicode & ASCII are the same from 1 to 255.  
  --Only Unicode goes beyond 255  
  --0 to 31 are non-printable characters  
  IF UNICODE(@nchar) between 32 and 255  
   SET @Result = @Result + @nchar  
  SET @position = @position + 1  
 END  
  
 RETURN @Result  
  
END

GO

