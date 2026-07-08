import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createDatabase, FinanceRepository } from './db'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null = null
let repo: FinanceRepository

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0f1115',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function registerIpcHandlers() {
  ipcMain.handle('accounts:list', () => repo.listAccounts())
  ipcMain.handle('accounts:create', (_e, input) => repo.createAccount(input))
  ipcMain.handle('accounts:update', (_e, id, input) => repo.updateAccount(id, input))
  ipcMain.handle('accounts:delete', (_e, id) => repo.deleteAccount(id))

  ipcMain.handle('categories:list', () => repo.listCategories())
  ipcMain.handle('categories:create', (_e, input) => repo.createCategory(input))
  ipcMain.handle('categories:delete', (_e, id) => repo.deleteCategory(id))

  ipcMain.handle('transactions:list', (_e, filters) => repo.listTransactions(filters))
  ipcMain.handle('transactions:create', (_e, input) => repo.createTransaction(input))
  ipcMain.handle('transactions:update', (_e, id, input) => repo.updateTransaction(id, input))
  ipcMain.handle('transactions:delete', (_e, id) => repo.deleteTransaction(id))

  ipcMain.handle('budgets:list', (_e, period) => repo.listBudgets(period))
  ipcMain.handle('budgets:upsert', (_e, input) => repo.upsertBudget(input))
  ipcMain.handle('budgets:delete', (_e, id) => repo.deleteBudget(id))

  ipcMain.handle('reports:summary', (_e, period) => repo.getSummary(period))
  ipcMain.handle('reports:byCategory', (_e, period) => repo.getExpensesByCategory(period))
  ipcMain.handle('reports:monthly', (_e, months) => repo.getMonthlyTrend(months))
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.whenReady().then(() => {
  const userDataPath = app.getPath('userData')
  repo = createDatabase(path.join(userDataPath, 'finanzas.db'))
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
