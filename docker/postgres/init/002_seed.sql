insert into app_users (name, username, password_hash, role, is_active) values
  ('Admin Master', 'admin', encode(digest('admin123', 'sha256'), 'hex'), 'admin', true)
on conflict (username) do update set
  name = excluded.name,
  password_hash = excluded.password_hash,
  role = excluded.role,
  is_active = excluded.is_active;
