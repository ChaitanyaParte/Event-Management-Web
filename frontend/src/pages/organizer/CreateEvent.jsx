import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EventForm from '../../components/EventForm';
import PageTitle from '../../components/PageTitle';
import { Card } from '../../components/ui';
import { useRoleApi } from '../../hooks/useRoleApi';
import { api, saveEventImage } from '../../lib/api';

export default function CreateEvent() {
  const call = useRoleApi('organizer');
  const navigate = useNavigate();
  const [categories, setCategories] = useState(null);
  const [requirementItems, setRequirementItems] = useState([]);

  useEffect(() => {
    api('/categories').then(setCategories).catch(() => setCategories([]));
    api('/requirements').then(setRequirementItems).catch(() => {});
  }, []);

  const create = async (payload, image) => {
    const created = await call('/events', { method: 'POST', body: payload });
    let notice = `"${created.title}" was submitted for admin approval. It goes live as soon as an admin approves it.`;
    try {
      await saveEventImage(call, created.event_id, image);
    } catch (err) {
      notice += ` The image could not be uploaded: ${err.message}`;
    }
    navigate('/organizer/events', { state: { notice } });
  };

  return (
    <>
      <PageTitle title="Create event" subtitle="Fill in the details and the venue checklist. An admin reviews every new event before students can see it." />
      <Card className="max-w-2xl p-6">
        {categories ? (
          <EventForm categories={categories} requirementItems={requirementItems} onSubmit={create} submitLabel="Submit for approval" />
        ) : (
          <p className="text-sm text-zinc-500">Loading categories...</p>
        )}
      </Card>
    </>
  );
}
