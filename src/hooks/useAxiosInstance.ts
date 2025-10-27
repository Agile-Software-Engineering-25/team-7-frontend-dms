import { useMemo } from 'react';
import axios from 'axios';
import useUser from '@/hooks/useUser';

const useAxiosInstance = (baseUrl: string) => {
  const { getAccessToken } = useUser();
  const token = getAccessToken();

  return useMemo(() => {
    const instance = axios.create({ baseURL: baseUrl });

    instance.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return instance;
  }, [baseUrl, token]);
};

export default useAxiosInstance;
