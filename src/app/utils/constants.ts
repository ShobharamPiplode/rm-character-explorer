export const AppConstants = {
  AppUrls: {
    CHARACTERS: '/characters',
    CHARACTER_DETAILS: '/characters/:id',
    RESTRICTED: '/restricted',
  },
  SessionStorageKeys: {
    ROLE_STORAGE_KEY: 'rm-explorer.role',
    VIEW_MODE_STORAGE_KEY: 'rm-explorer.view-mode',
  },
} as const;
