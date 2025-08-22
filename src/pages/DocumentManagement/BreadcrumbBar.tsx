import * as React from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

type PathItem = { id: string; name: string };

const BreadcrumbBar: React.FC<{
  path: PathItem[];
  onNavigate: (id: string) => void;
}> = ({ path, onNavigate }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const lastItemRef = React.useRef<HTMLButtonElement | null>(null);
  const liveRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    const last = lastItemRef.current;
    try {
      if (container && last) {
        const target =
          last.offsetLeft - container.clientWidth / 2 + last.clientWidth / 2;
        container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
      } else if (last) {
        last.scrollIntoView({
          behavior: 'smooth',
          inline: 'end',
          block: 'nearest',
        });
      }
    } catch {
      // ignore
    }
    if (liveRef.current) {
      liveRef.current.textContent = path.map((item) => item.name).join(' > ');
    }
  }, [path]);

  return (
    <Box sx={{ marginBottom: 2 }}>
      <Breadcrumbs
        aria-label="breadcrumb"
        separator=" > "
        sx={{
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          py: 0.5,
          '& > *': { flex: '0 0 auto' },
        }}
        ref={containerRef}
      >
        {path.map((item, index) => (
          <Chip
            key={item.id}
            label={item.name}
            onClick={() => onNavigate(item.id)}
            clickable
            component="button"
            size="small"
            aria-current={index === path.length - 1 ? 'page' : undefined}
            ref={index === path.length - 1 ? lastItemRef : undefined}
          />
        ))}
      </Breadcrumbs>
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: 'absolute', left: -9999 }}
        ref={liveRef}
      />
    </Box>
  );
};

export default BreadcrumbBar;
