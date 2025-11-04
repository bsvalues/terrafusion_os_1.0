import { app, BrowserWindow, ipcMain, screen, shell } from "electron";
import path from "path";
import fs from "fs";
import url from "url";

// Keep a global reference of windows to prevent garbage collection
let mainWindow: BrowserWindow | null = null;
const detachedPanels: Record<string, BrowserWindow> = {};

// Window state storage
interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  maximized: boolean;
}

// Path to store window states
const userDataPath = app.getPath("userData");
const windowStatePath = path.join(userDataPath, "window-state.json");

// Load saved window states
let windowStates: Record<string, WindowState> = {};
try {
  if (fs.existsSync(windowStatePath)) {
    windowStates = JSON.parse(fs.readFileSync(windowStatePath, "utf8"));
  }
} catch (e) {
  console.error("Failed to load window states:", e);
}

// Save window states to disk
function saveWindowStates() {
  try {
    fs.writeFileSync(windowStatePath, JSON.stringify(windowStates));
  } catch (e) {
    console.error("Failed to save window states:", e);
  }
}

// Create the main window
function createMainWindow() {
  const defaultState: WindowState = {
    width: 1280,
    height: 800,
    x: undefined,
    y: undefined,
    maximized: false,
  };

  const state = { ...defaultState, ...windowStates.main };

  mainWindow = new BrowserWindow({
    width: state.width,
    height: state.height,
    x: state.x,
    y: state.y,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: "AppraisalCore - Real Estate Appraisal Platform",
    backgroundColor: "#f5f5f5",
    show: false, // Don't show until ready-to-show
  });

  // Load the app - in development we'll use the dev server, in production the built files
  const startUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:5000"
      : url.format({
          pathname: path.join(__dirname, "public/index.html"),
          protocol: "file:",
          slashes: true,
        });

  mainWindow.loadURL(startUrl);

  // Show when ready
  mainWindow.once("ready-to-show", () => {
    if (!mainWindow) return;
    mainWindow.show();

    if (state.maximized) {
      mainWindow.maximize();
    }
  });

  // Save the window state when it's closed
  mainWindow.on("close", () => {
    if (!mainWindow) return;

    const { x, y, width, height } = mainWindow.getBounds();
    const maximized = mainWindow.isMaximized();

    windowStates.main = { x, y, width, height, maximized };
    saveWindowStates();
  });

  // Reference gets null when window is closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

// Create detached panel window
function createDetachedPanel(
  id: string,
  title: string,
  position: { x: number; y: number },
  size: { width: number; height: number }
) {
  // Check if panel already exists
  if (detachedPanels[id]) {
    detachedPanels[id].focus();
    return;
  }

  const panelWindow = new BrowserWindow({
    width: size.width,
    height: size.height,
    x: position.x,
    y: position.y,
    parent: mainWindow,
    modal: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: `${title} - AppraisalCore`,
    show: false,
  });

  // Load the same URL as the main window but with a panel parameter
  const mainUrl = mainWindow.webContents.getURL();
  const panelUrl = new URL(mainUrl);
  panelUrl.searchParams.set("detachedPanel", id);
  panelWindow.loadURL(panelUrl.toString());

  // Show when ready
  panelWindow.once("ready-to-show", () => {
    panelWindow.show();
  });

  // Save state when closed
  panelWindow.on("close", () => {
    const { x, y, width, height } = panelWindow.getBounds();
    windowStates[`panel-${id}`] = { x, y, width, height, maximized: false };
    saveWindowStates();

    // Notify the main window that the panel is closed
    if (mainWindow) {
      mainWindow.webContents.send("reattach-panel", { id });
    }

    // Remove from detached panels
    delete detachedPanels[id];
  });

  // Store reference
  detachedPanels[id] = panelWindow;
}

// App lifecycle events
app.whenReady().then(() => {
  createMainWindow();

  // On macOS it's common to re-create a window when the dock icon is clicked
  app.on("activate", () => {
    if (!mainWindow) {
      createMainWindow();
    }
  });
});

// Quit the app when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC handlers for window/panel management
ipcMain.on("detach-panel", (event, data) => {
  const { id, title, position, size } = data;
  createDetachedPanel(id, title, position, size);
});

ipcMain.on("get-displays", (event) => {
  const displays = screen.getAllDisplays();
  event.reply("get-displays-reply", displays);
});

ipcMain.on("save-window-state", (event, data) => {
  const { windowId, bounds } = data;
  windowStates[windowId] = {
    ...bounds,
    maximized: false,
  };
  saveWindowStates();
});

ipcMain.on("get-window-state", (event, windowId) => {
  event.reply("get-window-state-reply", windowStates[windowId] || null);
});

// File handling
ipcMain.handle("save-file", async (event, { data, defaultPath, filters }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath,
    filters: filters || [{ name: "All Files", extensions: ["*"] }],
  });

  if (canceled || !filePath) {
    return null;
  }

  try {
    fs.writeFileSync(filePath, data);
    return filePath;
  } catch (error) {
    console.error("Failed to save file:", error);
    return null;
  }
});

ipcMain.handle("open-file", async (event, { filters, properties }) => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: properties || ["openFile"],
    filters: filters || [{ name: "All Files", extensions: ["*"] }],
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  try {
    const filePath = filePaths[0];
    const data = fs.readFileSync(filePath, "utf8");
    return { filePath, data };
  } catch (error) {
    console.error("Failed to open file:", error);
    return null;
  }
});

// Import missing dialog for file operations
import { dialog } from "electron";
