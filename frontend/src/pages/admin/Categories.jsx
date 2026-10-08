import { useState } from 'react';
import { Plus } from 'lucide-react';
import PageTitle from '../../components/PageTitle';
import { Button, Card, Dialog, EmptyState, Field, Input, Notice, Table, Td, Th } from '../../components/ui';
import { useAdminData } from '../../hooks/useAdminData';

export default function Categories() {
  const { data: categories, error, reload, call } = useAdminData('/admin/categories');
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [notice, setNotice] = useState('');
  const [problem, setProblem] = useState('');

  const run = async (action, message) => {
    setNotice('');
    setProblem('');
    try {
      await action();
      setNotice(message);
      await reload();
      return true;
    } catch (err) {
      setProblem(err.message);
      return false;
    }
  };

  const add = async (event) => {
    event.preventDefault();
    const ok = await run(() => call('/admin/categories', { method: 'POST', body: { category_name: name.trim() } }), 'Category added.');
    if (ok) setName('');
  };

  const save = async (event) => {
    event.preventDefault();
    const ok = await run(
      () => call(`/admin/categories/${editing.category_id}`, { method: 'PUT', body: { category_name: editName.trim() } }),
      'Category updated.',
    );
    if (ok) setEditing(null);
  };

  const remove = (category) => {
    if (!window.confirm(`Delete the "${category.category_name}" category?`)) return;
    run(() => call(`/admin/categories/${category.category_id}`, { method: 'DELETE' }), 'Category deleted.');
  };

  return (
    <>
      <PageTitle title="Categories" subtitle="Organize events into categories. A category in use can't be deleted." />

      <div className="space-y-3">
        {notice && <Notice>{notice}</Notice>}
        {(problem || error) && <Notice type="error">{problem || error}</Notice>}
      </div>

      <form onSubmit={add} className="my-4 flex max-w-md items-end gap-2">
        <Field label="New category" className="flex-1">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hackathon" required />
        </Field>
        <Button type="submit"><Plus size={16} /> Add</Button>
      </form>

      {!categories ? (
        <p className="text-sm text-zinc-500">Loading categories...</p>
      ) : categories.length === 0 ? (
        <EmptyState>No categories yet. Add the first one above.</EmptyState>
      ) : (
        <Card className="max-w-2xl">
          <Table>
            <thead>
              <tr><Th>Category</Th><Th>Events</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.category_id}>
                  <Td className="font-medium">{c.category_name}</Td>
                  <Td>{c.events_count}</Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditing(c); setEditName(c.category_name); }}>Rename</Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => remove(c)}>Delete</Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Dialog open={Boolean(editing)} onClose={() => setEditing(null)} title="Rename category">
        <form onSubmit={save} className="space-y-4">
          <Field label="Category name"><Input value={editName} onChange={(e) => setEditName(e.target.value)} required /></Field>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
