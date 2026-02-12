
import os, queue, threading, requests
import json
from urllib.parse import urlencode

outResponseQueue = queue.Queue()


class ProcessRestReq(threading.Thread):

    def __init__(self, name, url, params, referer, scratchWkspc=None):
        threading.Thread.__init__(self)
        self.name = name
        self.url = url
        self.scratchWkspc = scratchWkspc
        self.params = params
        self.referer = referer


    def run(self):
        try:
            headers = {'Content-type': "application/x-www-form-urlencoded"}
            headers["referer"] = self.referer
            headers["Accept-Encoding"] = "gzip"
            #filePath = os.path.join(self.scratchWkspc, "request_{}.json".format(self.name))
            #self.writeToTempFile(filePath, json.dumps(self.params))
            r = requests.post(self.url, urlencode(self.params), headers=headers, verify=False)
            if r.status_code == requests.codes.ok:
                enrichJSON = r.json()
                self.writeToQueue(enrichJSON)
                #filePath = os.path.join(self.scratchWkspc, "response_{}.json".format(self.name))
                #self.writeToTempFile(filePath, json.dumps(enrichJSON))
            else:
                r.raise_for_status()
        except Exception as e:
            errMsg = "HTTPError: {}".format(str(e))
            self.writeToQueue(errMsg)

    def writeToQueue(self, response="HTTPError"):
        outResponseQueue.put({"name": self.name,
                              "response": response})

    def writeToTempFile(self, fileFullPathAndName, data):
        tmpFile = open(fileFullPathAndName, "w")
        tmpFile.write(data)
        tmpFile.close()





