create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  username text,
  avatar_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  primary key (id)
);


alter table public.profiles enable row level security;
create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);


create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


drop policy if exists "Anyone can view images" on public.images;
drop policy if exists "Anyone can upload images" on public.images;
drop policy if exists "Anyone can delete images" on public.images;
drop policy if exists "Anyone can update images" on public.images;


create policy "Users can view own images"
  on public.images for select
  using (auth.uid() = user_id);

create policy "Users can upload own images"
  on public.images for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own images"
  on public.images for delete
  using (auth.uid() = user_id);

create policy "Users can update own images"
  on public.images for update
  using (auth.uid() = user_id);


drop policy if exists "Anyone can upload images" on storage.objects;
drop policy if exists "Anyone can view images" on storage.objects;
drop policy if exists "Anyone can delete images" on storage.objects;

create policy "Users can upload own images"
  on storage.objects for insert
  with check (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own images"
  on storage.objects for select
  using (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own images"
  on storage.objects for delete
  using (bucket_id = 'images' and auth.uid()::text = (storage.foldername(name))[1]);