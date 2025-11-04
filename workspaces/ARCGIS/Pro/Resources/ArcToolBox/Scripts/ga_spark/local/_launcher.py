import arcpy
import os
import sys
import subprocess
from threading import Lock
import atexit
import shlex
import shutil
import socket
import platform
import time
import tempfile

pro_home = arcpy.GetInstallInfo()["InstallDir"]
pro_lib_dir = os.path.join(pro_home, "Java", "lib")
pro_runtime_dir = os.path.join(pro_home, "Java", "runtime")
spark_home = os.path.join(pro_runtime_dir, "spark")
hadoop_home = os.path.join(pro_runtime_dir, "hadoop")

# Spark temp files should all be written to this directory
tmp_dir = os.path.join(tempfile.gettempdir(), "geoanalytics")

# TODO - use better approach than path hacking
# add spark/py4j libraries from Pro runtime to path for import
for file in os.listdir(os.path.join(spark_home, "python", "lib")):
    if file.endswith(".zip"):
        sys.path.insert(0, os.path.join(spark_home, "python", "lib", file))

os.environ["JAVA_HOME"] = os.path.join(pro_runtime_dir, "jre")
os.environ["HADOOP_HOME"] = hadoop_home
os.environ["SPARK_HOME"] = spark_home
os.environ["SPARK_LOCAL_HOSTNAME"] = "localhost"
os.environ["PYSPARK_PYTHON"] = os.path.join(pro_home, "bin", "Python", "envs", "arcgispro-py3", "python.exe")
os.environ["PYSPARK_PIN_THREAD"] = "true"

# these variables shared across all python interfaces (console, notebooks, toolboxes)
_spark = None
_lock = Lock()


class ProSparkSession(object):
    """
    Wraps a lazily initialized SparkSession created using the installed Spark runtime. The session
    is initialized the first time any method is called on the session.
    """

    def __init__(self):
        self._spark = None

    def __getattr__(self, name):
        self._lazy_init()
        return getattr(self._spark, name)

    def _lazy_init(self):
        if not self._spark:
            self._spark = get_or_create()

def get_or_create():
    with _lock:  # spark initialization needs to be synchronized
        global _spark

        # spark was shutdown explicitly with `spark.stop()` so we need to clean up
        if _spark and (_spark_stopped_externally() or not _gateway_connected()):
            _shutdown_spark()

        if not _spark:
            _spark = _initialize_spark()

        return _spark


def _jvm_is_running():
    return _spark is not None and not _spark._sc._gateway.proc.poll()

def _jvm_exit_code():
    try:
        return _spark._sc._gateway.proc.poll()
    except:
        return 999999

def _gateway_connected():
    try:
        gateway = _spark._sc._gateway

        # if the JVM is not running then the gateway is definitely not connected
        if gateway.proc.poll():
            return False

        # check to see if gateway is listening on its port
        if not _test_gateway_port(gateway):
            return False

        # final check - this will throw an exception if the gateway is not working.
        # This check is done as a last resort as it also logs a bunch of warnings that
        # won't he helpful to our users
        gateway.jvm.System.getProperty("java.runtime.name")
        return True
    except:
        return False


# directly test connection to gateway because py4j does not provide a way to ping that it's running
def _test_gateway_port(gateway):
    import socket
    sock = socket.socket()
    try:
        sock.connect((gateway.gateway_parameters.address, gateway.gateway_parameters.port))
        return True
    except:
        return False
    finally:
        sock.close()


# check if spark was stopped outside of our control (i.e. spark.stop())
def _spark_stopped_externally():
    return _spark is not None and not _spark.sparkContext._jsc


# resets global Spark state so that it can be restarted
def _reset_spark_global_state():

    from pyspark.sql import SQLContext, SparkSession
    from pyspark import SparkContext
    if (_gateway_connected()):
        try:
            _spark._jvm.SparkSession.clearDefaultSession()
            _spark._jvm.SparkSession.clearActiveSession()
        except:
            pass
    SparkSession._instantiatedSession = None
    SparkSession._activeSession = None
    SQLContext._instantiatedContext = None
    SparkContext._active_spark_context = None


def _initialize_spark():

    from . import _winutils
    from pyspark import SparkContext, SparkConf
    from pyspark.sql import SparkSession, DataFrame

    # these need to be reset on every run or pyspark will think the Java gateway is still up and running
    # TODO: remove if logic once Pro has officially upgraded to Python 3.9
    if sys.version_info < (3,9):
        os.environ.unsetenv("PYSPARK_GATEWAY_PORT")
        os.environ.unsetenv("PYSPARK_GATEWAY_SECRET")
    else:
        os.unsetenv("PYSPARK_GATEWAY_PORT")
        os.unsetenv("PYSPARK_GATEWAY_SECRET")
    SparkContext._jvm = None
    SparkContext._gateway = None

    
    # set JVM memory to 95% of available memory
    available_memory = int(_winutils._get_available_memory_win() * .95)

    conf = {
        "spark.app.name" : "ProSparkSession",
        "spark.master": "local[*]",
        "spark.app.name": "pro-spark",
        "spark.driver.memory": f"{available_memory}M",
        "spark.sql.catalogImplementation": "in-memory",
        "spark.serializer": "org.apache.spark.serializer.KryoSerializer",
        "spark.kryo.registrator": "com.esri.arcgis.gae.desktop.KryoRegistrator",
        "spark.plugins": "com.esri.arcgis.gae.desktop.DesktopSparkPlugin",
        "spark.ui.enabled": "false",
        "spark.sql.warehouse.dir": os.path.join(tmp_dir, "spark-warehouse"),
        "spark.local.dir": os.path.join(tmp_dir, "spark-work"),
        
        # a larger kryo buffer is needed to support certain data source types (like FDO and shapefile) which 
        # depend on collecting results before writing
        "spark.kryoserializer.buffer.max": "2047MB",
        
        # Sets the spark session time to UTC.  This prevents any conversion of time values
        # when using the built in methods (hour, dayofweek, etc...) from the JVM time (local) to UTC.  
        'spark.sql.session.timeZone': 'UTC'
    }
    
    classpath = [
        os.path.join(spark_home, "jars/*"),
        os.path.join(spark_home, "conf"),
        os.path.join(pro_lib_dir, "spark-desktop-engine.jar"),
        os.path.join(pro_lib_dir, "arcobjects.jar"),
        os.path.join(pro_lib_dir, "spark-xml_2.12-0.18.0.jar"),
        os.path.join(pro_lib_dir, "h3-4.1.1.jar")
    ]

    """
    Apache Arrow / PyArrow Java 11 support with Spark 3.0.1
    When using certain versions of Spark that uses certain versions of Netty depends 
    and using Java 11. Will need to pass the flag -Dio.netty.tryReflectionSetAccessible=true 
    when starting up the JVM. The Apache Spark doc https://spark.apache.org/docs/3.0.1/#downloading 
    supports this.In future versions of Spark / Java this flag may no longer be needed.
    """
    apache_arrow_java_11_support_flag = "-Dio.netty.tryReflectionSetAccessible=true"

    """
    Java 17 Support. 
    Spark got official Java 17 support starting at version 3.3.0 and requires the runtime Scala version 
    to be at at least Scala 2.12.15. 
    In order to support Java 17 some additional Java options will need to be used.
    https://stackoverflow.com/a/73504175
    https://lists.apache.org/thread/814cpb1rpp73zkhtv9t4mkzzrznl82yn
    """
    java_comp_options = [
        "--add-opens=java.base/java.lang=ALL-UNNAMED",
        "--add-opens=java.base/java.lang.invoke=ALL-UNNAMED",
        "--add-opens=java.base/java.lang.reflect=ALL-UNNAMED",
        "--add-opens=java.base/java.io=ALL-UNNAMED",
        "--add-opens=java.base/java.net=ALL-UNNAMED",
        "--add-opens=java.base/java.nio=ALL-UNNAMED",
        "--add-opens=java.base/java.util=ALL-UNNAMED",
        "--add-opens=java.base/java.util.concurrent=ALL-UNNAMED",
        "--add-opens=java.base/java.util.concurrent.atomic=ALL-UNNAMED",
        "--add-opens=java.base/sun.nio.ch=ALL-UNNAMED",
        "--add-opens=java.base/sun.nio.cs=ALL-UNNAMED",
        "--add-opens=java.base/sun.security.action=ALL-UNNAMED",
        "--add-opens=java.base/sun.util.calendar=ALL-UNNAMED"
    ]

    spark_submit_class = "org.apache.spark.deploy.SparkSubmit"

    command = [
        os.path.join(pro_runtime_dir, "jre", "bin", "java.exe"),
        '-cp', '{0}'.format(";".join(classpath)),
        "-XX:+UseG1GC",
        "-Dpython.module.name=ga_spark",  # needed by the geometry UDT in Scala
        "-Djava.library.path={0}/bin".format(hadoop_home.replace("\\", "/")),
        apache_arrow_java_11_support_flag,
    ] + java_comp_options + [spark_submit_class]
    
    for k, v in conf.items():
        command += ["--conf", "{0}={1}".format(k, v)]
    
    command += ["pyspark-shell"]
    
    gateway = _launch_gateway(command)
    
    sc = SparkContext(gateway=gateway)
    spark = SparkSession(sc)

    # Sets the checkpoint directory in a tempfolder locate in %LOCALAPPDATA%/Temp.
    # This gets cleaned up once ArcGIS Pro close out.
    with tempfile.TemporaryDirectory() as tmpdir:
        sc.setCheckpointDir(tmpdir)

    return spark


def _launch_gateway(command):
    
    from py4j.java_gateway import java_import, JavaGateway, JavaObject, GatewayParameters
    from py4j.clientserver import ClientServer, JavaParameters, PythonParameters
    from pyspark.serializers import read_int, write_with_length, UTF8Deserializer
    
    ## ADAPTED FROM pyspark.java_gateway
    
    # Create a temporary directory where the gateway server should write the connection
    # information.
    conn_info_dir = tempfile.mkdtemp()
    try:
        fd, conn_info_file = tempfile.mkstemp(dir=conn_info_dir)
        os.close(fd)
        os.unlink(conn_info_file)

        env = dict(os.environ)
        env["_PYSPARK_DRIVER_CONN_INFO_PATH"] = conn_info_file

        # Launch the Java gateway.
        popen_kwargs = {
            'env': env,
            'stdin': subprocess.PIPE,
            'stdout': subprocess.DEVNULL,  # need to redirect stdout & stderr when running in Pro or JVM fails immediately
            'stderr': subprocess.DEVNULL,
            'shell': True  # keeps the command-line window from showing
        }
 
        proc = subprocess.Popen(command, **popen_kwargs)

        # Wait for the file to appear, or for the process to exit, whichever happens first.
        while not proc.poll() and not os.path.isfile(conn_info_file):
            time.sleep(0.1)

        if not os.path.isfile(conn_info_file):
            raise RuntimeError("Java gateway process exited before sending its port number")

        with open(conn_info_file, "rb") as info:
            gateway_port = read_int(info)
            gateway_secret = UTF8Deserializer().loads(info)
    finally:
        shutil.rmtree(conn_info_dir)
    
    gateway = ClientServer(
        java_parameters=JavaParameters(
            port=gateway_port, auth_token=gateway_secret, auto_convert=True
        ),
        python_parameters=PythonParameters(port=0, eager_load=False),
    )
    
     # Store a reference to the Popen object for use by the caller (e.g., in reading stdout/stderr)
    gateway.proc = proc

    # Import the classes used by PySpark
    java_import(gateway.jvm, "org.apache.spark.SparkConf")
    java_import(gateway.jvm, "org.apache.spark.api.java.*")
    java_import(gateway.jvm, "org.apache.spark.api.python.*")
    java_import(gateway.jvm, "org.apache.spark.ml.python.*")
    java_import(gateway.jvm, "org.apache.spark.mllib.api.python.*")
    java_import(gateway.jvm, "org.apache.spark.resource.*")
    # TODO(davies): move into sql
    java_import(gateway.jvm, "org.apache.spark.sql.*")
    java_import(gateway.jvm, "org.apache.spark.sql.api.python.*")
    java_import(gateway.jvm, "org.apache.spark.sql.hive.*")
    java_import(gateway.jvm, "scala.Tuple2")

    return gateway
    

def _shutdown_spark():
    global _spark
    if _spark:

        # jvm_is_running = _jvm_is_running()
        # spark_stopped = _spark_stopped_externally()
        # gateway_connected = _gateway_connected()

        # only try to stop spark if the gateway is connected, otherwise it will certainly fail
        if _gateway_connected():
            try:
                _spark.stop()
            except:
                pass

        try:
            gateway = _spark._sc._gateway
            gateway.shutdown()
            gateway.proc.stdin.close()

            # ensure that process and all children are killed
            subprocess.Popen(["cmd", "/c", "taskkill", "/f", "/t", "/pid", str(gateway.proc.pid)], shell=True,
                             stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except:
            pass

        _reset_spark_global_state()

        _spark = None


