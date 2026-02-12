


CREATE                PROCEDURE Get128BarCodeMapping

	@input    varchar(7),
        @type     char(1),
        @char_out char(1) OUTPUT

as

-- ************************************************************
-- This Proc translates a two character input and returns
-- the proper ascii character code for IDAutomation's
-- 128 Bar Code font. This implementation only processes type C
-- barcodes. The @type parameter above is intended to take a,
-- b, or c as an input and translate appropriately and this can
-- be implemented in the future if needed.
-- ************************************************************

declare @input_int int

if @type = 'c' or @type = 'C'
BEGIN

if @input = 'start c'
BEGIN
SELECT @char_out = CHAR(205)
END
ELSE
IF @input = 'stop'
BEGIN
SELECT @char_out = CHAR(206)
END
ELSE
IF @input = 'fnc 1'
BEGIN
SELECT @char_out = CHAR(202)
END
ELSE
BEGIN
   SELECT @input_int = CONVERT(int,@input)
   if @input_int >= 1 AND @input_int <= 94
   BEGIN
   SELECT @char_out = CHAR(@input_int + 32) -- numeric input 01-94
   END
   ELSE
   IF @input_int = 0 -- numeric input 00
   BEGIN
   SELECT @char_out = CHAR(194)
   END
   ELSE
   IF @input_int >= 95 AND @input_int <= 102 -- numeric input 95-102. (Note: numbers greater than 99 are needed for calculating the MOD 103 checksum)
   BEGIN
   SELECT @char_out = CHAR(@input_int + 100)
   END

END




END

GO

