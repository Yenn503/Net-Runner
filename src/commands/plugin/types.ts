export type PluginSettingsProps = {
  onComplete: (result?: string) => void
  args?: string
  showMcpRedirectMessage?: boolean
}

export type ViewState =
  | {
      type: 'menu'
    }
  | {
      type: 'help'
    }
  | {
      type: 'validate'
      path?: string
    }
  | {
      type: 'marketplace-list'
    }
  | {
      type: 'marketplace-menu'
    }
  | {
      type: 'add-marketplace'
      initialValue?: string
    }
  | {
      type: 'browse-marketplace'
      targetMarketplace?: string
      targetPlugin?: string
    }
  | {
      type: 'discover-plugins'
      targetPlugin?: string
    }
  | {
      type: 'manage-marketplaces'
      targetMarketplace?: string
      action?: 'update' | 'remove'
    }
  | {
      type: 'manage-plugins'
      targetPlugin?: string
      targetMarketplace?: string
      action?: 'enable' | 'disable' | 'uninstall'
    }
