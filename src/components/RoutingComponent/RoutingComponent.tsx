import DocumentManagement from '@/pages/DocumentManagement/DocumentManagement';
import { Route, Routes } from 'react-router';

const RoutingComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<DocumentManagement />} />
    </Routes>
  );
};

export default RoutingComponent;
