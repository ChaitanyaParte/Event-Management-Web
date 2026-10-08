import { useEffect, useState } from 'react';
import PageTitle from '../../components/PageTitle';
import { Button, Card, Field, Input, Notice } from '../../components/ui';
import { useRoleApi } from '../../hooks/useRoleApi';

export default function Profile() {
  const call = useRoleApi('admin');
  const [profile, setProfile] = useState(null);
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' });
  const [profileMessage, setProfileMessage] = useState(null);
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    call('/admin/profile')
      .then(setProfile)
      .catch((err) => setProfileMessage({ type: 'error', text: err.message }));
  }, [call]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileMessage(null);
    try {
      const updated = await call('/admin/profile', { method: 'PUT', body: { full_name: profile.full_name, email: profile.email } });
      setProfile(updated);
      setProfileMessage({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.message });
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordMessage(null);
    if (passwords.new_password !== passwords.confirm) {
      setPasswordMessage({ type: 'error', text: "The new passwords don't match." });
      return;
    }
    try {
      await call('/admin/profile/change-password', {
        method: 'PUT',
        body: { current_password: passwords.current_password, new_password: passwords.new_password },
      });
      setPasswords({ current_password: '', new_password: '', confirm: '' });
      setPasswordMessage({ type: 'success', text: 'Password changed.' });
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.message });
    }
  };

  const update = (event) => setProfile({ ...profile, [event.target.name]: event.target.value });
  const updatePassword = (event) => setPasswords({ ...passwords, [event.target.name]: event.target.value });

  return (
    <>
      <PageTitle title="Profile" subtitle="Manage your admin account." />
      {!profile ? (
        <p className="text-sm text-zinc-500">{profileMessage?.text || 'Loading your profile...'}</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold">Account details</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <Field label="Username" hint="Can't be changed."><Input value={profile.username} disabled readOnly /></Field>
              <Field label="Full name"><Input name="full_name" value={profile.full_name} onChange={update} required /></Field>
              <Field label="Email"><Input type="email" name="email" value={profile.email} onChange={update} required /></Field>
              {profileMessage && <Notice type={profileMessage.type}>{profileMessage.text}</Notice>}
              <Button type="submit">Save profile</Button>
            </form>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold">Change password</h2>
            <form onSubmit={changePassword} className="space-y-4">
              <Field label="Current password"><Input type="password" name="current_password" value={passwords.current_password} onChange={updatePassword} required /></Field>
              <Field label="New password" hint="At least 6 characters."><Input type="password" name="new_password" value={passwords.new_password} onChange={updatePassword} required minLength={6} /></Field>
              <Field label="Confirm new password"><Input type="password" name="confirm" value={passwords.confirm} onChange={updatePassword} required /></Field>
              {passwordMessage && <Notice type={passwordMessage.type}>{passwordMessage.text}</Notice>}
              <Button type="submit">Change password</Button>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
