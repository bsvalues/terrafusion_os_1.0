const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")
const isDev = require("electron-is-dev")
const { spawn, exec } = require("child_process") // Added exec
const findFreePort = require("find-free-port")
const util = require("util") // Added util for promisify

const execPromise = util.promisify(exec) // Promisify exec

let mainWindow
let serverProcess
let serverPort = 3000 // Default port

function createWindow(urlToLoad) {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
    },
    icon: path.join(__dirname, "public", "favicon.ico"),
  })

  console.log(`Loading URL: ${urlToLoad}`)
  mainWindow.loadURL(urlToLoad)

  mainWindow.on("closed", () => {
    mainWindow = null
  })

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }
}

function startNextServer() {
  return new Promise((resolve, reject) => {
    const appPath = app.getAppPath()
    const nextCommand = isDev ? "next" : path.join(appPath, "node_modules/.bin/next")
    const CWD = isDev ? __dirname : appPath

    console.log(`Starting Next.js server with command: ${nextCommand} start -p ${serverPort}`)
    console.log(`CWD for Next.js server: ${CWD}`)

    const fs = require("fs")
    if (!isDev && !fs.existsSync(path.join(CWD, ".next", "BUILD_ID"))) {
      console.error("Production build (.next/BUILD_ID) not found. Make sure 'next build' has run successfully.")
      return reject(new Error("Production build not found."))
    }

    serverProcess = spawn(
      process.platform === "win32" ? "npx.cmd" : "npx",
      ["next", "start", "-p", serverPort.toString()],
      {
        cwd: CWD,
        env: { ...process.env, PORT: serverPort.toString() },
      },
    )

    let serverReady = false
    serverProcess.stdout.on("data", (data) => {
      const output = data.toString()
      console.log(`[Next.js Server]: ${output.trim()}`)
      if (
        !serverReady &&
        (output.includes("ready - started server on") ||
          output.includes("started server on") ||
          output.includes(`localhost:${serverPort}`))
      ) {
        console.log(`Next.js server ready on port ${serverPort}`)
        serverReady = true
        resolve(`http://localhost:${serverPort}`)
      }
    })

    serverProcess.stderr.on("data", (data) => {
      console.error(`[Next.js Server Error]: ${data.toString().trim()}`)
    })

    serverProcess.on("error", (err) => {
      console.error("[Next.js Server Spawn Error]:", err)
      reject(err)
    })

    serverProcess.on("close", (code) => {
      if (!serverReady) {
        console.log(`Next.js server process exited with code ${code} before becoming ready.`)
        reject(new Error(`Next.js server failed to start, exited with code ${code}`))
      } else {
        console.log(`Next.js server process exited with code ${code}.`)
      }
    })
  })
}

app.whenReady().then(async () => {
  if (isDev) {
    serverPort = 3000
    createWindow(`http://localhost:${serverPort}`)
  } else {
    try {
      const [foundPort] = await findFreePort(3001)
      serverPort = foundPort
      const appUrl = await startNextServer()
      createWindow(appUrl)
    } catch (error) {
      console.error("Failed to start Next.js server or create window in production:", error)
      app.quit()
    }
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (isDev) {
        createWindow(`http://localhost:${serverPort}`)
      } else {
        createWindow(`http://localhost:${serverPort}`)
      }
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("before-quit", () => {
  if (serverProcess) {
    console.log("Attempting to kill Next.js server process...")
    const killed = serverProcess.kill()
    if (killed) {
      console.log("Next.js server process killed successfully.")
    } else {
      console.log("Failed to kill Next.js server process (it might have already exited).")
    }
    serverProcess = null
  }
})

ipcMain.handle("run-test-property-agent", async () => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "scripts", "test-property-agent.py")
    const pythonProcess = spawn("python", [scriptPath])
    let stdout = ""
    let stderr = ""

    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString()
      console.log(`[Python STDOUT]: ${data.toString().trim()}`)
    })

    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString()
      console.error(`[Python STDERR]: ${data.toString().trim()}`)
    })

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout })
      } else {
        reject({ success: false, error: stderr, output: stdout, code })
      }
    })

    pythonProcess.on("error", (err) => {
      console.error("[Python Spawn Error]:", err)
      reject({ success: false, error: err.message })
    })
  })
})

// IPC Handler for Vercel Deployment
ipcMain.handle("deploy-to-vercel", async () => {
  const projectPath = isDev ? __dirname : app.getAppPath()
  let outputLog = ""

  const sendLog = (message) => {
    outputLog += message + "\n"
    if (mainWindow) {
      mainWindow.webContents.send("deployment-log", message)
    }
    console.log(message)
  }

  try {
    sendLog("Starting deployment process...")

    // Optional: Check git status
    // sendLog("Checking git status...");
    // const { stdout: gitStatus } = await execPromise("git status --porcelain", { cwd: projectPath });
    // if (gitStatus) {
    //   sendLog("Warning: Uncommitted changes found. Please commit or stash them first.");
    //   // return { success: false, log: outputLog, error: "Uncommitted changes." };
    // } else {
    //   sendLog("Git status clean.");
    // }

    sendLog("Pushing to remote repository (git push)...")
    // Ensure you have a remote setup, e.g., 'origin'
    const { stdout: pushOut, stderr: pushErr } = await execPromise("git push", { cwd: projectPath })
    if (pushErr) sendLog(`Git Push (stderr): ${pushErr}`)
    sendLog(`Git Push (stdout): ${pushOut || "No output"}`)
    sendLog("Git push completed.")

    sendLog("Deploying to Vercel (vercel --prod)...")
    // This assumes Vercel CLI is installed and user is logged in.
    // And the project is linked.
    const { stdout: vercelOut, stderr: vercelErr } = await execPromise("vercel --prod", { cwd: projectPath })
    if (vercelErr) sendLog(`Vercel Deploy (stderr): ${vercelErr}`)
    sendLog(`Vercel Deploy (stdout): ${vercelOut || "No output"}`)
    sendLog("Vercel deployment command finished.")

    const deploymentUrlMatch = vercelOut.match(/https:\/\/[^\s]+\.vercel\.app/)
    const deploymentUrl = deploymentUrlMatch ? deploymentUrlMatch[0] : "Could not parse URL"

    sendLog(`Deployment successful! URL: ${deploymentUrl}`)
    return { success: true, log: outputLog, url: deploymentUrl }
  } catch (error) {
    sendLog(`Error during deployment: ${error.message}`)
    if (error.stdout) sendLog(`Error stdout: ${error.stdout}`)
    if (error.stderr) sendLog(`Error stderr: ${error.stderr}`)
    return { success: false, log: outputLog, error: error.message }
  }
})
