
CREATE FUNCTION getTaxAreaNUmber
    (
      @tax_area_id int
    )
RETURNS varchar(25)
AS 
    BEGIN
        DECLARE @number AS varchar(25) ;
      
 
        SELECT TOP 1
                @number = t.tax_area_number
        FROM    tax_area as t with(nolock) 
        WHERE   t.tax_area_id = @tax_area_id
 
        RETURN  @number ;
    END

GO

