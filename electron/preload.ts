import { contextBridge, ipcRenderer } from 'electron'

const api = {
  accounts: {
    list: () => ipcRenderer.invoke('accounts:list'),
    create: (input: unknown) => ipcRenderer.invoke('accounts:create', input),
    update: (id: string, input: unknown) => ipcRenderer.invoke('accounts:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('accounts:delete', id),
  },
  categories: {
    list: () => ipcRenderer.invoke('categories:list'),
    create: (input: unknown) => ipcRenderer.invoke('categories:create', input),
    delete: (id: string) => ipcRenderer.invoke('categories:delete', id),
  },
  transactions: {
    list: (filters?: unknown) => ipcRenderer.invoke('transactions:list', filters),
    create: (input: unknown) => ipcRenderer.invoke('transactions:create', input),
    update: (id: string, input: unknown) => ipcRenderer.invoke('transactions:update', id, input),
    delete: (id: string) => ipcRenderer.invoke('transactions:delete', id),
  },
  budgets: {
    list: (period: string) => ipcRenderer.invoke('budgets:list', period),
    upsert: (input: unknown) => ipcRenderer.invoke('budgets:upsert', input),
    delete: (id: string) => ipcRenderer.invoke('budgets:delete', id),
  },
  reports: {
    summary: (period: string) => ipcRenderer.invoke('reports:summary', period),
    byCategory: (period: string) => ipcRenderer.invoke('reports:byCategory', period),
    monthly: (months: number) => ipcRenderer.invoke('reports:monthly', months),
  },
}

contextBridge.exposeInMainWorld('api', api)

export type FinanceApi = typeof api
