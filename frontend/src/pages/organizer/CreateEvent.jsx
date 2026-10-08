import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EventForm from '../../components/EventForm';
import PageTitle from '../../components/PageTitle';
import { Card } from '../../components/ui';
import { useRoleApi } from '../../hooks/useRoleApi';
import { api } from '../../lib/api';

export default function CreateEvent() {
  const call = useRoleApi('organizer');
  const navigate = useNavigate();
  const [categories, setCategories] = useState(null);

  useEffect(() => {
    api('/categories').then(setCategories).catch(() => setCategories([]));
  }, []);

  const create = async (payload) => {
    const created = await call('/events', { method: 'POST', body: payload });
    navigate('/organizer/events', { state: { notice: `"${created.title}" was created.` } });
  };

  return (
    <>
      <PageTitle title="Create event" subtitle="Fill in the details below to publish a new event." />
      <Card className="max-w-2xl p-6">
        {categories ? (
          <EventForm categories={categories} onSubmit={create} submitLabel="Create event" />
        ) : (
          <p className="text-sm text-zinc-500">Loading categories...</p>
        )}
      </Card>
    </>
  );
}
