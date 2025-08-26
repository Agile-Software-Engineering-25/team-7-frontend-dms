import * as React from 'react';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Button from '@shared-components/Button/Button';

export default function DevMockBanner(): JSX.Element | null {
  const [enabled, setEnabled] = React.useState<boolean>(() => {
    try {
      const ls = localStorage.getItem('dms:useMock');
      if (ls) return ['1', 'true', 'yes'].includes(ls.toLowerCase());
    } catch {
      // ignore
    }
    return false;
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('dms:useMock', enabled ? '1' : '0');
      // also expose to window for runtime checks
      // @ts-ignore
      window.__DMS_MOCK_PREF__ = enabled;
      // eslint-disable-next-line no-console
      console.info('DMS mock mode set to', enabled);
    } catch {
      // ignore
    }
  }, [enabled]);

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'warning.light',
        color: 'text.primary',
        px: 2,
        py: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        zIndex: 9999,
      }}
      role="region"
      aria-label="Development mock banner"
    >
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        Dev: Mock API
      </Typography>
      <Switch
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
        inputProps={{ 'aria-label': 'Toggle DMS mock API' }}
      />
      <Button
        variant="outlined"
        onClick={() => {
          // quick link to toggle via URL
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('mock', enabled ? '0' : '1');
            window.history.replaceState({}, '', url.toString());
            // eslint-disable-next-line no-console
            console.info('Updated URL mock param');
          } catch {
            // ignore
          }
        }}
      >
        Persist URL
      </Button>
    </Box>
  );
}
