import os

#import tinys3
from logging import getLogger

# Setup the logger
logger = getLogger(__name__)


class S3Uploader(object):
    def __init__(self, s3_access_key, s3_secret_key, bucket, target_dir):
        self.__s3_access_key = s3_access_key
        self.__s3_secret_key = s3_secret_key
        self.__bucket = bucket
        self.__target_dir = target_dir

    def __upload(self, path_to_file, remote_path):
        logger.debug("Uploading {} to {}".format(path_to_file, remote_path))
        conn = tinys3.Connection(self.__s3_access_key, self.__s3_secret_key,
                                 tls=True)
        try:
            with open(path_to_file, 'rb') as f:
                conn.upload(remote_path, f, self.__bucket)
                logger.info("Uploaded file {} to s3: {}/{}".format(path_to_file,
                                                                   self.__bucket,
                                                                   remote_path))
                return True
        except Exception as e:
            logger.warning(
                "Failed to upload File {} to s3({}): {}".format(path_to_file,
                                                                remote_path, e))
            return False

    def upload(self, path_to_file, file_name=None):
        """
        Uploads the given file to s3://bucket/target_dir.
        :param path_to_file: Path to the local file to upload
        :param file_name: File name to use when uploading.
        If this is not set the last path element will be used.
        :return True if the upload was successful, otherwise False
        """
        logger.debug("Uploading file {} as {}".format(path_to_file, file_name))
        if not os.path.exists(path_to_file):
            raise ValueError("Path to inexistent file.")
        remote_path = '/{}/{}'.format(self.__target_dir,
                                      file_name if file_name is not None else
                                      str(path_to_file).split('/')[-1])
        return self.__upload(path_to_file, remote_path)

    def upload_dir(self, path_to_dir):
        logger.debug("Uploading directory {}".format(path_to_dir))
        remote_base_path = os.path.join(self.__target_dir,
                                        str(path_to_dir).split('/')[-1])
        root_dir = os.path.abspath(path_to_dir)
        for dirname, subdirs, files in os.walk(root_dir):
            for filename in files:
                file = os.path.join(dirname, filename)
                remote_file = os.path.join(remote_base_path,
                                           os.path.relpath(file, root_dir))
                self.__upload(os.path.abspath(file), remote_file)
