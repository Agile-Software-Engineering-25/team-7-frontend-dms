declare module '@agile-software/shared-components' {
  import { extendTheme } from '@mui/joy/styles';
  import type { Theme } from '@mui/material/styles';

  export type CustomTheme = ReturnType<typeof extendTheme>;

  export function createCustomJoyTheme(): CustomTheme;
  export function createCustomMuiTheme(): Theme;
}
