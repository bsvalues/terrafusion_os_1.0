
import os, queue, threading, json, urllib.request, urllib.parse

outResponseQueue = queue.Queue()

def writeToQueue(name, response="HTTPError"):
    outResponseQueue.put({"name" : name,
                          "response":response})

def writeToTempFile(fileFullPathAndName, data):
    tmpFile = open(fileFullPathAndName, "w")
    tmpFile.write(data)
    tmpFile.close()



class ProcessRestReq(threading.Thread):
    def __init__(self, name, url, params, referer, scratchWkspc=None):
        threading.Thread.__init__(self)
        self.name = name
        self.url = url
        self.scratchWkspc = scratchWkspc
        self.params = params
        self.referer = referer


    def run(self):
        params = urllib.parse.urlencode(self.params).encode('utf-8')
        try:
            req = urllib.request.Request(self.url)
            req.add_header("referer",self.referer)            
            submitResponse = urllib.request.urlopen(req, params)   
            enrichJson = json.loads(submitResponse.read().decode('utf-8'))             
            writeToQueue(self.name, enrichJson)
        except urllib.request.HTTPError as e:
            writeToQueue(self.name)


