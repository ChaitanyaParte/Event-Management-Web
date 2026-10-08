import { useCallback, useEffect, useState } from 'react';
import { useRoleApi } from './useRoleApi';

export function useAdminData(path) {
  const call = useRoleApi('admin');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      setData(await call(path));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [call, path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, reload, call };
}
