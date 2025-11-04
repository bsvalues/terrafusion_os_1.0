# Modified version of exifdump.py, written by Thierry Bousch <bousch@topo.math.u-psud.fr>
# Public Domain

from __future__ import print_function, unicode_literals, absolute_import

# Exif information decoder
import os
import arcpy


def char_value(x):
    if isinstance(x, int):
        return x
    else:
        return ord(x)


def CreateBadPhotosTable(badphotostable, longestpath):
    arcpy.CreateTable_management(os.path.dirname(badphotostable), os.path.basename(badphotostable))
    # Add single Photo field to store the path of the photo that is missing GPS coordinates
    arcpy.AddField_management(badphotostable, "Photo", "TEXT", "", "", longestpath)
    # If table is dbf or arcinfo table, an unnecessary field "Field1" will have been added. Delete it
    delfields = [field.name for field in arcpy.ListFields(badphotostable) if not field.required and field.name != "Photo"]
    if delfields:
        arcpy.DeleteField_management(badphotostable, delfields)


def ListPhotos(folder):
    # Iterate recursively, finding photo files and passing them to the GenXYZ function
    l = []
    for (dirpath, dirnames, filenames) in os.walk(folder):
        for file in (f for f in filenames if os.path.splitext(f)[1].lower() in ('.tiff', '.tif', '.jpg', '.jpeg')):
            l.append(os.path.join(dirpath, file))
    l.sort()
    return l


class PhotoExifObj(object):
    """Object that contains Exif metadata properties extracted from a
       photo file: file (path), x (lon), y (lat), z (alt), and m (DateTime)"""
    def __init__(self, filename):
        self.file = filename
        self.x    = None
        self.y    = None
        self.z    = 0.0
        self.d    = -9999
        self.m    = ""

    def __repr__(self):
        """ Nice representation for debugging  """
        return '<PhotoExifObj object filename={}, x={}, y={}, z={}, d={}, m={}>'.format(
                                 self.file, self.x, self.y, self.z, self.d, self.m )

    def setLatLong(self, gpsdict):
        #import pdb;pdb.set_trace()
        lat = (float(gpsdict[2][0].num) / gpsdict[2][0].den) + \
              ((float(gpsdict[2][1].num) / gpsdict[2][1].den) * (float(1) / 60)) + \
              ((float(gpsdict[2][2].num) / gpsdict[2][2].den) * (float(1) / 3600))
        lat = -lat if gpsdict.get(1) == b"S" else lat

        lon = (float(gpsdict[4][0].num) / gpsdict[4][0].den) + \
              ((float(gpsdict[4][1].num) / gpsdict[4][1].den) * (float(1) / 60)) + \
              ((float(gpsdict[4][2].num) / gpsdict[4][2].den) * (float(1) / 3600))
        lon = -lon if gpsdict.get(3) == b"W" else lon

        # We assume that coords are in lat/lon, output fc is in GCS
        #  therefore, we need to check that within xy bounds for CS
        #  else we have problems later
        if not (-400 < lon < 400):
            lon = None
        if not (-400 < lat < 400):
            lat = None

        self.y = lat
        self.x = lon

    def setZ(self, gpsdict):
        try:
            alt = float(gpsdict[6][0].num) / gpsdict[6][0].den
        except:
            alt = None
        self.z = alt

    def setD(self, gpsdict):
        try:
            direction = list(gpsdict[17])[0].num/float(list(gpsdict[17])[0].den)
        except:
            direction = -9999
        self.d = direction

    def isAllSet(self):
        if None in (self.x, self.y, self.z, self.m, self.d):
            return False
        return True

    def getExifInfoFromFile(self, filename=None):
        if filename:
            self.file = filename
        pic = open(self.file, "rb")
        #  two cases: tif and jpg
        data = pic.read(4)
        while True:
            try:
                if data[0:4] == b"II*\x00" or data[0:4] == b"MM*\x00":
                    pic.seek(0)
                    data = pic.read()
                else:
                    pic.seek(0)
                    if pic.read(2) != b"\xff\xd8":
                        break
                    marker = pic.read(2)
                    if marker == b"\xff\xe0":
                        length = char_value(pic.read(1)) * 256 + char_value(pic.read(1))
                        pic.read(length - 2)
                        marker = pic.read(2)
                    if char_value(marker[0]) == 255:
                        if char_value(marker[1]) < 224 or char_value(marker[1]) >239:
                            break
                    else:
                        break
                    header = pic.read(8)
                    if header[2:6] != b"Exif" or header[6:8] != b"\x00\x00":
                        pic.seek(0)
                        exifHeaderLoc = pic.read().find(b"Exif")
                        if exifHeaderLoc > -1:
                            pic.seek(0)
                            header = pic.read()[exifHeaderLoc-2:exifHeaderLoc+6]
                            pic.seek(0)
                            pic.read(exifHeaderLoc+6)
                        else:
                            break
                    length = char_value(header[0]) * 256 + char_value(header[1])
                    data = pic.read(length-8)

                T = TIFF_file(data)
                L = T.list_IFDs()
                for i in range(len(L)):
                    IFD = T.dump_IFD(L[i])
                    exif_off = gps_off = 0

                    for tag,type,values in IFD:
                        if tag == 0x8769:
                            exif_off = values[0]
                        if tag == 0x8825:
                            gps_off = values[0]
                        if tag == 0x0132:
                            self.m = values

                    if exif_off:
                        d = {}
                        IFD = T.dump_IFD(exif_off)
                        for tag in IFD:
                            d[tag[0]] = tag[2]
                            if tag[0] == 0x9003:
                                datetime = d[0x9003]
                                self.m = datetime
                    if gps_off:
                        IFD = T.dump_IFD(gps_off)
                        gpsdict = {}
                        for each in IFD:
                            gpsdict[each[0]] = each[2]

                        self.setLatLong(gpsdict)
                        self.setZ(gpsdict)
                        self.setD(gpsdict)

                    if self.isAllSet():
                        break
            except Exception as e:
                pass
            finally:
                break


def GetExifMetadata(filename):
    """Function that reads Exif metadata properties from a photo file and returns
       an object with properties: file (path), x (lon), y (lat), z (alt),
       and m (DateTime)"""

    photo = PhotoExifObj(filename)
    photo.getExifInfoFromFile()
    return photo


def s2n_motorola(str):
    x = 0
    for c in str:
        x = (x << 8) | char_value(c)
    return x


def s2n_intel(str):
    x = 0
    y = 0
    for c in str:
        x |= char_value(c) << y
        y += 8
    return x


class Fraction:
    def __init__(self, num, den):
        self.num = num
        self.den = den

    def __repr__(self):
        # String representation
        return '%d/%d' % (self.num, self.den)


class TIFF_file:
    def __init__(self, data):
        self.data = data
        self.endian = data[0]

    def s2n(self, offset, length, signed=0):
        slice = self.data[offset:offset+length]
        if char_value(self.endian) == char_value(b'I'):
            val = s2n_intel(slice)
        else:
            val = s2n_motorola(slice)
        # Sign extension ?
        if signed:
            msb = 1 << (8*length - 1)
            if val & msb:
                val -= msb << 1
        return val

    def first_IFD(self):
        return self.s2n(4, 4)

    def next_IFD(self, ifd):
        entries = self.s2n(ifd, 2)
        return self.s2n(ifd + 2 + 12 * entries, 4)

    def list_IFDs(self):
        i = self.first_IFD()
        a = []
        while i:
            a.append(i)
            i = self.next_IFD(i)
        return a

    def dump_IFD(self, ifd):
        entries = self.s2n(ifd, 2)
        a = []
        for i in range(entries):
            entry = ifd + 2 + 12*i
            tag = self.s2n(entry, 2)
            type = self.s2n(entry+2, 2)
            if not 1 <= type <= 10:
                continue  # not handled
            typelen = [1, 1, 2, 4, 8, 1, 1, 2, 4, 8][type-1]
            count = self.s2n(entry+4, 4)
            offset = entry+8
            if count*typelen > 4:
                offset = self.s2n(offset, 4)
            if type == 2:
                # Special case: nul-terminated ASCII string
                values = self.data[offset:offset+count].split(b'\x00', 1)[0]
            else:
                values = []
                signed = (type == 6 or type >= 8)
                for j in range(count):
                    if type % 5:
                      # Not a fraction
                        value_j = self.s2n(offset, typelen, signed)
                    else:
                        # The type is either 5 or 10
                        value_j = Fraction(self.s2n(offset,   4, signed),
                                           self.s2n(offset+4, 4, signed))
                    values.append(value_j)
                    offset += typelen
            # Now "values" is either a string or an array
            a.append((tag, type, values))
        return a
