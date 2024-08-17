import type { GeneratedTypes } from 'payload';

import type { TranslateResolver } from './resolvers/types';

export type TranslatorConfig = {
  /**
   * Collections with the enabled translator in the admin UI
   */
  collections: (keyof GeneratedTypes['collectionsUntyped'])[];
  /**
   * Disable the plugin
   */
  disabled?: boolean;
  /**
   * Globals with the enabled translator in the admin UI
   */
  globals: (keyof GeneratedTypes['globalsUntyped'])[];
  /**
   * Add resolvers that you want to include, examples on how to write your own in ./plugin/src/resolvers
   */
  resolvers: TranslateResolver[];
};
