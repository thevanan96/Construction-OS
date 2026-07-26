-- Single, lifetime-of-project budget per site (no date range). Compared against
-- all-time actual cost (labor + expenses) for that site on the Reports page.

alter table sites add column budget numeric;
