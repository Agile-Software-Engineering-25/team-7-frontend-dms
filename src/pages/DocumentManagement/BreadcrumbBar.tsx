import * as React from 'react';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import { emitDropOnBreadcrumb, parseDragData } from '../../lib/dmsEvents';
import { useCanAccess } from '@/lib/permissions';

const chipBaseSx = {
  borderRadius: '999px',
  backgroundColor: '#ffffff',
  color: '#002E6D',
  fontWeight: 600,
  px: 1.5,
  height: 36,
  '&.MuiChip-clickable:hover': {
    backgroundColor: '#e9f1ff',
    color: '#002E6D',
  },
};

const chipActiveSx = {
  backgroundColor: '#002E6D',
  color: '#ffffff',
  '&.MuiChip-clickable:hover': {
    backgroundColor: '#002E6D',
    color: '#ffffff',
  },
};

type PathItem = { id: string; name: string };

const BreadcrumbBar: React.FC<{
  path: PathItem[];
  onNavigate: (id: string) => void;
}> = ({ path, onNavigate }) => {
  const { canAccess } = useCanAccess();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const lastItemRef = React.useRef<HTMLButtonElement | null>(null);
  const liveRef = React.useRef<HTMLDivElement | null>(null);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);

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
    <Box>
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
        {path.map((item, index) => {
          const isCurrent = index === path.length - 1;
          const isDragOver = dragOverId === item.id;
          return (
            <Chip
              key={item.id}
              label={item.name}
              onClick={() => onNavigate(item.id)}
              clickable
              component="button"
              size="medium"
              aria-current={isCurrent ? 'page' : undefined}
              ref={isCurrent ? lastItemRef : undefined}
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={() => setDragOverId(item.id)}
              onDragLeave={() =>
                setDragOverId((v) => (v === item.id ? null : v))
              }
              onDrop={(e) => {
                if (!canAccess('manageDocuments')) return;
                const parsed = parseDragData(e.dataTransfer);
                if (!parsed) return;
                emitDropOnBreadcrumb(parsed, item.id);
                setDragOverId(null);
              }}
              sx={{
                ...chipBaseSx,
                ...(isCurrent ? chipActiveSx : {}),
                ...(isDragOver
                  ? { border: '2px solid rgba(0, 46, 109, 0.35)' }
                  : {}),
              }}
            />
          );
        })}
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
