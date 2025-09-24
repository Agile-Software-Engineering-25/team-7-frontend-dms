import Weather from '@pages/Weather/Weather';
import DocumentManagement from '@/pages/DocumentManagement/DocumentManagement';
import { Route, Routes } from 'react-router';

const RoutingComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<DocumentManagement />} />
      <Route path="/weather" element={<Weather />} />
    </Routes>
  );
};

export default RoutingComponent;
