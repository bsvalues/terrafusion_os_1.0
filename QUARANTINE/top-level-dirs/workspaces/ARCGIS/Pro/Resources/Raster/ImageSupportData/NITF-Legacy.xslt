<?xml version="1.0" encoding="UTF-8"?>
<xsl:transform version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:esri="ESRI">

  <!-- NOTE: format from ArcGIS Image Service before 2.8/10.9.1 -->
  
  <!-- Root node -->
    
  <xsl:template match="esri:NITF">
      <NITF>
          <xsl:apply-templates select="esri:NITFFileHeader" />
          <xsl:apply-templates select="esri:ImageSegments" />
          <xsl:apply-templates select="esri:TextSegments" />
          <xsl:apply-templates select="esri:SymbolSegments" />
          <xsl:apply-templates select="esri:GraphicSegments" />
          <xsl:apply-templates select="esri:LabelSegments" />
          <xsl:apply-templates select="esri:DataExtensionSegments" />
      </NITF>
  </xsl:template>

  <!-- Section headers -->

  <xsl:template match="esri:NITFFileHeader|esri:ImageSegments|esri:ImageSegment|esri:TextSegments|esri:TextSegment|esri:SymbolSegments|esri:SymbolSegment|esri:GraphicSegments|esri:GraphicSegment|esri:LabelSegments|esri:LabelSegment|esri:DataExtensionSegments|esri:DataExtensionSegment">
      <Group>
          <xsl:choose>
              <xsl:when test="name() = 'NITFFileHeader'">
                  <xsl:choose>
                      <xsl:when test="esri:Field[@field='FVER'] != ''">
                          <xsl:attribute name="name">NITF File Header - <xsl:value-of select="normalize-space(esri:Field[@field='FVER'])" /> (Image Service)</xsl:attribute>
                      </xsl:when>
                      <xsl:otherwise>
                          <xsl:attribute name="name">NITF File Header (Image Service)</xsl:attribute>
                      </xsl:otherwise>
                  </xsl:choose>
                  <xsl:attribute name="shortName">Header</xsl:attribute>
                  <xsl:attribute name="icon">ISDFileHdr16</xsl:attribute>
              </xsl:when>
              <xsl:when test="name() = 'ImageSegments'">
                  <xsl:attribute name="shortName">Images</xsl:attribute>
                  <xsl:attribute name="name">Images (<xsl:value-of select="@total" />)</xsl:attribute>
                  <xsl:attribute name="icon">ISDImgSegs16</xsl:attribute>
              </xsl:when>
              <xsl:when test="name() = 'ImageSegment'">
                  <xsl:attribute name="shortName"><xsl:value-of select="@index+1" /></xsl:attribute>
                  <xsl:choose>
                      <xsl:when test="esri:Field[@field='IID1'] != ''">
                          <xsl:attribute name="name">Image <xsl:value-of select="@index+1" /> (IID1:<xsl:value-of select="normalize-space(esri:Field[@field='IID1'])" />)</xsl:attribute>
                      </xsl:when>
                      <xsl:when test="esri:Field[@field='IID'] != ''">
                          <xsl:attribute name="name">Image <xsl:value-of select="@index+1" /> (IID:<xsl:value-of select="normalize-space(esri:Field[@field='IID'])" />)</xsl:attribute>
                      </xsl:when>
                      <xsl:otherwise>
                          <xsl:attribute name="name">Image <xsl:value-of select="@index+1" /></xsl:attribute>
                      </xsl:otherwise>
                  </xsl:choose>
                  <xsl:choose>
                      <xsl:when test="number(esri:Field[@field='NBANDS']/text()) > 1">
                          <xsl:attribute name="icon">ISDLevel1MultiBnd16</xsl:attribute>
                      </xsl:when>
                      <xsl:otherwise>
                          <xsl:attribute name="icon">ISDLevel1SingleBnd16</xsl:attribute>
                      </xsl:otherwise>
                  </xsl:choose>
              </xsl:when>
              <xsl:when test="name() = 'TextSegments'">
                  <xsl:attribute name="shortName">Text</xsl:attribute>
                  <xsl:attribute name="name">Text (<xsl:value-of select="@total" />)</xsl:attribute>
                  <xsl:attribute name="icon">ISDTextSegs16</xsl:attribute>
              </xsl:when>
              <xsl:when test="name() = 'TextSegment'">
                  <xsl:attribute name="shortName"><xsl:value-of select="@index+1" /></xsl:attribute>
                  <xsl:attribute name="name">Text <xsl:value-of select="@index+1" /> (TEXTID:<xsl:value-of select="normalize-space(esri:Field[@field='TEXTID'])" />)</xsl:attribute>
                  <xsl:attribute name="icon">ISDLevel1Text16</xsl:attribute>
              </xsl:when>
              <xsl:when test="name() = 'SymbolSegments'">
                  <xsl:attribute name="shortName">Symbols</xsl:attribute>
                  <xsl:attribute name="name">Symbols (<xsl:value-of select="@total" />)</xsl:attribute>
                  <xsl:attribute name="icon">ISDSymSegs16</xsl:attribute>
              </xsl:when>
              <xsl:when test="name() = 'SymbolSegment'">
                  <xsl:attribute name="shortName"><xsl:value-of select="@index+1" /></xsl:attribute>
                  <xsl:attribute name="name">Symbol <xsl:value-of select="@index+1" /></xsl:attribute>
                  <xsl:attribute name="icon">ISDSymSegs16</xsl:attribute>
              </xsl:when>
              <xsl:when test="name() = 'GraphicSegments'">
                  <xsl:attribute name="shortName">Graphics</xsl:attribute>
                  <xsl:attribute name="name">Graphics (<xsl:value-of select="@total" />)</xsl:attribute>
                  <xsl:attribute name="icon">ISDGraphicSegs16</xsl:attribute>
              </xsl:when>
              <xsl:when test="name() = 'GraphicSegment'">
                  <xsl:attribute name="shortName"><xsl:value-of select="@index+1" /></xsl:attribute>
                  <xsl:attribute name="name">Graphic <xsl:value-of select="@index+1" /> (SID:<xsl:value-of select="normalize-space(esri:Field[@field='SID'])" />)</xsl:attribute>
                  <xsl:attribute name="icon">ISDLevel1Graphic16</xsl:attribute>
              </xsl:when>
              <xsl:when test="name() = 'LabelSegments'">
                  <xsl:attribute name="shortName">Labels</xsl:attribute>
                  <xsl:attribute name="name">Labels (<xsl:value-of select="@total" />)</xsl:attribute>
                  <xsl:attribute name="icon">ISDLabSegs16</xsl:attribute>
              </xsl:when>
              <xsl:when test="name() = 'LabelSegment'">
                  <xsl:attribute name="shortName"><xsl:value-of select="@index+1" /></xsl:attribute>
                  <xsl:attribute name="name">Label <xsl:value-of select="@index+1" /></xsl:attribute>
                  <xsl:attribute name="icon">ISDLevel1Label16</xsl:attribute>
              </xsl:when>
              <xsl:when test="name() = 'DataExtensionSegments'">
                  <xsl:attribute name="shortName">DES</xsl:attribute>
                  <xsl:attribute name="name">Data Extension Segments (<xsl:value-of select="@total" />)</xsl:attribute>
                  <xsl:attribute name="icon">ISDDESSegs16</xsl:attribute>
              </xsl:when>
              <xsl:when test="name() = 'DataExtensionSegment'">
                <xsl:variable name="DesName">
                  <xsl:choose>
                    <xsl:when test="normalize-space(esri:Field[@field='DESID']/text()) = 'CSSHPA DES'">CSSHPA - <xsl:value-of select="normalize-space(esri:Field[@field='DESSHF']/esri:Field[@field='SHAPE_USE'])"/></xsl:when>
                    <xsl:when test="normalize-space(esri:Field[@field='DESID']/text()) = 'CSATTA DES'">CSATTA - <xsl:value-of select="normalize-space(esri:Field[@field='DESSHF']/esri:Field[@field='ATT_TYPE'])"/></xsl:when>
                    <xsl:when test="normalize-space(esri:Field[@field='DESID']/text()) = 'XML_DATA_CONTENT'">XML_DATA_CONTENT - <xsl:value-of select="normalize-space(esri:Field[@field='DESSHF']/esri:Field[@field='DESSHSI'])" disable-output-escaping="yes"/></xsl:when>
                    <xsl:otherwise><xsl:value-of select="normalize-space(esri:Field[@field='DESID'])"/></xsl:otherwise>
                  </xsl:choose>
                </xsl:variable>
                
                <xsl:attribute name="shortName"><xsl:value-of select="normalize-space(esri:Field[@field='DESID'])" /></xsl:attribute>
                <xsl:attribute name="name"><xsl:value-of select="normalize-space($DesName)" /></xsl:attribute>
                <xsl:attribute name="icon">ISDLevel1DES16</xsl:attribute>
              </xsl:when>
          </xsl:choose>
          <xsl:apply-templates />
      </Group>
  </xsl:template>

  <!-- Field nodes -->

  <xsl:template match="esri:Field">
    <xsl:choose>
      <xsl:when test="child::esri:Field">
        <Group>
          <xsl:attribute name="name"><xsl:value-of select="@field" /></xsl:attribute>
          
          <!-- Handle fields under DESSHF -->
          <xsl:apply-templates select="esri:Field" />
        </Group>
      </xsl:when>

      <xsl:when test="count(./esri:TREs) > 0">
        <xsl:apply-templates select="esri:TREs" />
      </xsl:when>
      
      <xsl:when test="@field = 'DESDATA'">

          <xsl:choose>
            <!-- For DESDATA nodes where the DESID is 'XML_DATA_CONTENT', copy the XML content -->
            <xsl:when test="normalize-space(../esri:Field[@field='DESID']/text()) = 'XML_DATA_CONTENT'">
                <xsl:value-of select="." disable-output-escaping="yes"/>
            </xsl:when>

            <!-- For non-XML content, apply appropriate templates -->
            <xsl:otherwise>
              <!-- Only show a data node if there aren't any TRE's -->
              <xsl:if test="count(./esri:TREs) = 0">
                <Field>
                  <xsl:attribute name="name"><xsl:value-of select="@field" /></xsl:attribute>
                  <xsl:attribute name="fullName"><xsl:value-of select="@name" /></xsl:attribute>
                  <xsl:attribute name="size"><xsl:value-of select="@size" /></xsl:attribute>
                  <xsl:attribute name="type"><xsl:value-of select="@type" /></xsl:attribute>

                  <xsl:call-template name="dataAttributes" />
                  <xsl:value-of select="./text()"/>
                </Field>
              </xsl:if>
            </xsl:otherwise>

          </xsl:choose>
      </xsl:when>

      <xsl:otherwise>
        <Field>
          <xsl:attribute name="name"><xsl:value-of select="@field" /></xsl:attribute>
          <xsl:attribute name="fullName"><xsl:value-of select="@name" /></xsl:attribute>
          <xsl:attribute name="size"><xsl:value-of select="@size" /></xsl:attribute>
          <xsl:choose>
            <xsl:when test="contains(@name, 'Color')">
              <xsl:attribute name="type">color</xsl:attribute>
            </xsl:when>
            <xsl:when test="contains(@name, 'Date')">
              <xsl:attribute name="type">date</xsl:attribute>
            </xsl:when>
            <xsl:when test="contains(@field, 'IXSHD') and contains(@type, 'C') and contains(name(), 'Field')">
              <xsl:attribute name="type">hidden</xsl:attribute>
            </xsl:when>
            <xsl:when test="@field = 'XHD'">
              <xsl:attribute name="type">hidden</xsl:attribute>
            </xsl:when>
            <xsl:otherwise>
              <xsl:attribute name="type">string</xsl:attribute>
            </xsl:otherwise>
          </xsl:choose>

          <xsl:value-of select="."/>
        </Field>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- Data nodes -->

  <xsl:template match="esri:LabelData">
      <Field name="Label Data">
          <xsl:attribute name="name">Label</xsl:attribute>
          <Field name="Background Color" fullName="Background Color (RGB)">
              <xsl:value-of select="esri:LabelBackgroundRGBColor" />
          </Field>
          <Field name="Text Color" fullName="Text Color (RGB)">
              <xsl:value-of select="esri:LabelTextRGBColor" />
          </Field>
          <Field name="Label Cell Size" fullName="Label Cell Height/Width">
              <xsl:attribute name="units"><xsl:value-of select="esri:LabelCellHeightWidth/@unit" /></xsl:attribute>
              <xsl:value-of select="esri:LabelCellHeightWidth" />
          </Field>
          <Field name="Upper Left Position" fullName="Upper Left Corner Pixel Position (Row, Column)">
              <xsl:value-of select="esri:ULCornerCoordLabelBoundingBox/esri:ULBoundingBoxRowColumn" />
          </Field>
          <Field name="Data" fullName="Data">
              <xsl:attribute name="size"><xsl:value-of select="esri:Data/@size" /></xsl:attribute>
              <xsl:value-of select="esri:Data" />
          </Field>
      </Field>
  </xsl:template>
  
  <xsl:template name="dataAttributes">
      <xsl:choose>
          <xsl:when test="contains(@base64Encoded, 'T') or contains(esri:DATA/@base64Encoded, 'T')">
              <xsl:attribute name="type">base64</xsl:attribute>
          </xsl:when>
          <xsl:otherwise>
              <xsl:attribute name="type">external</xsl:attribute>
          </xsl:otherwise>
      </xsl:choose>
  </xsl:template>

  <xsl:template match="esri:TSData|esri:DATA">
      <Data>
          <xsl:call-template name="dataAttributes" />
          <xsl:value-of select="."/>
      </Data>
  </xsl:template>
  
  <xsl:template match="esri:CGMMetafile">
      <Group>
          <xsl:attribute name="name">Computer Graphics Metafile</xsl:attribute>
          <xsl:value-of select="."/>
      </Group>
  </xsl:template>

  <!-- TREs -->
  
  <xsl:template match="esri:TREs">
      <TREs>
          <xsl:attribute name="shortName">TREs</xsl:attribute>
          <xsl:attribute name="name">TREs (<xsl:value-of select="@total" />)</xsl:attribute>
          <xsl:attribute name="total"><xsl:value-of select="@total" /></xsl:attribute>
          <xsl:apply-templates />
      </TREs>
  </xsl:template>

  <xsl:template match="esri:TRE">
      <TRE>
          <xsl:attribute name="name"><xsl:value-of select="@tag" /></xsl:attribute>
          <xsl:attribute name="fullName"><xsl:value-of select="@name" /></xsl:attribute>
          <xsl:attribute name="icon">ISDLevel2NoEditTRE16</xsl:attribute>
          <xsl:choose>
            <xsl:when test="count(./esri:Field) = 0">
              <xsl:call-template name="dataAttributes" />
              <xsl:value-of select="esri:DATA/."/>

            </xsl:when>
            <xsl:otherwise>
              <xsl:apply-templates select="esri:Field" />
            </xsl:otherwise>
          </xsl:choose>
      </TRE>
  </xsl:template>
  
</xsl:transform>