
CREATE FUNCTION fn_ParseTable(@list  nvarchar(MAX),
                                   @delim nchar(1) = N',')
RETURNS @t TABLE (str   nvarchar(4000) NOT NULL,
                  nstr  nvarchar(4000) NOT NULL) AS
BEGIN
   DECLARE @slices TABLE (slice nvarchar(4000) NOT NULL)
   DECLARE @slice nvarchar(4000),
           @textpos int,
           @maxlen  int,
           @stoppos int

   SELECT @textpos = 1, @maxlen = 4000 - 2
   WHILE datalength(@list) / 2 - (@textpos - 1) >= @maxlen
   BEGIN
      SELECT @slice = substring(@list, @textpos, @maxlen)
      SELECT @stoppos = @maxlen -
                        charindex(@delim COLLATE Slovenian_BIN2,
                                 reverse(@slice))
      INSERT @slices (slice)
         VALUES (@delim + left(@slice, @stoppos) + @delim)
      SELECT @textpos = @textpos - 1 + @stoppos + 2
      -- On the other side of the comma.
   END
   INSERT @slices (slice)
       VALUES (@delim + substring(@list, @textpos, @maxlen) + @delim)

   ;WITH stringget (str) AS (
      SELECT ltrim(rtrim(substring(s.slice, N.Number + 1,
                charindex(@delim COLLATE Slovenian_BIN2,
                          s.slice, N.Number + 1) -
                N.Number - 1)))
       FROM  Numbers N
       JOIN  @slices s
         ON  N.Number <= len(s.slice) - 1
        AND  substring(s.slice, N.Number, 1) = @delim COLLATE Slovenian_BIN2
   )
   INSERT @t (str, nstr)
      SELECT str, str
      FROM   stringget

   RETURN
END

GO

