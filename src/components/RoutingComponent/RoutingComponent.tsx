import Weather from '@pages/Weather/Weather';
import DocumentManagement from '@/pages/DocumentManagement/DocumentManagement';
import Home from '@pages/Home/Home';
import { Route, Routes } from 'react-router';

const RoutingComponent = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/weather" element={<Weather />} />
      <Route path="/document-management" element={<DocumentManagement />} />
    </Routes>
  );
};

export default RoutingComponent;
