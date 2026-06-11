insert into groups (id, name) values
  ('A', 'Grupo A'),
  ('B', 'Grupo B'),
  ('C', 'Grupo C'),
  ('D', 'Grupo D'),
  ('E', 'Grupo E'),
  ('F', 'Grupo F'),
  ('G', 'Grupo G'),
  ('H', 'Grupo H'),
  ('I', 'Grupo I'),
  ('J', 'Grupo J'),
  ('K', 'Grupo K'),
  ('L', 'Grupo L')
on conflict (id) do nothing;

insert into app_users (name, username, password_hash, role, is_active) values
  ('Admin Master', 'admin', encode(digest('admin123', 'sha256'), 'hex'), 'admin', true),
  ('Lucas Alves', 'lucas.alves', encode(digest('bolao123', 'sha256'), 'hex'), 'participant', true),
  ('Paula Lima', 'paula.lima', encode(digest('bolao123', 'sha256'), 'hex'), 'participant', true),
  ('Bruno Rocha', 'bruno.rocha', encode(digest('bolao123', 'sha256'), 'hex'), 'participant', true)
on conflict (username) do nothing;

insert into teams (code, name, group_id) values
  ('MEX', 'Mexico', 'A'),
  ('RSA', 'South Africa', 'A'),
  ('KOR', 'South Korea', 'A'),
  ('USA', 'United States', 'D'),
  ('PAR', 'Paraguay', 'D'),
  ('NED', 'Netherlands', 'F'),
  ('JPN', 'Japan', 'F'),
  ('ESP', 'Spain', 'H'),
  ('CPV', 'Cape Verde', 'H'),
  ('FRA', 'France', 'I'),
  ('SEN', 'Senegal', 'I')
on conflict (code, group_id) do nothing;

insert into matches (
  external_id,
  stage,
  stage_label,
  group_name,
  home_team_id,
  away_team_id,
  kickoff_at_utc,
  status,
  home_score,
  away_score
) values
  (
    'm1',
    'group',
    'Grupo A',
    'A',
    (select id from teams where code = 'MEX' and group_id = 'A'),
    (select id from teams where code = 'RSA' and group_id = 'A'),
    '2026-06-11T23:00:00Z',
    'finished',
    2,
    0
  ),
  (
    'm2',
    'group',
    'Grupo D',
    'D',
    (select id from teams where code = 'USA' and group_id = 'D'),
    (select id from teams where code = 'PAR' and group_id = 'D'),
    '2026-06-12T22:00:00Z',
    'finished',
    1,
    1
  ),
  (
    'm3',
    'group',
    'Grupo F',
    'F',
    (select id from teams where code = 'NED' and group_id = 'F'),
    (select id from teams where code = 'JPN' and group_id = 'F'),
    '2026-06-14T18:00:00Z',
    'finished',
    0,
    1
  ),
  (
    'm4',
    'group',
    'Grupo H',
    'H',
    (select id from teams where code = 'ESP' and group_id = 'H'),
    (select id from teams where code = 'CPV' and group_id = 'H'),
    '2026-06-15T20:00:00Z',
    'scheduled',
    null,
    null
  ),
  (
    'm5',
    'group',
    'Grupo I',
    'I',
    (select id from teams where code = 'FRA' and group_id = 'I'),
    (select id from teams where code = 'SEN' and group_id = 'I'),
    '2026-06-16T19:00:00Z',
    'scheduled',
    null,
    null
  ),
  (
    'm6',
    'group',
    'Grupo A',
    'A',
    (select id from teams where code = 'MEX' and group_id = 'A'),
    (select id from teams where code = 'KOR' and group_id = 'A'),
    '2026-06-18T23:00:00Z',
    'in_progress',
    null,
    null
  )
on conflict (external_id) do nothing;

insert into predictions (user_id, match_id, predicted_home_score, predicted_away_score, points_awarded)
values
  (
    (select id from app_users where username = 'lucas.alves'),
    (select id from matches where external_id = 'm1'),
    2,
    0,
    5
  ),
  (
    (select id from app_users where username = 'lucas.alves'),
    (select id from matches where external_id = 'm2'),
    1,
    1,
    5
  ),
  (
    (select id from app_users where username = 'lucas.alves'),
    (select id from matches where external_id = 'm3'),
    1,
    2,
    2
  ),
  (
    (select id from app_users where username = 'lucas.alves'),
    (select id from matches where external_id = 'm4'),
    3,
    1,
    0
  ),
  (
    (select id from app_users where username = 'paula.lima'),
    (select id from matches where external_id = 'm1'),
    2,
    1,
    2
  ),
  (
    (select id from app_users where username = 'paula.lima'),
    (select id from matches where external_id = 'm2'),
    0,
    0,
    2
  ),
  (
    (select id from app_users where username = 'paula.lima'),
    (select id from matches where external_id = 'm3'),
    0,
    1,
    5
  ),
  (
    (select id from app_users where username = 'paula.lima'),
    (select id from matches where external_id = 'm4'),
    2,
    1,
    0
  ),
  (
    (select id from app_users where username = 'bruno.rocha'),
    (select id from matches where external_id = 'm1'),
    1,
    0,
    2
  ),
  (
    (select id from app_users where username = 'bruno.rocha'),
    (select id from matches where external_id = 'm2'),
    2,
    1,
    0
  ),
  (
    (select id from app_users where username = 'bruno.rocha'),
    (select id from matches where external_id = 'm3'),
    1,
    1,
    0
  )
on conflict (user_id, match_id) do nothing;
