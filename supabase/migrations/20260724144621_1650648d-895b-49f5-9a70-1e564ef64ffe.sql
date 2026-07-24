
CREATE POLICY "Staff read compliance-docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'compliance-docs' AND public.has_any_role(auth.uid()));
CREATE POLICY "Staff write compliance-docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'compliance-docs' AND public.has_any_role(auth.uid()));
CREATE POLICY "Staff update compliance-docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'compliance-docs' AND public.has_any_role(auth.uid()));
CREATE POLICY "Staff delete compliance-docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'compliance-docs' AND public.has_any_role(auth.uid()));
