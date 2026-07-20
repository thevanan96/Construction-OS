-- Allow custom expense categories beyond the original fixed 4 (materials/equipment/subcontractor/other)
alter table expenses drop constraint if exists expenses_category_check;
alter table expenses add constraint expenses_category_not_blank check (btrim(category) <> '');
