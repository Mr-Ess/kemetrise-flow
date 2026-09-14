CREATE POLICY "attachments_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'attachments');
CREATE POLICY "attachments_write" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments' AND owner = auth.uid());
CREATE POLICY "attachments_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'attachments' AND owner = auth.uid()) WITH CHECK (bucket_id = 'attachments' AND owner = auth.uid());
CREATE POLICY "attachments_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'attachments' AND owner = auth.uid());