-- Private patient-document storage. Access is limited to admins and active operators
-- explicitly assigned to the patient. Parents do not receive document access.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('patient-documents', 'patient-documents', false, 10485760,
  array['application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "patient_docs_select" on storage.objects;
drop policy if exists "patient_docs_insert" on storage.objects;
drop policy if exists "patient_docs_update" on storage.objects;
drop policy if exists "patient_docs_delete" on storage.objects;

create policy "patient_docs_select" on storage.objects for select to authenticated using (
 bucket_id = 'patient-documents' and (
  (select private.is_admin()) or exists (
   select 1 from public.patient_access pa join public.profiles p on p.id = pa.user_id
   where pa.user_id = (select auth.uid()) and pa.patient_id::text = (storage.foldername(name))[1]
    and pa.access_type = 'operator' and p.role = 'operator' and p.is_active = true
  )
 )
);
create policy "patient_docs_insert" on storage.objects for insert to authenticated with check (
 bucket_id = 'patient-documents' and (
  (select private.is_admin()) or exists (
   select 1 from public.patient_access pa join public.profiles p on p.id = pa.user_id
   where pa.user_id = (select auth.uid()) and pa.patient_id::text = (storage.foldername(name))[1]
    and pa.access_type = 'operator' and p.role = 'operator' and p.is_active = true
  )
 )
);
create policy "patient_docs_update" on storage.objects for update to authenticated using (
 bucket_id = 'patient-documents' and (
  (select private.is_admin()) or exists (
   select 1 from public.patient_access pa join public.profiles p on p.id = pa.user_id
   where pa.user_id = (select auth.uid()) and pa.patient_id::text = (storage.foldername(name))[1]
    and pa.access_type = 'operator' and p.role = 'operator' and p.is_active = true
  )
 )
) with check (
 bucket_id = 'patient-documents' and (
  (select private.is_admin()) or exists (
   select 1 from public.patient_access pa join public.profiles p on p.id = pa.user_id
   where pa.user_id = (select auth.uid()) and pa.patient_id::text = (storage.foldername(name))[1]
    and pa.access_type = 'operator' and p.role = 'operator' and p.is_active = true
  )
 )
);
create policy "patient_docs_delete" on storage.objects for delete to authenticated using (
 bucket_id = 'patient-documents' and (
  (select private.is_admin()) or exists (
   select 1 from public.patient_access pa join public.profiles p on p.id = pa.user_id
   where pa.user_id = (select auth.uid()) and pa.patient_id::text = (storage.foldername(name))[1]
    and pa.access_type = 'operator' and p.role = 'operator' and p.is_active = true
  )
 )
);
