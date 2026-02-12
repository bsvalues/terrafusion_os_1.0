# COPYRIGHT 2023 ESRI
#
# TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
# Unpublished material - all rights reserved under the
# Copyright Laws of the United States.
#
# For additional information, contact:
# Environmental Systems Research Institute, Inc.
# Attn: Contracts Dept
# 380 New York Street
# Redlands, California, USA 92373
#
# email: contracts@esri.com

import os
import shutil
from enum import IntEnum as _IntEnum
import json

from arcgisscripting import (
    arcio as _arcio,
    arciodirentry as _arciodirentry,
    arciofile as _arciofile,
    arciofileopen as _arciofileopen,
    arciopathtype as _arciopathtype,
)


def _is_cloudstorage_path(path=None):
    from arcgisscripting import is_cloudstorage_path

    return is_cloudstorage_path(path)


def _get_arcio_engine(path=None, engine=None):
    engine_dict = {"file": _LocalIO, "cloud": _CloudIO}

    if engine is not None:
        if isinstance(engine, str):
            return engine_dict[engine]
    else:
        if path is not None:
            if _is_cloudstorage_path(path):
                return _CloudIO
            else:
                return _LocalIO
        else:
            return _LocalIO
    return None


class CloudPathType(_IntEnum):
    """
    Defines Path styles for cloud paths.
    Possible options -
     -  CloudPathType.VSI
     -  CloudPathType.ACS
     -  CloudPathType.HTTP
     -  CloudPathType.CLOUDSTORES

    """

    VSI = _arciopathtype.VSI
    ACS = _arciopathtype.ACS
    HTTP = _arciopathtype.HTTP
    CLOUDSTORES = _arciopathtype.CLOUDSTORES

class _LocalScandirIterator:
    def __init__(self, dir_entry=None):
        self._dir_entry = dir_entry

    def __iter__(self):
        return self

    def __next__(self):
        dir_entry_obj = self._dir_entry.__next__()
        return AIODirEntry.new(dir_entry_obj, False, None)


class _CloudScandirIterator:
    def __init__(self, dir_entry=None, type=None):
        self._dir_entry = dir_entry
        self._type = type

    def __iter__(self):
        return self

    def __next__(self):
        dir_entry_obj = self._dir_entry.__next__()
        return AIODirEntry.new(dir_entry_obj, True, self._type)


class AIOScandirIterator:
    def __init__(self):
        raise TypeError("Cannot create 'AIOScandirIterator' instances.")

    @classmethod
    def new(cls, dir_entry, is_cloud=False, type=None):
        class_obj = object.__new__(cls)
        class_obj._arcio_iterator_engine = None
        class_obj._arcio_iterator_engine_obj = None
        if is_cloud:
            class_obj._arcio_diriterator_engine = _CloudScandirIterator
            class_obj._arcio_diriterator_engine_obj = _CloudScandirIterator(
                dir_entry=dir_entry, type=type
            )
        else:
            class_obj._arcio_diriterator_engine = _LocalScandirIterator
            class_obj._arcio_diriterator_engine_obj = _LocalScandirIterator(
                dir_entry=dir_entry
            )
        return class_obj

    def __iter__(self):
        return self

    def __next__(self):
        return self._arcio_diriterator_engine_obj.__next__()


class CloudDirEntryOp:
    def __init__(self):
        """

            Class contains methods to get the file path and other file attributes of a directory entry that are cloud specific.

        .. note ::
            This class is not created by users directly. An instance of this class is
            returned by cloud property of the AIODirEntry object.
        """
        raise TypeError("Cannot create 'CloudDirEntryOp' instances.")

    @classmethod
    def new(cls, cloud_dir_entry):
        class_obj = object.__new__(cls)
        class_obj._cloud_dir_entry = cloud_dir_entry
        class_obj._vsi_path = class_obj._cloud_dir_entry.getvsipath()
        class_obj._acs_path = class_obj._cloud_dir_entry.getpath(CloudPathType.ACS)
        class_obj._http_path = class_obj._cloud_dir_entry.getpath(CloudPathType.HTTP)
        class_obj._cs_path = class_obj._cloud_dir_entry.getpath(CloudPathType.CLOUDSTORES)

        return class_obj

    def getvsipath(self):
        """
            Gets absolute path of the entry in VSI format.

            Returns: (str) absolute VSI path

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            for item in cloud_io.scandir("list", depth=0):
                print(item.cloud.getvsipath())
        """

        return self._vsi_path

    def getpath(self, type=CloudPathType.VSI):
        """
            Gets absolute path of the entry in CloudPathType format.

            Arguments:
            type  : (optional) CloudPathType : (default) CloudPathType.VSI
                    -- Path style for returned URI (only for cloud)

            Returns: (bytes or str) binary or text will be returned depending on open flags

        .. code-block:: python

            # Usage Example

            from arcpy import CloudPathType
            cloud_io = AIO("C:\\data\\datacloud.acs")
            for item in cloud_io.scandir("list", depth=0):
                print(item.cloud.getpath(CloudPathType.ACS))

        """
        if (type == CloudPathType.VSI):
            return self._vsi_path
        elif (type == CloudPathType.ACS):
            return self._acs_path
        elif (type == CloudPathType.HTTP):
            return self._http_path
        elif (type == CloudPathType.CLOUDSTORES):
            return self._cs_path


class _LocalDirEntry:
    def __init__(self, dir_entry=None):
        self._dir_entry = dir_entry

    def close(self):
        raise RuntimeError("close is not available on the local AIODirEntry")

    @property
    def name(self):
        return self._dir_entry.name

    @property
    def path(self):
        return self._dir_entry.path

    def is_dir(self):
        return self._dir_entry.is_dir()

    def is_file(self):
        return self._dir_entry.is_file()

    def stat(self):
        os_stat = self._dir_entry.stat()
        return os_stat


class _CloudDirEntry:
    def __init__(self, dir_entry=None, type=CloudPathType.VSI):
        self._dir_entry = dir_entry
        self._type = type

        self._name = self._dir_entry.getname()
        self._path = self._dir_entry.getpath(type=self._type)
        self._is_dir = self._dir_entry.isdirectory()
        self._is_file = self._dir_entry.isfile()
        os_stat = self._dir_entry.stat()
        self._os_stat = os.stat_result(
            [
                os_stat[0],
                os_stat[1],
                os_stat[2],
                os_stat[3],
                os_stat[4],
                os_stat[5],
                os_stat[6],
                os_stat[7],
                os_stat[8],
                os_stat[9],
            ]
        )

    def close(self):
        return self._dir_entry.close()

    @property
    def name(self):
        return self._name

    @property
    def path(self):
        return self._path

    def is_dir(self):
        return self._is_dir

    def is_file(self):
        return self._is_file

    def stat(self):
        return self._os_stat

class AIODirEntry:
    def __init__(self):
        """

            Class contains methods that can be used to get the file path and other file attributes of a directory entry.

        .. note ::
            This class is not created by users directly. An instance of this class is
            generated by scandir() in AIO class to expose the file path and other file attributes of a directory entry.
        """
        raise TypeError("Cannot create 'AIODirEntry' instances.")

    @classmethod
    def new(cls, dir_entry, is_cloud=False, type=None):
        class_obj = object.__new__(cls)
        class_obj._arcio_direntry_engine = None
        class_obj._arcio_direntry_engine_obj = None
        if is_cloud:
            class_obj._arcio_direntry_engine = _CloudDirEntry
            class_obj._arcio_direntry_engine_obj = _CloudDirEntry(
                dir_entry=dir_entry, type=type
            )
            class_obj._cloud = CloudDirEntryOp.new(class_obj._arcio_direntry_engine_obj._dir_entry)
        else:
            class_obj._arcio_direntry_engine = _LocalDirEntry
            class_obj._arcio_direntry_engine_obj = _LocalDirEntry(dir_entry=dir_entry)
        return class_obj

    @property
    def cloud(self):
        """
            Returns an instance of a class that has cloud specific methods.
            This instance can be used to retrieve details that are specific to cloudstores.

            Returns: CloudDirEntryOp object

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            for item in cloud_io.scandir("list", depth=0):
                print(item.cloud.getvsipath())

        """
        if self._arcio_direntry_engine is _CloudDirEntry:
            return self._cloud
        else:
            raise RuntimeError(
                "cloud property is available only on AIODirEntry object based on cloudstore."
            )

    def close(self):
        """
            Close the iterator.(Only for cloud AIO)

            Returns: None

        .. code-block:: python

            # Usage Example


            cloud_io = AIO("C:\\data\\datacloud.acs")
            for item in cloud_io.scandir("list", depth=0):
                print(item.path)
                item.close()

        """
        return self._arcio_direntry_engine_obj.close()

    @property
    def name(self):
        """
            Gets the entry's base filename, relative to the scandir() path argument

            Returns: (str)

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            for item in cloud_io.scandir("list", depth=0):
                print(item.name)

            # Usage Example 2

            local_io = AIO("c:\\data")
            for item in local_io.scandir("aio", -1):
                print(item.name)

        """
        return self._arcio_direntry_engine_obj.name

    @property
    def path(self):
        """
             Gets absolute path of the entry in the type specified in scandir method

             Returns: (str)

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            for item in cloud_io.scandir("list", depth=0):
                print(item.path)

            # Usage Example 2

            local_io = AIO("C:\\data")
            for item in local_io.scandir("aio", -1):
                print(item.path)

        """
        return self._arcio_direntry_engine_obj.path

    def is_dir(self):

        """
            Checks if an entry is directory.

            Returns: (bool) True if directory else False


        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            for item in cloud_io.scandir("list", depth=0):
                print(item.is_dir())

            # Usage Example 2

            local_io = AIO("c:\\data")
            for item in local_io.scandir("aio", -1):
                print(item.is_dir())

        """
        return self._arcio_direntry_engine_obj.is_dir()

    def is_file(self):

        """
            Checks if an entry is file.

            Returns: (bool) True if file else False

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            for item in cloud_io.scandir("list", depth=0):
                print(item.is_file())

            # Usage Example 2

            local_io = AIO("c:\\data")
            for item in local_io.scandir("aio", -1):
                print(item.is_file())

        """
        return self._arcio_direntry_engine_obj.is_file()

    def stat(self):

        """
            Gets stat result of the entry.

            Returns: Return os stat_result object

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            for item in cloud_io.scandir("list", depth=0):
                ob = item.stat()
                print(ob.st_mode)

            # Usage Example 2

            local_io = AIO("C:\\data")
            for item in local_io.scandir("aio", -1):
                ob = item.stat()
                print(ob.st_mode)

        """
        return self._arcio_direntry_engine_obj.stat()


class CloudOp:
    def __init__(self):
        """

            Class contains IO methods that are cloud specific.


        .. note ::
            This class is not created by users directly. An instance of this class is
            returned by cloud property of the AIO object.
        """
        raise TypeError("Cannot create 'CloudOp' instances.")

    @classmethod
    def new(cls, cloud_arcio):
        class_obj = object.__new__(cls)
        class_obj._cloud_arcio = cloud_arcio

        return class_obj

    def clearcache(self, path):
        """
          Clears in memory directory listing, file properties and blob region cache.
          Needs to be done when an external process updates cloud folders or files we accessed before.
          (Available only for cloud)

          Arguments:
           path : str
                    -- relative path from current working directory or absolute (absolute VSI for cloud) path

          Returns: None

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.clearcache("aio")

        """
        return self._cloud_arcio.clearcache(path=path)

    def getendpoint(self):

        """
            Gets the cloud endpoint specified in the connection.
            (Available only for cloud)

            Arguments:
            path : str
                    -- relative path from current working directory or absolute (absolute VSI for cloud) path

            Returns: (str) endpoint, if available or empty.

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.getendpoint()

        """
        return self._cloud_arcio.getendpoint()

    def getfile(self, src, dst, options=None):
        """
          Downloads a file from cloud.
          (Available only for cloud)

          Arguments:
          src : str
                    -- relative path from current working directory or absolute VSI path
          dst : str
                    -- local path
          options : (optional) dict of str KVP : (default) {"RECURSIVE":"YES", "SYNC_STRATEGY":"OVERWRITE", "NUM_THREADS":"10", "CHUNK_SIZE":"8"}
                   -- RECURSIVE=[YES|NO], SYNC_STRATEGY=[TIMESTAMP|ETAG|OVERWRITE], NUM_THREADS=(integer) CHUNK_SIZE=(integer) [x-amz-*|x-goog-*|x-ms-*=(value)]

          Returns: (bool) True if success else False

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.getfile("utf8_test.json", "C:\\data\\datafile.json")

        """
        if options is None:
            options = {}
        return self._cloud_arcio.getfile(source=src, target=dst, options=options)

    def getbucketname(self):

        """
            Gets the name of connected bucket/container

            (Available only for cloud)

            Returns: (str) Bucket Name

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.getbucketname()

        """
        return self._cloud_arcio.getbucketname()

    def getmetadata(self, path, domain):

        """
          Gets metadata for a file or folder.

          (Available only for cloud)

          Arguments:
          path : str
                   -- relative path from current working directory or absolute (absolute VSI for cloud) path
          domain : str
                   -- specify metadata domain (https://gdal.org/api/cpl.html#_CPPv418VSIGetFileMetadataPKcPKc12CSLConstList)

          Returns: dict

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.getmetadata("aio", domain="HEADERS")

        """
        if domain is None:
            raise RuntimeError("domain parameter cannot be None")
        res = self._cloud_arcio.getmetadata(path=path, domain=domain)
        if isinstance(res, str):
            res = json.loads(res)
        return res

    def getobjectstorepath(self):
        """
            Gets the root path of connection (bucket + [/folder]).

            (Available only for cloud)

            Returns: (str) VSI Path to object store.

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.getobjectstorepath()

        """
        return self._cloud_arcio.getobjectstorepath()

    def getproperties(self, path):
        """
              Gets HEADER properties

              (Available only for cloud)

              Arguments:
              path : str
                     -- relative path from current working directory or absolute (absolute VSI for cloud) path


              Returns: dict

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.getproperties("aio")

        """
        res = self._cloud_arcio.getproperties(path=path)
        if isinstance(res, str):
            res = json.loads(res)
        return res

    def getprovidername(self):
        """
          Gets the cloud provider name.

          (Available only for cloud)

          Returns: (str) Provider Name

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.getprovidername()

        """
        return self._cloud_arcio.getprovidername()

    def getprovideroptions(self):
        """
          Gets list of provider options specified in the connection.

          (Available only for cloud)

          Returns: (list of str tuple), provider options, if available or empty

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.getprovideroptions()

        """

        return self._cloud_arcio.getprovideroptions()

    def getregion(self):
        """
          Gets the cloud region specified in the connection

          (Available only for cloud)

          Returns: (str) region, if available or empty

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.getregion()

        """
        return self._cloud_arcio.getregion()

    def getsignedurl(self, path, expiry, upload=False):
        """
          Generates a temperory HTTP pre-signed URL

          (Available only for cloud)

          Arguments:
          path : str
                   -- relative path from current working directory or absolute vsi path
          expiry: int
                   -- expiry in seconds.
          upload: (optional) bool. Default False. If True, the URL will be generated for upload.
          Returns: (str) HTTP signed URL

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.getsignedurl("data.json", 5)

        """
        return self._cloud_arcio.getsignedurl(path=path, expiry=expiry, upload=upload)

    def putfile(self, src, dst, options=None):
        """
          Uploads a file to cloud.

          (Available only for cloud)

          Arguments:
          src : str
                   -- local path
          dst : str
                   -- relative path from current working directory or absolute vsi path
          options : (optional) dict of str KVP : (default) {"RECURSIVE":"YES", "SYNC_STRATEGY":"OVERWRITE", "NUM_THREADS":"10", "CHUNK_SIZE":"8"}
                   -- RECURSIVE=[YES|NO], SYNC_STRATEGY=[TIMESTAMP|ETAG|OVERWRITE], NUM_THREADS=(integer) CHUNK_SIZE=(integer) [x-amz-*|x-goog-*|x-ms-*=(value)]

          Returns: (bool) True if success else False

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.putfile("C:\\data\\data_file.json", "data_folder\\data_file_new.json")

        """
        if options is None:
            options = {}
        return self._cloud_arcio.putfile(source=src, target=dst, options=options)

    def setmetadata(self, path, domain=None, metadata=None, options=None):
        """
          Set metadata for a file or folder.

          (Available only for cloud)

          Arguments:
          path : str
                   -- relative path from current working directory or absolute (absolute VSI for cloud) path
          domain : str
                   -- specify metadata domain (https://gdal.org/api/cpl.html#_CPPv418VSISetFileMetadataPKc12CSLConstListPKc12CSLConstList)
          metadata: dict of str KVP
                   -- metadata
          options: (optional) dict of str KVP
                   -- options

          Returns: (bool) True if success else False

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.setmetadata("cog.tif", "HEADERS", {"x-amz-id-2": "HxM4BcALW+HnJ13owxzMpeQXXI59VKK3I9zujbqyLBCinCt6prnzKXR4Ixhb/AloFVJLGtuqKG7nSLCLaxObTw==",
                                                             "x-amz-request-id": "KYTDPC2WH2ZQK2D2",
                                                             "Date": "Tue, 13 Jun 2023 13:39:33 GMT",
                                                             "Last-Modified": "Wed, 16 Sep 2020 13:49:34 GMT",
                                                             "ETag": ""c220c099c46c60703de0c55763d04371"",
                                                             "x-amz-meta-s3b-last-modified": "20171213T210220Z",
                                                             "Content-Disposition": "attachment",
                                                             "Accept-Ranges": "bytes",
                                                             "Content-Range": "bytes 0-16383/4339079",
                                                             "Content-Type": "text/plain",
                                                             "Server": "AmazonS3",
                                                             "Content-Length": "4545"})

        """

        if domain is None:
            domain = ""

        if metadata is None:
            metadata = {}

        if options is None:
            options = {}

        return self._cloud_arcio.setmetadata(
            path=path, domain=domain, metadata=metadata, options=options
        )

    def validate(self, certificate=False, stat=False, list=False, read=False, modify=False, path=None):
        """
          Test the Cloud connection for various file operations. Available permissions maybe granular
          depending on server ACL configuration.

          (Available only for cloud)

          Arguments:
          certificate: (optional) bool
                   -- verify SSL cerificate and OCSP certificate check
          stat: (optional) bool
                   -- Test stat on root container or connected folder
          list: (optional) bool
                   -- Test list directory access
          read: (optional) bool
                   -- Test read file permission
          modify: (optional) bool
                   -- Test write and delete permission. If delete acesss is denied a test file will remain on the cloud.
          path: (optional) str
                   -- file used for read test, if omitted then first entry from current directory listing is chosen


          Returns: (list of str tuple) Results of the test and detailed error message if available.

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.validate(True, True, True, True)

        """
        if path is None:
            path = ""

        return self._cloud_arcio.validate(
            certificate=certificate, stat=stat, list=list, read=read, modify=modify, path=path
        )

_cwd = None

class _LocalIO:
    def __init__(self, path=None):
        global _cwd
        if path is None:
            if _cwd is None:
                _cwd = os.getcwd()
            else:
                os.chdir(_cwd)
        else:
            _cwd = os.getcwd()
            os.chdir(path)

        self._path = path

    def _get_abs_path(self, path):
        return os.path.abspath(path)

    def chdir(self, path):
        abs_path = self._get_abs_path(path)
        os.chdir(abs_path)
        self._path = abs_path

    def copy(self, src, dst, options=None):
        return shutil.copy2(self._get_abs_path(src), self._get_abs_path(dst))

    def copytree(self, src, dst, options=None):
        return shutil.copytree(self._get_abs_path(src), self._get_abs_path(dst))

    def close(self, handle=None):
        return handle.close()

    def exists(self, path):
        return os.path.exists(self._get_abs_path(path))

    def getatime(self, path):
        return os.path.getatime(self._get_abs_path(path))

    def getctime(self, path):
        return os.path.getctime(self._get_abs_path(path))

    def getcwd(self, type=CloudPathType.VSI):
        return os.getcwd()

    def getmtime(self, path):
        return os.path.getmtime(self._get_abs_path(path))

    def getpath(self, path, type=None):
        return self._get_abs_path(path)

    def getsize(self, path):
        return os.path.getsize(self._get_abs_path(path))

    def isdir(self, path):
        return os.path.isdir(self._get_abs_path(path))

    def isfile(self, path):
        return os.path.isfile(self._get_abs_path(path))

    def listdir(self, path=None, type=None):
        if path is None:
            path = self._path
        return os.listdir(self._get_abs_path(path))

    def mkdir(self, path):
        return os.mkdir(self._get_abs_path(path))

    def makedirs(self, path):
        return os.makedirs(self._get_abs_path(path))

    def open(self, path, mode=None, encoding=None, mime=None):
        if "b" in mode:
            encoding = None

        res = open(file=path, mode=mode, encoding=encoding)
        file_obj = AIOFile.new(res, is_cloud=False)
        return file_obj

    def remove(self, path):
        return os.remove(path=self._get_abs_path(path))

    def removefiles(self, paths=None):
        failed_paths = []

        for path in paths:
            if os.path.isfile(self._get_abs_path(path)):
                try:
                    os.remove(path=self._get_abs_path(path))
                except Exception as e:
                    failed_paths.append(path)

        return failed_paths

    def rename(self, src=None, dst=None):
        return os.rename(self._get_abs_path(src), self._get_abs_path(dst))

    def rmtree(self, path):
        return shutil.rmtree(path=self._get_abs_path(path))

    def scandir(self, path, depth=None, type=None):
        def arbitrary_scan_directory(path, depth):
            results = []
            for ele in os.scandir(path):
                if ele.is_file():
                    results.append(ele)
                elif ele.is_dir() and depth > 0:
                    results.append(ele)
                    results.extend(arbitrary_scan_directory(ele.path, depth - 1))
                elif ele.is_dir() and depth == 0:
                    results.append(ele)

            return results

        scan_dir_obj = None
        if depth > 0:
            scan_dir_obj = arbitrary_scan_directory(self._get_abs_path(path), depth)
        elif depth == -1:
            scan_dir_obj = arbitrary_scan_directory(
                self._get_abs_path(path), float("inf")
            )
        elif depth == 0:
            scan_dir_obj = os.scandir(self._get_abs_path(path))
        else:
            raise RuntimeError("Invalid value for depth")

        return AIOScandirIterator.new(scan_dir_obj, False, None)


class _CloudIO:
    def __init__(self, path=None):
        self._path = path
        self._cloud_io = _arcio(self._path)

    def chdir(self, path):
        return self._cloud_io.chdir(path)

    def copy(self, src, dst, options=None):
        copied = self._cloud_io.copy(source=src, target=dst, options=options)
        if copied:
            return dst
        else:
            raise RuntimeError("Failed to copy")

    def copytree(self, src, dst, options=None):
        copied = self._cloud_io.copytree(source=src, target=dst, options=options)
        if copied:
            return dst
        else:
            raise RuntimeError("Failed to copy")

    def close(self, handle=None):
        return handle.close()

    def exists(self, path):
        return self._cloud_io.exists(path=path)

    def getatime(self, path):
        raise RuntimeError("getatime method is not available for cloud file IO")

    def getctime(self, path):
        raise RuntimeError("getctime method is not available for cloud file IO")

    def getcwd(self, type=CloudPathType.VSI):
        return self._cloud_io.getcwd(type=type)

    def getmtime(self, path):
        return self._cloud_io.getmtime(path=path)

    def getpath(self, path, type=CloudPathType.VSI):
        return self._cloud_io.getpath(path=path, type=type)

    def getsize(self, path):
        return self._cloud_io.getsize(path=path)

    def isdir(self, path):
        return self._cloud_io.isdir(path=path)

    def isfile(self, path):
        return self._cloud_io.isfile(path=path)

    def listdir(self, path=None, type=CloudPathType.VSI):
        if path is None:
            path = ""
        return self._cloud_io.listdir(path=path, type=type)

    def mkdir(self, path):
        dir_path = os.path.dirname(self._cloud_io.getpath(path, CloudPathType.VSI))
        exists = self._cloud_io.exists(dir_path)
        if not exists:
            raise RuntimeError("Path does not exists")
        dir_created = self._cloud_io.mkdir(path=path)
        if dir_created:
            return None
        else:
            raise RuntimeError("Failed to create directory")

    def makedirs(self, path):
        dir_created = self._cloud_io.makedirs(path=path)
        if dir_created:
            return None
        else:
            raise RuntimeError("Failed to create directory")

    def open(self, path, mode=None, encoding=None, mime=None):
        if mode is None:
            mode = ""
        if mime is None:
            mime = {}

        res = self._cloud_io.open(path=path, mode=mode, encoding=encoding, mime=mime)
        file_obj = AIOFile.new(res, is_cloud=True)
        return file_obj

    def remove(self, path):
        removed = self._cloud_io.remove(path=path)

        if removed:
            return None
        else:
            raise RuntimeError("Failed to remove  - " + str(path))

    def removefiles(self, paths=None):
        return self._cloud_io.removefiles(paths=paths)

    def rename(self, src=None, dst=None):
        renamed = self._cloud_io.rename(oldname=src, newname=dst)

        if renamed:
            return None
        else:
            raise RuntimeError("Failed to rename  - " + str(src))

    def rmtree(self, path):
        dir_deleted = self._cloud_io.rmdir(path=path)
        if dir_deleted:
            return None
        else:
            raise RuntimeError("Failed to delete tree")

    def scandir(self, path, depth=0, type=CloudPathType.VSI):
        scan_dir_obj = self._cloud_io.scandir(path=path, depth=depth, type=type)

        return AIOScandirIterator.new(scan_dir_obj, True, type)


class AIO:
    def __init__(self, path=None):
        """
        AIO is a class for handling local and cloud files in a unified way.

        .. code-block:: python

        # Usage Example 1 - To create an AIO object based on cloudstore

        cloud_io = AIO("C:\\data\\datacloud.acs")
        cloud_io.getcwd()
        cloud_io.listdir("aio") # arcio is a virtual folder in the cloudstore referred in datacloud.acs

        # Usage Example 2 - To create an AIO object based on local file system

        local_io = AIO()
        local_io.getcwd() # will return the current working directory


        # Usage Example 3 - To create an AIO object based on local file system with path parameter

        local_io = AIO("C:\\data") # will set the current working directory as C:\\data
        local_io.getcwd() # will return the current working directory that is C:\\data

        """
        if isinstance(path, dict):
            arcio_class =  _CloudIO
            path = json.dumps(path)
        else:
            arcio_class = _get_arcio_engine(path)

        self._arcio_engine = None
        self._arcio_engine_obj = None
        if arcio_class is not None:
            self._arcio_engine = arcio_class
            self._arcio_engine_obj = arcio_class(path=path)
        else:
            raise RuntimeError("Invalid input path")

    @property
    def cloud(self):
        """
            Returns an instance of a class that has cloud specific methods.
            This instance can be used to retrieve details of the cloudstore with which the AIO object was created.

            Returns: CloudOp object

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.cloud.getprovidername()

        """
        if self._arcio_engine is _CloudIO:
            cloud = CloudOp.new(self._arcio_engine_obj._cloud_io)
            return cloud
        else:
            raise RuntimeError(
                "cloud property is available only on AIO object based on cloudstore."
            )

    def chdir(self, path):
        """
          Changes the current working directory relative to current.

          Arguments:
           path : str
                    -- relative path from current working directory or absolute (absolute VSI for cloud) path

          Returns: None

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.chdir("aio") # relative path

            # Usage Example 2

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.chdir("/vsis3/u-agu/arcio") # absolute VSI path

            # Usage Example 3

            local_io = AIO("C:\\data")
            local_io.chdir("aio")

        """
        return self._arcio_engine_obj.chdir(path)

    def close(self, handle=None):
        """
          Closes the file handle

          Arguments:
           handle : (AIOFile)
                    -- an opened file handle to be closed

          Returns: None

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            rcsfile = cloud_io.open("testfile.txt", "r")
            rcsfile.read(size=4)
            cloud_io.close(rcsfile)

        """
        return self._arcio_engine_obj.close(handle=handle)

    def copy(self, src, dst, options=None):
        """
            Copies a file from src to dst.

            For cloud based AIO object -
               -  If src or dst is local path, use absolute local path.
               -  If src or dst is cloud path, relative path from current working directory or absolute vsi cloud path.
               -  If src and dst are cloud paths, use absolute vsi cloud paths.

            For local AIO object -
               -  src and dst can be relative path from current working directory or absolute path.

            Arguments:
            src : str
                    -- Source path
            dst : str
                    -- Target path
            options : (optional) dict of str key value pair for cloud IO : (default) {"RECURSIVE":"YES", "SYNC_STRATEGY":"OVERWRITE", "NUM_THREADS":"10", "CHUNK_SIZE":"8"}
                    -- RECURSIVE=[YESNO], SYNC_STRATEGY=[TIMESTAMPETAGOVERWRITE], NUM_THREADS=(integer) CHUNK_SIZE=(integer) [x-amz-*x-goog-*x-ms-*=(value)]


            Returns: (string) the destination path

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.copy("/vsis3/u-agu/list/utf8_test.json", "/vsis3/u-agu/list/new_dir_new/utf8_test.json")

            # Usage Example 2

            local_io = AIO("C:\\data")
            local_io.copy("C:\\data\\datatest.json", "C:\\data_temp\\datatest.json")

        """
        if options is None:
            options = {}
        return self._arcio_engine_obj.copy(src=src, dst=dst, options=options)

    def copytree(self, src, dst, options=None):

        """
            Copies the contents from one directory to another.

            For cloud based AIO object -
               -  If src or dst is local path, use absolute local path.
               -  If src or dst is cloud path, relative path from current working directory or absolute vsi cloud path.
               -  If src and dst are cloud paths, use absolute vsi cloud paths.

            For local AIO object -
               -  src and dst can be relative path from current working directory or absolute path.

            Arguments:
            src : str
                    -- Source path
            dst : str
                    -- Target path
            options : (optional) dict of str key value pair for cloud IO : (default) {"RECURSIVE":"YES", "SYNC_STRATEGY":"OVERWRITE", "NUM_THREADS":"10", "CHUNK_SIZE":"8"}
                    -- RECURSIVE=[YESNO], SYNC_STRATEGY=[TIMESTAMPETAGOVERWRITE], NUM_THREADS=(integer) CHUNK_SIZE=(integer) [x-amz-*x-goog-*x-ms-*=(value)]


            Returns: (string) the destination path

        .. code-block:: python

            # Usage Example 1

            local_io = AIO("C:\\data")
            local_io.copytree("C:\\data\\list", "C:\\data\\data_new_dir")

        """
        if options is None:
            options = {}
        return self._arcio_engine_obj.copytree(src=src, dst=dst, options=options)

    def exists(self, path):
        """
            Checks if a path exists or not.

            Arguments:
            path : str
                    -- relative path from current working directory or absolute (absolute VSI for cloud) path
            Returns: (bool) True if directory or file exists else False.

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.exists("C:\\data\\datacloud.acs\\data")

        """
        return self._arcio_engine_obj.exists(path=path)

    def getatime(self, path):
        """
            Gets the file access time for a file. (Not available for cloud)

            Arguments:
            path : str
                    -- Path for which the access time needs to be obtained.
                       Relative path from current working directory or absolute path
            Returns: access time

        .. code-block:: python

            # Usage Example 1

            local_io = AIO("C:\\data")
            local_io.getatime("data.json")

        """
        return self._arcio_engine_obj.getatime(path=path)

    def getctime(self, path):
        """
            Gets the file creation time for a file. (Not available for cloud)

            Arguments:
            path : str
                    -- Path for which the creation time needs to be obtained.
                       Relative path from current working directory or absolute path

            Returns: creation time

        .. code-block:: python

            # Usage Example 1

            local_io = AIO("C:\\data")
            local_io.getctime("data.json")

        """
        return self._arcio_engine_obj.getctime(path=path)

    def getcwd(self, type=CloudPathType.VSI):
        """
           Gets the current working directory.

            Arguments:
            type  : (optional) CloudPathType. Path style for returned URI (only for cloud).
                    Default is CloudPathType.VSI.
                    Possible options -
                       -  CloudPathType.VSI
                       -  CloudPathType.ACS
                       -  CloudPathType.HTTP
                       -  CloudPathType.CLOUDSTORES

            Returns: (str) Current working directory.

        .. code-block:: python

            # Usage Example 1

            local_io = AIO()
            local_io.getcwd()

            # Usage Example 2

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.getcwd()

        """
        return self._arcio_engine_obj.getcwd(type=type)

    def getmtime(self, path):
        """
          Gets the file modification time for a file.

          Arguments:
          path : str
                   -- relative path from current working directory or absolute (absolute VSI for cloud) path

          Returns: (int) unix time

        .. code-block:: python

            # Usage Example 1

            local_io = AIO("C:\\data")
            local_io.getmtime("data.json")

            # Usage Example 2

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.getmtime("data.json")

        """
        return self._arcio_engine_obj.getmtime(path=path)

    def getpath(self, path, type=CloudPathType.VSI):
        """
              Construct a URI path.

              Arguments:
              path : (optional) str
                       -- relative path from current working directory or absolute (absolute VSI for cloud) path
              type  : (optional) CloudPathType. Path style for returned URI (only for cloud).
                      Default is CloudPathType.VSI.
                      Possible options -
                        -  CloudPathType.VSI
                        -  CloudPathType.ACS
                        -  CloudPathType.HTTP
                        -  CloudPathType.CLOUDSTORES

              Returns: (str) Constructed URI path

        .. code-block:: python

            # Usage Example 1

            from arcpy import CloudPathType
            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.getpath("cog.tif", CloudPathType.HTTP)

        """
        return self._arcio_engine_obj.getpath(path=path, type=type)

    def getsize(self, path):
        """
          Gets the size of a file.

          Arguments:
          path : str
                   -- relative path from current working directory or absolute (absolute VSI for cloud) path

          Returns: (int) File Size.

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.getsize("cog.tif")

        """

        return self._arcio_engine_obj.getsize(path=path)

    def isdir(self, path):
        """
          Checks if a path is a directory.

          Arguments:
          path : str
                   -- relative path from current working directory or absolute (absolute VSI for cloud) path

          Returns: (bool) True if directory exists else False.

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.isdir("cog")

        """
        return self._arcio_engine_obj.isdir(path=path)

    def isfile(self, path):
        """
          Checks if a path is a file.

          Arguments:
          path : str
                   -- relative path from current working directory or absolute (absolute VSI for cloud) path

          Returns: (bool) True if file exists else False.

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.isfile("cog")

        """
        return self._arcio_engine_obj.isfile(path=path)

    def listdir(self, path=None, type=CloudPathType.VSI):
        """
          Lists the contents of a directory non-recursivly.

          Arguments:
          path : (optional) str
                   -- relative path from current working directory or absolute (absolute VSI for cloud) path
          type  : (optional) CloudPathType. Path style for returned URI (only for cloud).
                  Default is CloudPathType.VSI.
                  Possible options -
                    -  CloudPathType.VSI
                    -  CloudPathType.ACS
                    -  CloudPathType.HTTP
                    -  CloudPathType.CLOUDSTORES

          Returns: (list of str) List of file names in the folder.

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.listdir("data_folder")

            # Usage Example 2

            from arcpy import CloudPathType
            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.listdir("data_folder", CloudPathType.ACS)

            # Usage Example 3

            local_io = AIO("C:\\data")
            local_io.listdir()

        """
        return self._arcio_engine_obj.listdir(path=path, type=type)

    def mkdir(self, path):
        """
          Make a directory.

          Arguments:
          path : str
                   -- relative path from current working directory or absolute (absolute VSI for cloud) path

          Returns: None

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.mkdir("cog")

        """
        return self._arcio_engine_obj.mkdir(path=path)

    def makedirs(self, path):
        """
          Make a directory recursively.

          Arguments:
          path : str
                   -- relative path from current working directory or absolute (absolute VSI for cloud) path

          Returns: None

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.makedirs("datasensor\\datatest\\data")

        """
        return self._arcio_engine_obj.makedirs(path=path)

    def open(self, path, mode=None, encoding="utf-8", mime=None):
        """
          Opens a file handle.
          This handle needs to be explictly closed.

          Arguments:
          path : str
                   -- relative path from current working directory or absolute (absolute VSI for cloud) path
          mode : str
                   --  'r'/'w'/'rb'/'wb'

          encoding: str
                      -- possible encoding options are - 'utf-8', 'utf-16', 'ascii'
                      -- Only read method honors the encoding parameter
          mime : (optional) dict of str KVP : (default) Empty
                   -- if creation, MIME Headers to be set.
                  Recommended to set MIME Headers at creation for better efficiency, rather than setting later.

          Returns: (AIOFile) file handle

        .. code-block:: python

            # Usage Example 1

            from arcpy import AIO
            local_io = AIO("C:\\data")
            rcsfile = local_io.open("testfile.txt", "r")
            rcsfile.write("This is a test file.")
            rcsfile.close()

            # Usage Example 2

            from arcpy import AIO
            cloud_io = AIO("C:\\data\\datacloud.acs")
            rcsfile = cloud_io.open("C:\\data\\info\\datafile.txt", "w", mime={"Content-Type": "text/plain"})
            rcsfile.write("This is a test file.")
            rcsfile.close()

            # Usage Example 3

            # using with statement (context manager to close the opened file)
            cloud_io = AIO("C:\\data\\datacloud.acs")
            with cloud_io.open("C:\\data\\info\\datafile.txt", "w", mime={"Content-Type": "text/plain"}) as rcsfile:
                rcsfile.write("This is a test file.")

        """
        return self._arcio_engine_obj.open(
            path=path, mode=mode, encoding=encoding, mime=mime
        )

    def remove(self, path):
        """
          Deletes a file

          Arguments:
          path : str
                   -- relative path from current working directory or absolute (absolute VSI for cloud) path

          Returns: None

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.remove("rcsfile.txt")

            # Usage Example 2

            local_io = AIO("C:\\data")
            local_io.remove("rcsfile.txt")

        """
        return self._arcio_engine_obj.remove(path=path)

    def removefiles(self, paths=None):
        """
          Delete multiples files

          Arguments:
          paths : list of str
                  -- relative paths from current working directory or absolute (absolute VSI for cloud) paths

          Returns: (list of str) Empty list if success else list of paths that was not successfully removed.

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.removefiles(["/vsis3/u-agu/list/to_be_deleted/datatest.json", "/vsis3/u-agu/list/to_be_deleted/data_new.json"])

            # Usage Example 2

            local_io = AIO("C:\\data")
            local_io.removefiles(["C:\\data\\datatest.json", "C:\\data\\data_new.json"])

        """
        if not isinstance(paths, list):
            raise RuntimeError("paths parameter should be of type list")
        return self._arcio_engine_obj.removefiles(paths=paths)

    def rename(self, src=None, dst=None):
        """
          Rename(Move) a file or a directory. Cloud rename is expensive as server-side copy and delete is performed.

          For cloud based AIO object -
            -  If src or dst is local path, use absolute local path.
            -  If src or dst is cloud path, relative path from current working directory or absolute vsi cloud path.
            -  If src and dst are cloud paths, use absolute vsi cloud paths.

          For local AIO object -
            -  src and dst can be relative path from current working directory or absolute path.

          Arguments:

          src : str
                   -- Source path
          dst : str
                   -- Target path

          Returns: None

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.rename("to_be_renamed/cog.tif","to_be_renamed/cognew.tif")

            # Usage Example 2

            local_io = AIO("C:\\data")
            local_io.rename("test.json", "new_test.json")

        """
        return self._arcio_engine_obj.rename(src=src, dst=dst)

    def rmtree(self, path):
        """
          Removes a directory and all it's contents recursively.

          Arguments:
          path : str
                   -- relative path from current working directory or absolute (absolute VSI for cloud) path

          Returns: None

        .. code-block:: python

            # Usage Example 1

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.rmtree("aio") # relative path

            # Usage Example 2

            cloud_io = AIO("C:\\data\\datacloud.acs")
            cloud_io.rmtree("/vsis3/u-agu/arcio") # absolute VSI path

            # Usage Example 3

            local_io = AIO("C:\\data")
            local_io.rmtree("aio")

        """
        return self._arcio_engine_obj.rmtree(path=path)

    def scandir(self, path, depth=0, type=CloudPathType.VSI):
        """
          Gets an iterable to entries in a directory.

          Arguments:
          path : str
                   -- relative path from current working directory or absolute (absolute VSI for cloud) path
          depth : (optional) int : (default) 0
                   -- Recursion depth (-1(recursive scanning) or 0(current dir only) or >0(arbitrary level))
          type  : (optional) CloudPathType. Path style for returned URI (only for cloud).
                  Default is CloudPathType.VSI.
                  Possible options -
                    -  CloudPathType.VSI
                    -  CloudPathType.ACS
                    -  CloudPathType.HTTP
                    -  CloudPathType.CLOUDSTORES

          Returns: (AIODirEntry) iteratable

        .. code-block:: python

            # Usage Example 1


            cloud_io = AIO("C:\\data\\datacloud.acs")
            # depth = 0, performs cur dir scanning only
            from arcpy import CloudPathType
            for item in cloud_io.scandir("list", depth=0, type=CloudPathType.HTTP):
                print(item.path)
                print(item.is_dir())
                print(item.is_file())
                ob = item.stat()
                print(ob.st_mode)

                # cloud specific operations through cloud property
                print(item.cloud.getvsipath())
                print(item.cloud.getpath(CloudPathType.ACS))

            # Usage Example 2


            local_io = AIO("C:\\data")

            # depth = -1, performs recursive scanning
            for item in local_io.scandir("aio", -1):
                print(item.name)
                print(item.path)
                print(item.is_dir())
                print(item.is_file())
                ob = item.stat()
                print(ob.st_mode)

        """
        return self._arcio_engine_obj.scandir(path=path, depth=depth, type=type)


class CloudFileOp:
    def __init__(self):
        """

            Class contains methods that perform file related operations that are cloud specific

        .. note ::
            This class is not created by users directly. An instance of this class is
            returned by cloud property of the AIOFile object.
        """
        raise TypeError("Cannot create 'CloudFileOp' instances.")

    @classmethod
    def new(cls, cloud_file):
        class_obj = object.__new__(cls)
        class_obj._cloud_file = cloud_file

        return class_obj

    def clearcache(self):
        """
          Clears in file properties and blob region cache.
          Needs to be done when an external process updates this file.

          Returns: None

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            rcsfile = cloud_io.open("testfile.txt", "r")
            rcsfile.cloud.clearcache()

        """
        return self._cloud_file.clearcache()

    def usebufferedreader(self):

        """
            Handler that adds very basic caching of last read bytes.
            (Available only for cloud)

            Returns: None

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            rcsfile = cloud_io.open("testfile.txt", "r")
            rcsfile.cloud.usebufferedreader()

        """
        return self._cloud_file.usebufferedreader()

    def usecachedfile(self, blocksize=None, cachesize=None):

        """
            Use LRU block cache for cloud handler, read-only.
            (Available only for cloud)

            Arguments:
            blocksize : (optional) int : (default) 32768
            cachesize : (optional) int : (default) 0

            Returns: None

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            rcsfile = cloud_io.open("testfile.txt", "r")
            rcsfile.cloud.usecachedfile(blocksize=32768, cachesize=0)

        """
        return self._cloud_file.usecachedfile(blocksize=blocksize, cachesize=cachesize)


class _LocalIOFile:
    def __init__(self, file):
        self._file = file

    def tell(self):
        return self._file.tell()

    def seek(self, offset, whence=None):
        self._file.seek(offset, whence)
        return None

    def close(self):
        return self._file.close()

    def flush(self):
        return self._file.flush()

    def read(self, size=-1):
        return self._file.read(size)

    def rewind(self):
        seek_pos = self.seek(0, os.SEEK_SET)
        return None

    def write(self, b):
        return self._file.write(b)


class _CloudIOFile:
    def __init__(self, file):
        self._file = file

    def tell(self):
        return self._file.tell()

    def seek(self, offset, whence=None):
        return self._file.seek(offset=offset, whence=whence)

    def clearcache(self):
        return self._file.clearcache()

    def close(self):
        return self._file.close()

    def flush(self):
        return self._file.flush()

    def read(self, size=-1):
        return self._file.read(size=size)

    def rewind(self):
        return self._file.rewind()

    def usebufferedreader(self):
        return self._file.usebufferedreader()

    def usecachedfile(self, blocksize=None, cachesize=None):
        return self._file.usecachedfile(blocksize=blocksize, cachesize=cachesize)

    def write(self, b):
        return self._file.write(b=b)


class AIOFile:
    """
        Class contains methods that perform file related operations such as seek, tell, read, write etc.

    .. note ::
        This class is not created by users directly. An instance of this class is
        returned by open() in AIO class.
    """
    def __init__(self):

        raise TypeError("Cannot create 'AIOFile' instances.")

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return self.close()

    @classmethod
    def new(cls, file, is_cloud=False):
        class_obj = object.__new__(cls)
        class_obj._arcio_file_engine = None
        class_obj._arcio_file_engine_obj = None
        if is_cloud:
            class_obj._arcio_file_engine = _CloudIOFile
            class_obj._arcio_file_engine_obj = _CloudIOFile(file=file)
        else:
            class_obj._arcio_file_engine = _LocalIOFile
            class_obj._arcio_file_engine_obj = _LocalIOFile(file=file)
        return class_obj

    @property
    def cloud(self):
        """
            Returns an instance of a class that has cloud specific methods.


            Returns: CloudFileOp object

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            rcsfile = cloud_io.open("testfile.txt", "r")
            rcsfile.cloud.clearcache()

        """
        if self._arcio_file_engine is _CloudIOFile:
            cloud = CloudFileOp.new(self._arcio_file_engine_obj._file)
            return cloud
        else:
            raise RuntimeError(
                "cloud property is available only on AIO object based on cloudstore."
            )

    def tell(self):
        """
          Return the current stream position.

          Returns: int

        .. code-block:: python

            # Usage Example

            rcsfile = cloud_io.open("cog.tif", "rb")
            print(rcsfile.tell())
        """
        return self._arcio_file_engine_obj.tell()

    def seek(self, offset, whence=os.SEEK_SET):
        """
            Change the stream position to the given byte offset

            Arguments:
            offset : (optional) int : (default) -1
                    -- number of bytes to read, -1 reads full content.
            whence : (optional) int : (default) os.SEEK_SET
                     Possible options are -
                    -- os.SEEK_SET, os.SEEK_CUR or os.SEEK_END
                    nonzero cur-relative seeks and nonzero end-relative seeks are not supported for local files when the file is opened in non binary mode

            Returns: None

        .. code-block:: python

            # Usage Example

            import os
            rcsfile = cloud_io.open("cog.txt", "r")
            rcsfile.seek(offset=6, whence=os.SEEK_CUR)

        """
        return self._arcio_file_engine_obj.seek(offset=offset, whence=whence)

    def close(self):
        """
            Flush and close this stream.
            For cloud, cloud blobs are generated at close only.

            Returns: None

        .. code-block:: python

            # Usage Example

            rcsfile = cloud_io.open("cog.txt", "r")
            rcsfile.close()

        """

        return self._arcio_file_engine_obj.close()

    def flush(self):
        """
            Flush the write buffers of the file.

            Returns: None

        .. code-block:: python

            # Usage Example

            rcsfile = cloud_io.open("cog.txt", "r")
            rcsfile.flush()

        """
        return self._arcio_file_engine_obj.flush()

    def read(self, size=-1):
        """
            Read data from the object and return them.

            Arguments:
            size  : (optional) int : (default) -1
                    -- number of bytes to read, -1 reads full content.

            Returns: (bytes or str) binary or text will be returned depending on open flags

        .. code-block:: python

            # Usage Example 1

            from arcpy import AIO
            cloud_io = AIO("C:\\data\\datacloud.acs")
            rcsfile = cloud_io.open("testfile.txt", "r")
            rcsfile.read(size=4)
            rcsfile.close()

            # Usage Example 2

            from arcpy import AIO
            cloud_io = AIO("C:\\data\\datacloud.acs")
            with cloud_io.open("testfile.txt", "r") as rcsfile:
                rcsfile.read(size=4)

        """
        return self._arcio_file_engine_obj.read(size=size)

    def rewind(self):
        """
            Resets the stream position to start.

            Returns: None

        .. code-block:: python

            # Usage Example

            cloud_io = AIO("C:\\data\\datacloud.acs")
            rcsfile = cloud_io.open("testfile.txt", "r")
            rcsfile.rewind()
        """

        return self._arcio_file_engine_obj.rewind()

    def write(self, b):
        """
            Writes data to a local file or cloud object.

            Arguments:
            b : str
                    -- Data to be written

            Returns: (int) number of bytes written

        .. code-block:: python

            # Usage Example 1

            from arcpy import AIO
            local_io = AIO("C:\\data")
            rcsfile = local_io.open("testfile.txt", "r")
            rcsfile.write("This is a test file.")
            rcsfile.close()

            # Usage Example 2

            from arcpy import AIO
            cloud_io = AIO("C:\\data\\datacloud.acs")
            rcsfile = cloud_io.open("C:\\data\\info\\datafile.txt", "w", mime={"Content-Type": "text/plain"})
            rcsfile.write("This is a test file.")
            rcsfile.close()

            # Usage Example 3

            # using with statement (context manager to close the opened file)
            cloud_io = AIO("C:\\data\\datacloud.acs")
            with cloud_io.open("C:\\data\\info\\datafile.txt", "w", mime={"Content-Type": "text/plain"}) as rcsfile:
                rcsfile.write("This is a test file.")

        """

        return self._arcio_file_engine_obj.write(b=b)


def AIOFileOpen(path, mode="r", encoding="utf-8", mime=None):
    """
    Opens a file handle. Support context manager protocol.

    Arguments:
    path : str
             -- relative path from current working directory or absolute (absolute VSI for cloud) path
    mode : str
             --  'r'/'w'/'rb'/'wb'

    encoding: str
                -- possible encoding options are - 'utf-8', 'utf-16', 'ascii'
                -- Only read method honors the encoding parameter
    mime : (optional) dict of str KVP : (default) Empty
             -- if creation, MIME Headers to be set.
            Recommended to set MIME Headers at creation for better efficiency, rather than setting later.

    Returns: (AIOFile) file handle
    """

    res = None
    if mime is None:
        mime = {}
    if not isinstance(mime, dict):
        raise RuntimeError("mime parameter value should be of of type dict")

    cloud_path = _is_cloudstorage_path(path)
    if cloud_path:
        res = _arciofileopen(cloud_path=path, mode=mode, encoding=encoding, mime=mime)
    else:
        if "b" in mode:
            encoding = None
        res = open(file=path, mode=mode, encoding=encoding)

    file_obj = AIOFile.new(res, is_cloud=cloud_path)
    return file_obj
