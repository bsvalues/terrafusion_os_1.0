import smtplib, os, sys, traceback
import tempfile

try:
    from email.MIMEMultipart import MIMEMultipart
    from email.MIMEBase import MIMEBase
    from email.MIMEText import MIMEText
    from email.Utils import COMMASPACE, formatdate
    from email import Encoders
except ImportError:  # py 3
    from email.mime.multipart import MIMEMultipart
    from email.mime.base import MIMEBase
    from email.mime.text import MIMEText
    from email.utils import COMMASPACE, formatdate
    from email import encoders as Encoders
    
import arcpy


class Toolbox(object):
    def __init__(self):
        """Define the toolbox (the name of the toolbox is the name of the
        .pyt file)."""
        self.label = "Workflow Manager Internal Tools"
        self.alias = ""

        # List of tool classes associated with this toolbox
        self.tools = [SendWorkflowManagerEmail]


class SendWorkflowManagerEmail(object):
    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Send Notification"
        self.description = "Send a Workflow Manager notification"
        self.canRunInBackground = False

    def getParameterInfo(self):
        """Define parameter definitions"""
        sendto = arcpy.Parameter(displayName="Send To", name="send_to", datatype="GPString", parameterType="Required", direction="Input")
        fromaddr = arcpy.Parameter(displayName="From Address", name="from", datatype="GPString", parameterType="Required", direction="Input")
        subject = arcpy.Parameter(displayName="Subject", name="subject", datatype="GPString", parameterType="Optional", direction="Input")
        text = arcpy.Parameter(displayName="Text", name="text", datatype="GPString", parameterType="Optional", direction="Input")
        smtpMailServer = arcpy.Parameter(displayName="SMTP Server", name="server", datatype="GPString", parameterType="Required", direction="Input")
        smtpPort = arcpy.Parameter(displayName="Port", name="port", datatype="GPString", parameterType="Optional", direction="Input")
        smtpPort.value = 25
        zipfile = arcpy.Parameter(displayName="Zipfile", name="zipfile", datatype="GPString", parameterType="Optional", direction="Input")
        maxsize = arcpy.Parameter(displayName="Max Size", name="maxsize", datatype="GPString", parameterType="Optional", direction="Input")
        maxsize.value = 2
        protocol = arcpy.Parameter(displayName="Protocol", name="protocol", datatype="GPString", parameterType="Optional", direction="Input")
        smtpUser = arcpy.Parameter(displayName="Username", name="username", datatype="GPString", parameterType="Optional", direction="Input")
        smtpPwd = arcpy.Parameter(displayName="Password", name="password", datatype="GPString", parameterType="Optional", direction="Input")
        strHTML = arcpy.Parameter(displayName="HTML", name="html", datatype="GPString", parameterType="Optional", direction="Input")
        strHTML.value = "False"
        
        params = [sendto, fromaddr, subject, text, smtpMailServer, smtpPort, zipfile, maxsize, protocol, smtpUser, smtpPwd, strHTML]
        return params

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return

    def execute(self, parameters, messages):
        self.messages = messages
        return self.sendEmail(parameters[0].valueAsText,
                              parameters[1].valueAsText,
                              parameters[2].valueAsText,
                              parameters[3].valueAsText,
                              parameters[4].valueAsText,
                              parameters[5].valueAsText,
                              parameters[6].valueAsText,
                              parameters[7].valueAsText,
                              parameters[8].valueAsText,
                              parameters[9].valueAsText,
                              parameters[10].valueAsText,
                              parameters[11].valueAsText)

    def send_mail(self, send_from, send_to, subject, text, zipfile, server, port, protocol, smtpUser="", smtpPwd="", bHtml=False):
        try:
            msg = MIMEMultipart()
            msg['From'] = send_from
            msg['To'] = COMMASPACE.join(send_to)
            msg['Date'] = formatdate(localtime=True)
            msg['Subject'] = subject

            self.messages.addMessage("JTXAdvancedNotifier: send_from = " + send_from)
            self.messages.addMessage("JTXAdvancedNotifier: send_to = " + str(send_to))
            self.messages.addMessage("JTXAdvancedNotifier: subject = " + str(subject))
            self.messages.addMessage("JTXAdvancedNotifier: text of email = " + str(text))
            self.messages.addMessage("JTXAdvancedNotifier: server = " + server)
            self.messages.addMessage("JTXAdvancedNotifier: port = " + str(port))
            self.messages.addMessage("JTXAdvancedNotifier: protocol = " + str(protocol))
            self.messages.addMessage("JTXAdvancedNotifier: smtpUser = " + str(smtpUser))
            self.messages.addMessage("JTXAdvancedNotifier: bHtml = " + str(bHtml))

            body = ""
            if bHtml:
                self.messages.addMessage("JTXAdvancedNotifier: encoding as html and utf-8..")
                body = MIMEText(text.encode('utf-8'), _subtype='html', _charset='utf-8')
            else:
                text = text.replace('\\r','\r')
                text = text.replace('\\n','\n')
                self.messages.addMessage("JTXAdvancedNotifier: sending replaced plain text as utf-8..")
                body = MIMEText(text.encode('utf-8'), _subtype='plain', _charset='utf-8')

            msg.attach(body)

            if zipfile:
                part = MIMEBase('application', "zip")   # Change if different file type sent.
                self.messages.addMessage("JTXAdvancedNotifier: Attaching file at " + zipfile)
                part.set_payload( open(zipfile,"rb").read() )
                Encoders.encode_base64(part)
                part.add_header('Content-Disposition', 'attachment; filename="%s"' % os.path.basename(zipfile))
                msg.attach(part)
                self.messages.addMessage("JTXAdvancedNotifier: Finished attaching file at " + zipfile)

            if protocol == "TLS" and smtpUser and smtpPwd:
                self.messages.addMessage("JTXAdvancedNotifier: Connecting to TLS server " + server)
                smtp = smtplib.SMTP(server,port)
                self.messages.addMessage("JTXAdvancedNotifier: Connected to TLS server " + server)
                smtp.ehlo()
                smtp.starttls()
                self.messages.addMessage("JTXAdvancedNotifier: Started TLS session..")
                smtp.login(smtpUser, smtpPwd)
                self.messages.addMessage("JTXAdvancedNotifier: Logged into TLS server " + server)
                smtp.sendmail(send_from, send_to, msg.as_string())
                self.messages.addMessage("JTXAdvancedNotifier: Complete")
                smtp.close
            elif protocol == "SSL" and smtpUser and smtpPwd:
                self.messages.addMessage("JTXAdvancedNotifier: Connecting to SSL server " + server)
                smtp = smtplib.SMTP_SSL(server,port)
                self.messages.addMessage("JTXAdvancedNotifier: Connected to SSL server " + server)
                smtp.login(smtpUser, smtpPwd)
                self.messages.addMessage("JTXAdvancedNotifier: Logged into SSL server " + server)
                smtp.sendmail(send_from, send_to, msg.as_string())
                self.messages.addMessage("JTXAdvancedNotifier: Send complete")
                smtp.close
            else:            
                smtp = smtplib.SMTP(server,port)
                self.messages.addMessage("JTXAdvancedNotifier: Connected to server " + server)
                #smtp.set_debuglevel(1)
                # If your server requires user/password
                if smtpUser and smtpPwd:
                    smtp.login(smtpUser, smtpPwd)
                smtp.sendmail(send_from, send_to, msg.as_string())
                self.messages.addMessage("JTXAdvancedNotifier: sendmail complete")
                smtp.close()
        except:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = "PYTHON ERRORS:\nTraceback Info:\n" + tbinfo + "\nError Info:\n    " + \
                    str(sys.exc_info()[0])+ ": " + str(sys.exc_info()[1]) + "\n"
            raise Exception("SendWorkflowManagerEmailError:" + pymsg)

   
    def sendEmail(self, sendto, fromaddr, subject=None, text=None, smtpMailServer=None, smtpPort=25, zipfile='', maxsize=2, protocol=None, smtpUser=None, smtpPwd=None, strHTML="False"):
        self.messages.addMessage("JTXAdvancedNotifier: strHTML = " + strHTML)
        sendto = sendto.split(';')
        if zipfile:
            zipfile = zipfile.replace("\\",os.sep)
        if maxsize:
            maxsize=int(maxsize) * 1000000
        if smtpPort:
            smtpPort=int(smtpPort)

        if not subject:
            subject = ''
        if not text:
            text = ''
    
        bHtml = False
        if strHTML == 'True' or strHTML == 'TRUE' or strHTML == 'true':
            bHtml = True
    
        try:
            if zipfile:
                zipsize = os.path.getsize(zipfile)
            else:
                zipsize = 0
            if  zipsize <= maxsize:
                self.send_mail(fromaddr, sendto, subject, text, zipfile, smtpMailServer, smtpPort, protocol, smtpUser, smtpPwd, bHtml)
                self.messages.addMessage("JTXAdvancedNotifier: Sent to " + str(sendto) + " from " + fromaddr)
            else:
                self.messages.addMessage("JTXAdvancedNotifier: The resulting zip file is too large (" + str(round(zipsize / 1000000.0, 2)) + "MB). Must be less than " +
                                str(round(maxsize / 1000000.0, 2)) + "MB.")
                raise Exception

        except:
            # Return any python specific errors as well as any errors from the geoprocessor
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = "JTXAdvancedNotifier: PYTHON ERRORS:\nTraceback Info:\n" + tbinfo + "\nError Info:\n    " + \
                    str(sys.exc_info()[0])+ ": " + str(sys.exc_info()[1]) + "\n"
            self.messages.addMessage(pymsg)
            self.messages.addError("JTXAdvancedNotifier: ERROR, Unable to send email")

