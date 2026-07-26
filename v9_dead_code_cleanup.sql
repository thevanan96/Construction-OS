-- check_in/check_out were superseded by start_time/end_time and have no code references left
alter table attendance drop column if exists check_in;
alter table attendance drop column if exists check_out;
